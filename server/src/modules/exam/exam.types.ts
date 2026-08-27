export type ExamStatus = "draft" | "queued" | "processing" | "completed" | "failed";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Region {
  pageNumber: number;
  boundingBox: BoundingBox;
}

export interface ExamQuestion {
  questionNumber: string;
  text: string;
  marks: number;
  regions: Region[];
}

export interface ExamAnswer {
  questionNumber: string;
  text: string;
  regions: Region[];
}

export interface ExamMapping {
  questionNumber: string;
  matched: boolean;
  extractedAnswerIndex?: number;
  score?: number;
  feedback?: string;
  teacherComment?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  path?: string;
  buffer?: Buffer;
  data?: string;
}

export interface CreateExamDto {
  title: string;
  userId: string;
  questionPaper: FileMetadata;
  studentAnswerSheet: FileMetadata;
}
