import type { IAssignment } from "../assignment/assignment.model.js";

export const PROMPT_VERSION = "v1.0.0";

export function buildAssessmentPrompt(assignment: IAssignment): string {
  const questionTypeSummary = assignment.questionTypes
    .map(
      (row) =>
        `- ${row.type}: ${row.numQuestions} questions, ${row.marksPerQuestion} marks each`
    )
    .join("\n");

  const contextLines = [
    `Title: ${assignment.title || "Untitled Assignment"}`,
    assignment.subject ? `Subject: ${assignment.subject}` : "",
    assignment.gradeClass ? `Class/Grade: ${assignment.gradeClass}` : "",
    assignment.topic ? `Topic/Chapter: ${assignment.topic}` : "",
    `Due Date: ${assignment.dueDate.toISOString().split("T")[0]}`,
    `Difficulty Preference: ${assignment.difficulty}`,
    `Total Questions Target: ${assignment.totalQuestions}`,
    `Total Marks Target: ${assignment.totalMarks}`,
    "",
    "Question Types:",
    questionTypeSummary,
  ].filter(Boolean);

  if (assignment.additionalInstructions) {
    contextLines.push("", "Additional Instructions:", assignment.additionalInstructions);
  }

  if (assignment.instructions) {
    contextLines.push("", "Teacher Instructions:", assignment.instructions);
  }

  if (assignment.file) {
    contextLines.push(
      "",
      `Reference Material: ${assignment.file.name} (${assignment.file.type}, ${assignment.file.size} bytes)`
    );
  }

  if (assignment.extractedText) {
    contextLines.push(
      "",
      "CRITICAL GENERATION RULES:",
      "- Generate questions and answer keys STRICTLY AND ONLY from the provided study material below.",
      "- DO NOT invent topics, and DO NOT use external knowledge or facts outside the study material.",
      "- Every question MUST include a non-empty, highly detailed 'sampleAnswer' field. NO exceptions.",
      "- The response must contain ONLY the valid JSON object, starting with '{' and ending with '}'.",
      "- Absolutely NO introductory text, NO introductory commentary, NO page markers, NO markdown code fences, and NO trailing prose.",
      "- If you output anything before or after the JSON object, the response is invalid.",
      "- Never repeat the study material verbatim.",
      "- Generate concise academic questions from the concepts only.",
      "",
      "=== STUDY MATERIAL START ===",
      assignment.extractedText,
      "=== STUDY MATERIAL END ==="
    );
  }

  return [
    "You are an expert academic assessment designer.",
    "You MUST return ONLY valid JSON matching the target schema. No markdown fences. No commentary. No explanations. Return only raw JSON.",
    "If you cannot comply or if you output anything before or after the JSON object, the response is invalid.",
    "",
    "Assignment Context:",
    ...contextLines,
    "",
    "Target JSON schema (example shape):",
    JSON.stringify(
      {
        sections: [
          {
            title: "Section A",
            instruction: "Attempt all questions",
            questions: [
              {
                question: "string",
                difficulty: "easy | medium | hard",
                marks: 2,
                type: "optional question type label",
                options: ["optional for MCQ"],
                sampleAnswer: "REQUIRED: solid detailed answer/explanation",
              },
            ],
          },
        ],
      },
      null,
      2
    ),
    "",
    "Concrete example (MUST still be valid JSON only):",
    JSON.stringify(
      {
        sections: [
          {
            title: "Section A",
            instruction: "Attempt all questions",
            questions: [
              {
                question: "Based strictly on the provided study material, explain the main concept described in the first section.",
                difficulty: "easy",
                marks: 2,
                sampleAnswer: "According to the provided text, the main concept is that structured assessments must follow key rules in educational design to align questions with source material.",
              },
              {
                question: "Which of the following describes a key process mentioned in the study material?",
                difficulty: "easy",
                marks: 1,
                options: [
                  "A) The primary process described in the text",
                  "B) An unrelated concept",
                  "C) A generic distractor",
                  "D) None of the above",
                ],
                sampleAnswer: "The correct answer is A) The primary process described in the text because section 2 explicitly outlines this as the required mechanism.",
              },
            ],
          },
        ],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- Generate questions and answer keys STRICTLY AND ONLY from the provided study material. DO NOT invent topics, add outside facts, or use generic examples.",
    "- Create one section per configured question type where practical.",
    "- Match requested counts and marks as closely as possible.",
    "- Include options for MCQ-style questions.",
    "- Return ONLY valid JSON (no backticks, no code fences).",
    "- Every single question MUST include a non-empty, highly detailed 'sampleAnswer' field. NO exceptions. NO empty strings.",
    "- Enforce the following formatting rules for 'sampleAnswer' by question type:",
    "  1. MCQ: Correct option with detailed explanation. Format: 'The correct answer is [Option] because [Detailed Reasoning...].'",
    "  2. Short Answer / Short Questions / Long Answer: Comprehensive 2-4 line detailed explanation.",
    "  3. Numerical Problems: Complete step-by-step mathematical solution. MUST include:",
    "     Step 1: Given values",
    "     Step 2: Formula used",
    "     Step 3: Substitution",
    "     Step 4: Final calculation",
    "     Step 5: Final answer",
    "  4. Diagram / Graph-Based Questions: Stepwise interpretation/reasoning. MUST include:",
    "     - Explanation of the diagram or graph structure",
    "     - Key points to draw, plot, or interpret",
    "     - Stepwise reasoning",
    "     - Final conclusion/solution",
    "- Keys must be exactly: sections -> title/instruction/questions -> question/difficulty/marks (+ optional type/options/sampleAnswer).",
  ].join("\n");
}

export function buildSystemPrompt(): string {
  return [
    "You are a strict, precise academic JSON generator.",
    "Your sole task is to generate valid structured JSON matching the requested schema. You MUST NOT output anything other than the raw JSON payload.",
    "CRITICAL INSTRUCTIONS FOR JSON ENFORCEMENT:",
    "1. You MUST NOT include any conversational text, explanations, descriptions, introductory notes, markdown wrappers, backticks, or code fences (e.g. do NOT use ```json or ```).",
    "2. The first character of your response must be '{' and the last character must be '}'.",
    "3. Absolutely NO page separators, no summaries, no analysis, and no raw dumps of study materials are allowed.",
    "4. If you output any text or characters before or after the JSON object, the response is invalid.",
    "5. Never repeat the study material verbatim. Generate concise academic questions from the concepts only.",
  ].join(" ");
}
