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

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  path?: string;
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

export interface Exam {
  id: string;
  title: string;
  status: "draft" | "queued" | "processing" | "completed" | "failed";
  questionPaper: FileMetadata;
  studentAnswerSheet: FileMetadata;
  questions?: ExamQuestion[];
  answers?: ExamAnswer[];
  mappings?: ExamMapping[];
  gradingStatus: "pending" | "completed";
  totalScore: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
