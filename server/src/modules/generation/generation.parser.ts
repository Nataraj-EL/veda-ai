import { z } from "zod";
import { DIFFICULTY_LEVELS } from "../assignment/assignment.types.js";
import { AppError } from "../../utils/app-error.js";
import type { StructuredAssessmentOutput } from "../assignment/assignment.types.js";
import { logger } from "../../utils/logger.js";


const parsedQuestionSchema = z.object({
  question: z.string().min(1),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  marks: z.number().positive(),
  type: z.string().optional(),
  options: z.array(z.string()).optional(),
  sampleAnswer: z.string().min(10, "Answer is required for all questions"),
});

const parsedSectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(parsedQuestionSchema).min(1),
});

const structuredOutputSchema = z.object({
  sections: z.array(parsedSectionSchema).min(1),
});

export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();

  // 1. Find the first '{' and the last '}'
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  // 2. Fallback to fenced markdown block
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const content = fenced[1].trim();
    const fStart = content.indexOf("{");
    const fEnd = content.lastIndexOf("}");
    if (fStart !== -1 && fEnd !== -1 && fEnd > fStart) {
      return content.slice(fStart, fEnd + 1);
    }
    return content;
  }

  return trimmed;
}

export function parseStructuredAssessment(raw: string): StructuredAssessmentOutput {
  const jsonText = extractJsonPayload(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    logger.error(
      {
        err,
        rawResponse: raw,
        parsedSubstring: jsonText,
      },
      "JSON PARSING FAILED inside parseStructuredAssessment"
    );

    throw new AppError(
      "AI response was not valid JSON",
      502,
      "AI_PARSE_ERROR",
      { preview: raw.slice(0, 500) }
    );
  }

  const validated = structuredOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI response failed structural validation",
      502,
      "AI_VALIDATION_ERROR",
      validated.error.flatten()
    );
  }

  return validated.data;
}

export function countQuestions(output: StructuredAssessmentOutput): number {
  return output.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
}

export function sumMarks(output: StructuredAssessmentOutput): number {
  return output.sections.reduce(
    (sum, section) =>
      sum + section.questions.reduce((sectionSum, q) => sectionSum + q.marks, 0),
    0
  );
}
