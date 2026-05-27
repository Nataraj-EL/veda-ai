import { env } from "../../config/env.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { logger } from "../../utils/logger.js";
import type { StructuredAssessmentOutput } from "../assignment/assignment.types.js";

interface RefinementItem {
  sectionIndex: number;
  questionIndex: number;
  question: string;
  options?: string[];
  sampleAnswer?: string;
  type?: string;
}

interface GeminiPayloadItem {
  index: number;
  question?: string;
  options?: string[];
  sampleAnswer?: string;
}

export class GeminiFormatterService {
  private provider: GeminiProvider | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.provider = new GeminiProvider({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL || "gemini-2.5-flash",
        timeoutMs: 60_000,
      });
    } else {
      logger.warn("GEMINI_API_KEY not configured. Stage 2 refinement is disabled.");
    }
  }

  /**
   * Identifies questions requiring mathematical, formula, scientific, or diagram refinement.
   */
  private shouldRefine(questionText: string, answerText: string, type?: string): boolean {
    const textToSearch = `${questionText} ${answerText} ${type || ""}`.toLowerCase();

    // 1. Math / physics equations or formulas indicators
    const hasMathIndicators = 
      /[+\-*/=^<>]/ .test(textToSearch) ||
      textToSearch.includes("calculate") ||
      textToSearch.includes("solve") ||
      textToSearch.includes("formula") ||
      textToSearch.includes("equation") ||
      textToSearch.includes("derivation") ||
      textToSearch.includes("derive") ||
      textToSearch.includes("value of") ||
      textToSearch.includes("constant") ||
      textToSearch.includes("probability") ||
      textToSearch.includes("ratio") ||
      textToSearch.includes("percentage") ||
      textToSearch.includes("accuracy") ||
      textToSearch.includes("notation") ||
      textToSearch.includes("speed") ||
      textToSearch.includes("mass") ||
      textToSearch.includes("force") ||
      textToSearch.includes("velocity") ||
      textToSearch.includes("energy");

    // 2. Diagram or Graph indicators
    const hasDiagramIndicators =
      textToSearch.includes("draw") ||
      textToSearch.includes("diagram") ||
      textToSearch.includes("graph") ||
      textToSearch.includes("label") ||
      textToSearch.includes("illustrate") ||
      textToSearch.includes("flowchart") ||
      textToSearch.includes("sketch");

    return hasMathIndicators || hasDiagramIndicators;
  }

  /**
   * Refines Groq output in a synchronized second pass using Gemini for academic formatting.
   */
  async refineAssessment(groqOutput: StructuredAssessmentOutput): Promise<StructuredAssessmentOutput> {
    if (!this.provider) {
      logger.info("Skipping Stage 2 Gemini Refinement (Gemini API key not set)");
      return groqOutput;
    }

    // 1. Traverse and identify candidates for refinement
    const refinementCandidates: RefinementItem[] = [];

    groqOutput.sections.forEach((section, sIdx) => {
      section.questions.forEach((q, qIdx) => {
        if (this.shouldRefine(q.question, q.sampleAnswer || "", q.type)) {
          refinementCandidates.push({
            sectionIndex: sIdx,
            questionIndex: qIdx,
            question: q.question,
            options: q.options,
            sampleAnswer: q.sampleAnswer,
            type: q.type,
          });
        }
      });
    });

    if (refinementCandidates.length === 0) {
      logger.info("Stage 2: No questions met the criteria for mathematical/academic refinement.");
      return groqOutput;
    }

    logger.info(
      { candidateCount: refinementCandidates.length },
      "Stage 2: Refining academic formatting for selected questions via Gemini"
    );

    // 2. Prepare structured data payload for Gemini
    const payload = refinementCandidates.map((c, index) => ({
      index,
      question: c.question,
      options: c.options,
      sampleAnswer: c.sampleAnswer,
      type: c.type,
    }));

    const systemPrompt = `You are an elite academic formatter, proofreader, and LaTeX typesetting expert for school/board examinations (CBSE, ICSE).
Your sole job is to refine mathematical formulas, equations, derivations, numerical problem solutions, and diagram/graph instructions to production-grade educational standards.

CRITICAL FORMATTING RULES:
1. MATHEMATICAL FORMULAS & EQUATIONS:
   - Convert mathematical expressions, calculations, equations, and solutions into beautifully formatted LaTeX syntax.
   - Use \\( ... \\) for inline math expressions (e.g. \\( x = 2 \\)).
   - Use \\[ ... \\] for multiline or block/centered equations (e.g. \\[ F = m \\times a \\]).
   - Replace raw operators like *, /, x with proper LaTeX equivalents (e.g. \\times, \\frac{a}{b}, \\cdot).

2. NUMERICAL SOLUTIONS BEAUTIFICATION:
   - Format lengthy calculations into strict, clean academic step-by-step stages, preserving inline math notation:
     Step 1: Given Values
     \\[ ... \\]
     Step 2: Formula Used
     \\[ ... \\]
     Step 3: Substitution
     \\[ ... \\]
     Step 4: Calculation
     \\[ ... \\]
     Step 5: Final Answer
     \\[ ... \\]

3. DIAGRAM & GRAPH QUESTIONS:
   - Convert long unstructured descriptive drawing directions into beautiful concise bulleted hierarchies and clear numbered steps (e.g. "Draw and label: 1. Input Layer 2. Embedding Layer... Then explain: - data flow...").

4. STRICT Educational constraints:
   - You MUST NOT rewrite or regenerate the questions. Keep the original wording, semantic intent, difficulty, and marks exactly.
   - You MUST NOT invent any new questions or change the ordering.
   - Return ONLY a valid JSON array matching the structure of the input payload containing refined questions.`;

    const userPrompt = `Refine this payload into LaTeX-safe, professionally formatted JSON:
${JSON.stringify(payload, null, 2)}`;

    try {
      const response = await this.provider.generate(systemPrompt, userPrompt);
      const refinedPayload = JSON.parse(response);

      if (!Array.isArray(refinedPayload)) {
        throw new Error("Gemini response is not a valid JSON array");
      }

      // 3. Deep-merge refined values back into our original StructuredAssessmentOutput object
      const clonedOutput: StructuredAssessmentOutput = JSON.parse(JSON.stringify(groqOutput));

      refinedPayload.forEach((item: GeminiPayloadItem) => {
        const candidate = refinementCandidates[item.index];
        if (candidate) {
          const targetSection = clonedOutput.sections[candidate.sectionIndex];
          if (targetSection) {
            const targetQuestion = targetSection.questions[candidate.questionIndex];
            if (targetQuestion) {
              if (item.question) {
                targetQuestion.question = item.question;
              }
              if (item.options && Array.isArray(item.options)) {
                targetQuestion.options = item.options;
              }
              if (item.sampleAnswer) {
                targetQuestion.sampleAnswer = item.sampleAnswer;
              }
            }
          }
        }
      });

      logger.info("Stage 2: Academic formatting and LaTeX equations refinement successfully merged.");
      return clonedOutput;
    } catch (err: unknown) {
      logger.error({ err }, "Stage 2: Gemini academic formatting failed. Falling back to Groq output.");
      return groqOutput;
    }
  }
}

export const geminiFormatterService = new GeminiFormatterService();
