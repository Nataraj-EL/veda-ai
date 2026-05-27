import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type {
  AssignmentStatus,
  DifficultyLevel,
  GenerationStatus,
  QuestionType,
  StructuredAssessmentOutput,
} from "./assignment.types.js";

export interface IQuestionTypeRow {
  type: QuestionType;
  numQuestions: number;
  marksPerQuestion: number;
}

export interface IFileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface IAssignment extends Document {
  title: string;
  dueDate: Date;
  instructions?: string;
  additionalInstructions?: string;
  file?: IFileMetadata;
  extractedText?: string;
  questionTypes: IQuestionTypeRow[];
  difficulty: DifficultyLevel;
  totalQuestions: number;
  totalMarks: number;
  status: AssignmentStatus;
  generationStatus: GenerationStatus;
  generationProgress: number;
  generationError?: string;
  activeJobId?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  subject?: string;
  gradeClass?: string;
  topic?: string;
}

export interface IGeneratedAssessment extends Document {
  assignmentId: Types.ObjectId;
  sections: StructuredAssessmentOutput["sections"];
  difficulty: DifficultyLevel;
  totalMarks: number;
  totalQuestions: number;
  metadata: {
    model?: string;
    promptVersion: string;
    generatedAt: string;
    source: "openai" | "gemini" | "groq" | "structured-fallback";
  };
  generationStatus: GenerationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const questionTypeRowSchema = new Schema<IQuestionTypeRow>(
  {
    type: { type: String, required: true },
    numQuestions: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 0.5 },
  },
  { _id: false }
);

const fileMetadataSchema = new Schema<IFileMetadata>(
  {
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
  },
  { _id: false }
);

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, default: "Assignment", trim: true },
    dueDate: { type: Date, required: true },
    instructions: { type: String },
    additionalInstructions: { type: String },
    file: { type: fileMetadataSchema },
    extractedText: { type: String },
    questionTypes: { type: [questionTypeRowSchema], required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    totalQuestions: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    generationStatus: {
      type: String,
      enum: ["idle", "queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    generationProgress: { type: Number, default: 0, min: 0, max: 100 },
    generationError: { type: String },
    activeJobId: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    subject: { type: String },
    gradeClass: { type: String },
    topic: { type: String },
  },
  { timestamps: true }
);

// Database optimization: Compound index for filtering assignments by user and sorting by date
assignmentSchema.index({ userId: 1, createdAt: -1 });

const parsedQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    marks: { type: Number, required: true },
    type: { type: String },
    options: { type: [String] },
    sampleAnswer: { type: String },
  },
  { _id: false }
);

const parsedSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [parsedQuestionSchema], required: true },
  },
  { _id: false }
);

const generatedAssessmentSchema = new Schema<IGeneratedAssessment>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      unique: true,
      index: true,
    },
    sections: { type: [parsedSectionSchema], required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    metadata: {
      model: { type: String },
      promptVersion: { type: String, required: true },
      generatedAt: { type: String, required: true },
      source: {
        type: String,
        enum: ["openai", "gemini", "groq", "structured-fallback"],
        required: true,
      },
    },
    generationStatus: {
      type: String,
      enum: ["idle", "queued", "processing", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export const Assignment: Model<IAssignment> =
  mongoose.models.Assignment ??
  mongoose.model<IAssignment>("Assignment", assignmentSchema);

export const GeneratedAssessment: Model<IGeneratedAssessment> =
  mongoose.models.GeneratedAssessment ??
  mongoose.model<IGeneratedAssessment>(
    "GeneratedAssessment",
    generatedAssessmentSchema
  );
