import { z } from "zod";

const questionTypeSchema = z.enum([
  "MCQ", 
  "Short Answer", 
  "Long Answer", 
  "True/False",
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems"
]);

const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const fileMetadataSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().positive("File size must be positive"),
  type: z.string().min(1, "File type is required"),
});

export const questionTypeRowSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  numQuestions: z
    .coerce
    .number()
    .int("Questions count must be a whole number")
    .min(1, "Minimum 1 question required")
    .max(100, "Maximum question limit is 100"),
  marksPerQuestion: z
    .coerce
    .number()
    .positive("Marks must be a positive number")
    .min(0.5, "Minimum marks is 0.5"),
});

export const assignmentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, "Title cannot exceed 100 characters")
    .optional()
    .default(""),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(50, "Subject cannot exceed 50 characters"),
  gradeClass: z
    .string()
    .trim()
    .min(1, "Grade / Class is required")
    .max(50, "Grade / Class cannot exceed 50 characters"),
  file: fileMetadataSchema.nullable().optional(),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine((val) => {
      if (!val) return false;
      // Accept both native date input value (YYYY-MM-DD) and Figma-style DD-MM-YYYY
      const ddmmyyyy = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const normalized = ddmmyyyy
        ? `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
        : val;
      const selected = new Date(normalized);
      if (Number.isNaN(selected.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, "Due date cannot be in the past"),
  questionTypeRows: z
    .array(questionTypeRowSchema)
    .min(1, "Please add at least one question type row"),
  difficulty: difficultySchema,
  additionalInstructions: z
    .string()
    .max(1000, "Instructions cannot exceed 1000 characters")
    .optional(),
});

export type AssignmentFormSchemaType = z.infer<typeof assignmentFormSchema>;
