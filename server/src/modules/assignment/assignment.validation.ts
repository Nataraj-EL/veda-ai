import { z } from "zod";
import { DIFFICULTY_LEVELS, QUESTION_TYPES } from "./assignment.types.js";

const questionTypeInputSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  numQuestions: z.coerce.number().int().min(1).max(100),
  marksPerQuestion: z.coerce.number().positive().min(0.5).max(100),
});

const fileMetadataSchema = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  type: z.string().min(1),
});

export const createAssignmentSchema = z.object({
  title: z.string().trim().max(100).optional().default(""),
  dueDate: z
    .string()
    .min(1)
    .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid due date"),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  questionTypes: z.array(questionTypeInputSchema).min(1),
  instructions: z.string().max(2000).optional(),
  file: fileMetadataSchema.nullable().optional(),
  extractedText: z.string().optional(),
  additionalInstructions: z.string().max(1000).optional(),
  userId: z.string().min(1, "User ID is required"),
  subject: z.string().optional(),
  gradeClass: z.string().optional(),
  topic: z.string().optional(),
});

export const assignmentIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid assignment id"),
});

export type CreateAssignmentBody = z.infer<typeof createAssignmentSchema>;
export type AssignmentIdParams = z.infer<typeof assignmentIdParamSchema>;
