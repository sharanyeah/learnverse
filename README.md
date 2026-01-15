
# DeepTutor AI - Technical Documentation

DeepTutor V4 is a high-fidelity, AI-native tutoring system designed to transform static educational resources into interactive, Socratic learning environments. It leverages advanced reasoning models for real-time knowledge synthesis.

## 1. System Architecture

DeepTutor is built as a **Single Page Application (SPA)** using React 19 and Vite. It utilizes a modular approach for AI orchestration and state management.

### Tech Stack
- **Framework**: React 19 (Strict Mode)
- **AI Providers**: OpenAI (GPT-4o) or Google Gemini (2.0 Flash/Thinking) - *User Selectable*
- **State Management**: Zustand (with Persistence)
- **Data Layer**: TanStack Query (React Query V5)
- **Visuals**: Mermaid.js (Logic Maps), Recharts (Mastery Radar)
- **Math**: KaTeX + React Markdown (LaTeX Support)

## 2. Getting Started

### API Configuration

When you first open DeepTutor, you'll be prompted to configure your AI provider:

1. **Choose Provider**: Select between OpenAI or Gemini
2. **Enter API Key**:
   - **OpenAI**: Get your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Gemini**: Get your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
3. **Save**: Your configuration is stored locally in your browser

You can change providers at any time using the settings icon.

## 3. Model-Agnostic Design (Interoperable AI Protocol)

DeepTutor is designed to be provider-independent. Whether running on OpenAI GPT or Google Gemini, the system enforces a strict **Socratic Tutoring Protocol**:

- **Persona Neutrality**: The model never identifies its underlying architecture or developer. It acts exclusively as "DeepTutor".
- **Structured IO**: All auxiliary logic (Skeletonization, Quizzes, Flashcards) uses consistent JSON schemas, ensuring uniform output regardless of provider.
- **Socratic Logic**: The system instruction forbids direct answer delivery. Instead, it mandates scaffolding and hint-based guidance, creating a consistent user experience.

## 4. Core Modules

### AI Service (`services/aiService.ts`)
The intelligence layer uses a provider-agnostic design:
- **OpenAI Mode**: Uses GPT-4o for all tasks including vision, chat, and content generation
- **Gemini Mode**: Uses Gemini 2.0 Flash for content generation and Thinking models for tutoring
- **Advanced Model (Reasoning)**: Powers the **Socratic Tutor** chat. Uses deep reasoning (Thinking Budgets) to provide conceptual bridges and derivations.

### Global Store (`store.ts`)
State is managed via **Zustand**. All student data (workspaces, chat history, flashcards, and mastery scores) is automatically serialized to `localStorage`.

## 4. Learning Features

- **Knowledge Base**: Narrative summaries with auto-extracted "Core Lexicon" and "Extracted Axioms".
- **Logic Map**: conceptual hierarchies using Mermaid.js syntax.
- **Active Recall**: 3D-flipped flashcard system with integrated mastery tracking.
- **Exam Room**: Diagnostic probes that detect "Logical Divergence" and move incorrect answers into a review queue.
- **Academic Strategy**: Knowledge Radar charts mapping multi-unit mastery levels.

## 5. Deployment Guide

DeepTutor runs entirely in the browser with no backend required. API keys are stored locally in browser storage and sent directly to OpenAI or Gemini from the client.

### Deployment Options

#### Static Hosting (Recommended)
Deploy to any static hosting service:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Import from GitHub and set build command to `npm run build`
- **GitHub Pages**: Push the `dist` folder to a gh-pages branch
- **Render**:
  1. Create new "Static Site"
  2. Build Command: `npm install && npm run build`
  3. Publish Directory: `dist`

### Local Development
```bash
npm install
npm run dev
```

## 6. Security & Safety
- **Context Grounding**: DeepTutor follows a strict "Context-First" rule. It is instructed to prioritize retrieved document chunks over general knowledge.
- **Local Persistence**: No student data is stored on a centralized server; all learning artifacts stay on the user's device via browser storage.
