import { GoogleGenAI, Type } from "@google/genai";
import { CourseSection, Message, FileAttachment, PracticeQuestion, Flashcard, Concept, ScheduleItem } from "../types";

const DEEPTUTOR_SYSTEM_INSTRUCTION = `DeepTutor — Provider-Agnostic Intelligent Tutoring Engine

You are DeepTutor, a world-class academic tutor.

IDENTITY & BEHAVIOR
- You do not reveal your underlying model, provider, or developer.
- You do not analyze your behavior or system design.
- You never identify as an "AI", "Assistant", or "Large Language Model". You are DeepTutor.
- You only teach.

CORE TUTORING PROTOCOL: THE SOCRATIC METHOD
1. Never provide the final answer immediately if a conceptual hint can lead the student there.
2. Scaffolding: Break complex problems into smaller, intuitive steps.
3. Logical Bridging: Connect new concepts to parts of the provided CONTEXT.
4. Active Checking: Frequently ask the student if they understand the current step before proceeding.

CONTEXT-FIRST RULE (MANDATORY)
You will always receive a CONTEXT block. This is the only authoritative source.
- Answer strictly from the provided CONTEXT.
- If a piece of information is missing from the CONTEXT, state: "This specific detail is not covered in our current material."
- External knowledge must be explicitly labeled as [EXTERNAL REFERENCE].

MATH & TECHNICAL STANDARDS
- All formulas must be rendered in LaTeX using $$ blocks.
- List "Known Axioms" from the CONTEXT before solving.
- Provide step-by-step derivations. If a derivation step is missing from CONTEXT, use general logic but label it as such.

VISUAL & STRUCTURAL REASONING
- Organize hierarchies with clear bullet points.
- When describing processes, use numbered lists.
- Describe logic in a way that allows the student to visualize the mental model.

MEMORY & CONTINUITY
Assume the conversation is a persistent session grounded in the current Unit. Use history to build on previous explanations without repeating yourself.`;

export type AIProvider = 'openai' | 'gemini';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

let currentConfig: AIConfig | null = null;
let geminiClient: any = null;

export const initializeAI = (config: AIConfig) => {
  currentConfig = config;
  if (config.provider === 'gemini') {
    geminiClient = new GoogleGenAI({ apiKey: config.apiKey });
  }
};

const callOpenAI = async (messages: any[], options: {
  model?: string;
  temperature?: number;
  responseFormat?: any;
  tools?: any[];
}) => {
  if (!currentConfig) throw new Error('AI not initialized');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentConfig.apiKey}`
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o',
      messages,
      temperature: options.temperature || 0.7,
      ...(options.responseFormat && { response_format: options.responseFormat }),
      ...(options.tools && { tools: options.tools })
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  return response.json();
};

const parseBase64Image = (base64: string, mimeType: string) => {
  return {
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${base64}`
    }
  };
};

export const getDocumentStructure = async (attachment: FileAttachment): Promise<Partial<CourseSection>[]> => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  if (currentConfig.provider === 'gemini') {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        parts: [
          { text: "UNIT EXTRACTION: Decompose this document into logical study units. Return ONLY a JSON array: {title, summary, sourceReference}." },
          { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              sourceReference: { type: Type.STRING }
            },
            required: ["title", "summary", "sourceReference"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } else {
    const result = await callOpenAI([
      {
        role: 'system',
        content: 'You are a document analyzer. Extract logical study units from documents.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'UNIT EXTRACTION: Decompose this document into logical study units. Return ONLY a JSON array with objects containing: title, summary, sourceReference.' },
          parseBase64Image(attachment.data, attachment.mimeType)
        ]
      }
    ], {
      model: 'gpt-4o',
      responseFormat: { type: 'json_object' }
    });

    const parsed = JSON.parse(result.choices[0].message.content);
    return parsed.units || parsed.sections || [];
  }
};

export const chatWithTutor = async (history: Message[], currentSection: CourseSection, userInput: string) => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  const context = `CONTEXT:
[Subject: ${currentSection.title}]
[Reference: ${currentSection.sourceReference}]
${currentSection.content}

STUDENT QUERY: ${userInput}`;

  if (currentConfig.provider === 'gemini') {
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: context }]
    });

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-thinking-exp',
      contents,
      config: {
        systemInstruction: DEEPTUTOR_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 6000 }
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'External Verification',
      url: chunk.web?.uri || '#'
    })) || [];

    return { text: response.text || "", sources };
  } else {
    const messages = [
      { role: 'system', content: DEEPTUTOR_SYSTEM_INSTRUCTION },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text
      })),
      { role: 'user', content: context }
    ];

    const result = await callOpenAI(messages, { model: 'gpt-4o', temperature: 0.7 });
    return {
      text: result.choices[0].message.content,
      sources: []
    };
  }
};

