export const ASSIGNMENT_STATUSES = [
  "draft",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const GENERATION_STATUSES = [
  "idle",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const QUESTION_TYPES = [
  "MCQ",
  "Short Answer",
  "Long Answer",
  "True/False",
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionTypeInput {
  type: QuestionType;
  numQuestions: number;
  marksPerQuestion: number;
}

export interface FileMetadataInput {
  name: string;
  size: number;
  type: string;
}

export interface CreateAssignmentDto {
  title?: string;
  dueDate: string;
  difficulty: DifficultyLevel;
  questionTypes: QuestionTypeInput[];
  instructions?: string;
  file?: FileMetadataInput | null;
  extractedText?: string;
  additionalInstructions?: string;
  userId: string;
  subject?: string;
  gradeClass?: string;
  topic?: string;
}

export interface AssignmentStatusResponse {
  assignmentId: string;
  status: AssignmentStatus;
  generationStatus: GenerationStatus;
  progress: number;
  jobId?: string;
  error?: string;
  updatedAt: string;
}

export interface ParsedQuestion {
  question: string;
  difficulty: DifficultyLevel;
  marks: number;
  type?: string;
  options?: string[];
  sampleAnswer?: string;
}

export interface ParsedSection {
  title: string;
  instruction: string;
  questions: ParsedQuestion[];
}

export interface StructuredAssessmentOutput {
  sections: ParsedSection[];
}
