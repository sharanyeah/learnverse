
# DeepTutor AI - Technical Documentation

DeepTutor V4 is a high-fidelity, AI-native tutoring system designed to transform static educational resources into interactive, Socratic learning environments. It leverages advanced reasoning models for real-time knowledge synthesis.

## 1. System Architecture

DeepTutor is built as a **Single Page Application (SPA)** using React 19 and Vite. It utilizes a modular approach for AI orchestration and state management.

### Tech Stack
- **Framework**: React 19 (Strict Mode)
- **AI Engine**: `@google/genai` (SDK 1.35.0+) - *Configured for Interoperability*
- **State Management**: Zustand (with Persistence)
- **Data Layer**: TanStack Query (React Query V5)
- **Visuals**: Mermaid.js (Logic Maps), Recharts (Mastery Radar)
- **Math**: KaTeX + React Markdown (LaTeX Support)

## 2. Model-Agnostic Design (Interoperable AI Protocol)

DeepTutor is designed to be provider-independent. Whether running on Google Gemini, OpenAI GPT, or Anthropic Claude, the system enforces a strict **Socratic Tutoring Protocol**:

- **Persona Neutrality**: The model never identifies its underlying architecture or developer. It acts exclusively as "DeepTutor".
- **Structured IO**: All auxiliary logic (Skeletonization, Quizzes, Flashcards) is governed by OpenAPI-compliant JSON schemas, ensuring that any high-parameter model produces identical data structures.
- **Socratic Logic**: The system instruction forbids direct answer delivery. Instead, it mandates scaffolding and hint-based guidance, creating a consistent user experience regardless of the model provider.

## 3. Core Modules

### AI Service (`services/aiService.ts`)
The intelligence layer uses a dual-model strategy:
- **Base Model (Efficiency)**: Handles "Skeletonization" and "Enrichment". Optimized for high-throughput JSON output.
- **Advanced Model (Reasoning)**: Powers the **Socratic Tutor** chat. Uses deep reasoning (Thinking Budgets) to provide conceptual bridges and derivations.

### Global Store (`store.ts`)
State is managed via **Zustand**. All student data (workspaces, chat history, flashcards, and mastery scores) is automatically serialized to `localStorage`.

## 4. Learning Features

- **Knowledge Base**: Narrative summaries with auto-extracted "Core Lexicon" and "Extracted Axioms".
- **Logic Map**: conceptual hierarchies using Mermaid.js syntax.
- **Active Recall**: 3D-flipped flashcard system with integrated mastery tracking.
- **Exam Room**: Diagnostic probes that detect "Logical Divergence" and move incorrect answers into a review queue.
- **Academic Strategy**: Knowledge Radar charts mapping multi-unit mastery levels.

## 5. Deployment Guide (Render)

### Prerequisites
- A valid API Key for the configured provider.
- A GitHub repository containing this project.

### Step-by-Step Deployment
1. **Create Site**: On Render, click "New" -> "Static Site".
2. **Connect Repo**: Select your DeepTutor repository.
3. **Build Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**:
   - Add `API_KEY` and paste your key.
5. **Deploy**: Render will build and serve your site.

## 6. Security & Safety
- **Context Grounding**: DeepTutor follows a strict "Context-First" rule. It is instructed to prioritize retrieved document chunks over general knowledge.
- **Local Persistence**: No student data is stored on a centralized server; all learning artifacts stay on the user's device via browser storage.
