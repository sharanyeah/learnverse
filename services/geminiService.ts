
import { GoogleGenAI, Type } from "@google/genai";
import { CourseSection, Message, FileAttachment, PracticeQuestion, Flashcard, Concept, ScheduleItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const getDocumentStructure = async (attachment: FileAttachment): Promise<Partial<CourseSection>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
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
};

export const chatWithTutor = async (history: Message[], currentSection: CourseSection, userInput: string) => {
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: `CONTEXT:
    [Subject: ${currentSection.title}]
    [Reference: ${currentSection.sourceReference}]
    ${currentSection.content}
    
    STUDENT QUERY: ${userInput}` }]
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
};

export const enrichCoreContent = async (section: Partial<CourseSection>, attachment: FileAttachment): Promise<Partial<CourseSection>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ 
      parts: [
        { text: `SYNTHESIS: Generate a comprehensive academic summary and core data for Unit: "${section.title}". Use LaTeX for math. Return JSON.` },
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
};

export const enrichAuxiliaryContent = async (section: Partial<CourseSection>, attachment: FileAttachment) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ 
      parts: [
        { text: `SCAFFOLDING: Generate learning artifacts for "${section.title}". 
        1. Mindmap: Mermaid 'mindmap' syntax.
        2. Probes: 5 Multiple choice questions.
        3. Recalls: 15 High-yield flashcards.
        Return JSON.` },
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
};

export const generateMoreQuestions = async (section: CourseSection, existingQuestions: PracticeQuestion[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `COGNITIVE PROBE: Generate 5 advanced MCQs for "${section.title}". Focus on high-level reasoning. Return JSON.`,
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
};

export const generateStudySchedule = async (subject: string, concepts: Concept[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `STRATEGY: Generate a 7-day academic mastery plan for "${subject}". Return JSON.`,
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
};