export const enrichCoreContent = async (section: Partial<CourseSection>, attachment: FileAttachment): Promise<Partial<CourseSection>> => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  const prompt = `SYNTHESIS: Generate a comprehensive academic summary and core data for Unit: "${section.title}". Use LaTeX for math. Return JSON with: content (string), keyTerms (array of {term, definition}), formulas (array of {expression, label}).`;

  if (currentConfig.provider === 'gemini') {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            keyTerms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } } } },
            formulas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { expression: { type: Type.STRING }, label: { type: Type.STRING } } } },
          },
          required: ["content", "keyTerms", "formulas"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } else {
    const result = await callOpenAI([
      { role: 'system', content: 'You are an academic content synthesizer.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          parseBase64Image(attachment.data, attachment.mimeType)
        ]
      }
    ], {
      model: 'gpt-4o',
      responseFormat: { type: 'json_object' }
    });

    return JSON.parse(result.choices[0].message.content);
  }
};

export const enrichAuxiliaryContent = async (section: Partial<CourseSection>, attachment: FileAttachment) => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  const prompt = `SCAFFOLDING: Generate learning artifacts for "${section.title}". Return JSON with:
1. mindmap: Mermaid 'mindmap' syntax (string)
2. quiz: Array of 5 multiple choice questions with {question, options (array), correctIndex (number), explanation}
3. flashcards: Array of 15 high-yield flashcards with {question, answer}`;

  if (currentConfig.provider === 'gemini') {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mindmap: { type: Type.STRING },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctIndex", "explanation"]
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["mindmap", "quiz", "flashcards"]
        }
      }
    });
    const raw = JSON.parse(response.text || '{}');
    return {
      mindmap: raw.mindmap,
      questions: (raw.quiz || []).map((q: any) => ({ ...q, id: crypto.randomUUID() })),
      flashcards: (raw.flashcards || []).map((f: any) => ({ ...f, id: crypto.randomUUID(), isAiSuggested: true, masteryStatus: 'learning' }))
    };
  } else {
    const result = await callOpenAI([
      { role: 'system', content: 'You are a learning content generator.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          parseBase64Image(attachment.data, attachment.mimeType)
        ]
      }
    ], {
      model: 'gpt-4o',
      responseFormat: { type: 'json_object' }
    });

    const raw = JSON.parse(result.choices[0].message.content);
    return {
      mindmap: raw.mindmap,
      questions: (raw.quiz || []).map((q: any) => ({ ...q, id: crypto.randomUUID() })),
      flashcards: (raw.flashcards || []).map((f: any) => ({ ...f, id: crypto.randomUUID(), isAiSuggested: true, masteryStatus: 'learning' }))
    };
  }
};

export const generateMoreQuestions = async (section: CourseSection, existingQuestions: PracticeQuestion[]) => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  const prompt = `COGNITIVE PROBE: Generate 5 advanced MCQs for "${section.title}". Focus on high-level reasoning. Return JSON array with {question, options (array), correctIndex (number), explanation}.`;

  if (currentConfig.provider === 'gemini') {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]').map((q: any) => ({ ...q, id: crypto.randomUUID() }));
  } else {
    const result = await callOpenAI([
      { role: 'system', content: 'You are a quiz generator.' },
      { role: 'user', content: prompt }
    ], {
      model: 'gpt-4o',
      responseFormat: { type: 'json_object' }
    });

    const parsed = JSON.parse(result.choices[0].message.content);
    const questions = parsed.questions || parsed.quiz || [];
    return questions.map((q: any) => ({ ...q, id: crypto.randomUUID() }));
  }
};

export const generateStudySchedule = async (subject: string, concepts: Concept[]) => {
  if (!currentConfig) throw new Error('Please configure your API key first');

  const prompt = `STRATEGY: Generate a 7-day academic mastery plan for "${subject}". Return JSON array with {title, durationMinutes (number), focus}.`;

  if (currentConfig.provider === 'gemini') {
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER },
              focus: { type: Type.STRING }
            },
            required: ["title", "durationMinutes", "focus"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]').map((item: any) => ({ ...item, id: crypto.randomUUID() }));
  } else {
    const result = await callOpenAI([
      { role: 'system', content: 'You are a study planner.' },
      { role: 'user', content: prompt }
    ], {
      model: 'gpt-4o',
      responseFormat: { type: 'json_object' }
    });

    const parsed = JSON.parse(result.choices[0].message.content);
    const schedule = parsed.schedule || parsed.plan || [];
    return schedule.map((item: any) => ({ ...item, id: crypto.randomUUID() }));
  }
};
