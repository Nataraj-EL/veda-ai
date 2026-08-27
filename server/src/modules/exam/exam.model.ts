import mongoose, { Schema, type Document, type Model } from "mongoose";
import type {
  ExamStatus,
  ExamQuestion,
  ExamAnswer,
  ExamMapping,
  FileMetadata,
} from "./exam.types.js";

export interface IExam extends Document {
  title: string;
  status: ExamStatus;
  questionPaper: FileMetadata;
  studentAnswerSheet: FileMetadata;
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  mappings: ExamMapping[];
  userId: string;
  gradingStatus: "pending" | "completed";
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const boundingBoxSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const regionSchema = new Schema(
  {
    pageNumber: { type: Number, required: true },
    boundingBox: { type: boundingBoxSchema, required: true },
  },
  { _id: false }
);

const fileMetadataSchema = new Schema(
  {
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    path: { type: String },
    data: { type: String },
  },
  { _id: false }
);

const examQuestionSchema = new Schema(
  {
    questionNumber: { type: String, required: true },
    text: { type: String, required: true },
    marks: { type: Number, required: true },
    regions: { type: [regionSchema], default: [] },
  },
  { _id: false }
);

const examAnswerSchema = new Schema(
  {
    questionNumber: { type: String, required: true },
    text: { type: String, required: true },
    regions: { type: [regionSchema], default: [] },
  },
  { _id: false }
);

const examMappingSchema = new Schema(
  {
    questionNumber: { type: String, required: true },
    matched: { type: Boolean, required: true },
    extractedAnswerIndex: { type: Number },
    score: { type: Number },
    feedback: { type: String },
    teacherComment: { type: String },
  },
  { _id: false }
);

const examSchema = new Schema<IExam>(
  {
    title: { type: String, default: "Exam Paper", trim: true },
    status: {
      type: String,
      enum: ["draft", "queued", "processing", "completed", "failed"],
      default: "completed",
      index: true,
    },
    questionPaper: { type: fileMetadataSchema, required: true },
    studentAnswerSheet: { type: fileMetadataSchema, required: true },
    questions: { type: [examQuestionSchema], default: [] },
    answers: { type: [examAnswerSchema], default: [] },
    mappings: { type: [examMappingSchema], default: [] },
    userId: { type: String, required: true, index: true },
    gradingStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
    totalScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

examSchema.index({ userId: 1, createdAt: -1 });

export const Exam: Model<IExam> =
  mongoose.models.Exam ?? mongoose.model<IExam>("Exam", examSchema);
