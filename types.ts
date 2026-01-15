
export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Formula {
  expression: string;
  label: string;
}

export interface CourseSection {
  id: string;
  title: string;
  summary: string;
  content: string; 
  keyTerms: KeyTerm[];
  formulas: Formula[];
  mindmap: string; 
  sourceReference: string;
  status: 'locked' | 'in-progress' | 'completed';
  mastery: number; 
  chatHistory: Message[];
  flashcards: Flashcard[];
  practiceQuestions: PracticeQuestion[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  isAiSuggested?: boolean;
  masteryStatus?: 'learning' | 'mastered';
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hasBeenAnswered?: boolean;
  wasCorrect?: boolean;
}

export interface Concept extends CourseSection {
  dependencies: string[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  durationMinutes: number;
  focus: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'txt';
  uploadDate: string;
}

export interface Workspace {
  fileInfo: FileMetadata;
  subject: string;
  sections: CourseSection[];
  activeSectionIndex: number;
  attachment?: FileAttachment | null;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: { title: string; url: string; reference?: string }[];
  visualType?: 'mermaid' | 'chart' | 'image';
  visualData?: string;
}

export interface FileAttachment {
  data: string; 
  mimeType: string;
  name: string;
}
