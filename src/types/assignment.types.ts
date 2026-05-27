export type QuestionType = 
  | "MCQ" 
  | "Short Answer" 
  | "Long Answer" 
  | "True/False"
  | "Multiple Choice Questions"
  | "Short Questions"
  | "Diagram/Graph-Based Questions"
  | "Numerical Problems";

export type DifficultyPreference = "easy" | "medium" | "hard";

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface QuestionTypeRow {
  id: string;
  type: QuestionType;
  numQuestions: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  file?: FileMetadata | null;
  dueDate: string;
  questionTypeRows: QuestionTypeRow[];
  totalQuestions: number;
  totalMarks: number;
  difficulty: DifficultyPreference;
  additionalInstructions?: string;
}

export interface Question {
  id: string;
  number: number;
  type: string;
  text: string;
  marks: number;
  options?: string[];
  sampleAnswer?: string;
  difficulty?: string;
}

export interface GeneratedAssignment {
  id: string;
  title: string;
  difficulty: DifficultyPreference;
  totalMarks: number;
  numQuestions: number;
  dueDate: string;
  questions: Question[];
  subject?: string;
  gradeClass?: string;
}
