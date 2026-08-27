import { NotFoundError, AppError } from "../../utils/app-error.js";
import { Exam, type IExam } from "./exam.model.js";
import type { CreateExamDto } from "./exam.types.js";
import { extractTextFromPdf } from "../../utils/pdf-extractor.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { GroqProvider } from "../generation/providers/groq.provider.js";
import { GeminiProvider } from "../generation/providers/gemini.provider.js";

function toExamResponse(exam: IExam) {
  return {
    id: exam._id.toString(),
    title: exam.title,
    status: exam.status,
    questionPaper: exam.questionPaper,
    studentAnswerSheet: exam.studentAnswerSheet,
    questions: exam.questions,
    answers: exam.answers,
    mappings: exam.mappings,
    userId: exam.userId,
    gradingStatus: exam.gradingStatus,
    totalScore: exam.totalScore,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}

function resolveAiProvider() {
  if (env.GEMINI_API_KEY) {
    let modelName = env.GEMINI_MODEL || "gemini-flash-latest";
    if (modelName.startsWith("gemini-2.5") || modelName.startsWith("gemini-3.5")) {
      modelName = "gemini-flash-latest";
    }

    return {
      provider: new GeminiProvider({
        apiKey: env.GEMINI_API_KEY,
        model: modelName,
        timeoutMs: 90000,
      }),
      source: "gemini" as const,
    };
  } else if (env.GROQ_API_KEY) {
    return {
      provider: new GroqProvider({
        apiKey: env.GROQ_API_KEY,
        model: env.GROQ_MODEL,
        timeoutMs: 90000,
      }),
      source: "groq" as const,
    };
  }
  throw new AppError("No AI provider API key configured (GROQ_API_KEY or GEMINI_API_KEY)", 500, "AI_PROVIDER_UNCONFIGURED");
}

export class ExamService {
  async createExam(input: CreateExamDto): Promise<ReturnType<typeof toExamResponse>> {
    if (!input.questionPaper.buffer || !input.studentAnswerSheet.buffer) {
      throw new AppError("Both files must contain valid file buffers", 400, "FILES_REQUIRED");
    }

    let questionPaperText = "";
    let studentAnswerSheetText = "";

    try {
      questionPaperText = await extractTextFromPdf(input.questionPaper.buffer);
    } catch (err: any) {
      logger.error({ err }, "Question paper PDF extraction failed");
      throw new AppError("Failed to extract text from Question Paper PDF. Ensure it is a valid PDF.", 400, "MATERIAL_EXTRACTION_FAILED");
    }

    try {
      studentAnswerSheetText = await extractTextFromPdf(input.studentAnswerSheet.buffer);
    } catch (err: any) {
      logger.error({ err }, "Student answer sheet PDF extraction failed");
      throw new AppError("Failed to extract text from Student Answer Sheet PDF. Ensure it is a valid PDF.", 400, "MATERIAL_EXTRACTION_FAILED");
    }

    const { provider, source } = resolveAiProvider();

    if (source !== "gemini") {
      if (!questionPaperText.trim()) {
        throw new AppError("Failed to extract text from Question Paper PDF. Ensure it contains readable text.", 400, "MATERIAL_EXTRACTION_FAILED");
      }
      if (!studentAnswerSheetText.trim()) {
        throw new AppError("Failed to extract text from Student Answer Sheet PDF. Ensure it contains readable text.", 400, "MATERIAL_EXTRACTION_FAILED");
      }
    }

    const systemPrompt = `You are an elite academic grading assistant.
Your task is to analyze the provided Question Paper text and the Student's Answer Sheet text, extract all questions, identify the student's answers, grade each answer, and map them together.

CRITICAL EXTRACTION RULES:
1. Extract all questions from the Question Paper text.
2. If the Question Paper text does not contain explicit numbered questions, you MUST generate 3 to 5 realistic questions based on the content of the text.
3. For each question, extract or match the student's answer from the Student Answer Sheet text. If the Answer Sheet does not contain explicit answers, match relevant paragraphs or summaries from the Answer Sheet text that answer the question.
4. For each extracted student answer, you MUST also identify its location in the Student's Answer Sheet. Estimate the approximate region/bounding box where the answer is written on the page, using percentage values (0 to 100) relative to the page width and height:
   - x: percentage distance from the left edge of the page (0 to 100)
   - y: percentage distance from the top edge of the page (0 to 100)
   - width: percentage width of the answer block (0 to 100)
   - height: percentage height of the answer block (0 to 100)
   - pageNumber: 1-based page number where this answer is located.
5. Be fair and professional in grading. Award scores proportionally to correctness.
6. If a question is clearly unanswered or skipped in the answer sheet, set matched=false, score=0, and feedback="Question left unanswered by student."
7. Output ONLY the raw JSON object matching the schema below. No explanations, no markdown formatting (no \`\`\`json blocks), just the raw JSON text.

JSON Schema:
{
  "questions": [
    {
      "questionNumber": "string (e.g. '1', '2', '3(a)')",
      "text": "string (full question text)",
      "marks": number (maximum marks allowed. If not specified, default to 5)"
    }
  ],
  "answers": [
    {
      "questionNumber": "string (the question number this answer corresponds to)",
      "text": "string (the text of the student's answer)",
      "regions": [
        {
          "pageNumber": number,
          "boundingBox": {
            "x": number,
            "y": number,
            "width": number,
            "height": number
          }
        }
      ]
    }
  ],
  "mappings": [
    {
      "questionNumber": "string",
      "matched": boolean (true if attempted, false if unanswered/skipped/empty)",
      "extractedAnswerIndex": number (the 0-based index of this answer in the answers array above, or null/undefined if unmatched/unanswered)",
      "score": number (marks awarded, from 0 up to the question's 'marks'. If unmatched/unanswered, score must be 0)",
      "feedback": "string (detailed constructive educational feedback on this specific answer)"
    }
  ]
}`;

    const userPrompt = `Analyze the exam text below and generate the structured grading.

=== QUESTION PAPER TEXT ===
${questionPaperText}

=== STUDENT ANSWER SHEET TEXT ===
${studentAnswerSheetText}`;

    logger.info({ source, qLen: questionPaperText.length, aLen: studentAnswerSheetText.length }, "Sending exam extraction/OCR request to AI Provider");

    let rawResponse = "";
    try {
      if (source === "gemini") {
        rawResponse = await (provider as GeminiProvider).generate(systemPrompt, userPrompt, [
          { buffer: input.questionPaper.buffer, mimeType: input.questionPaper.type },
          { buffer: input.studentAnswerSheet.buffer, mimeType: input.studentAnswerSheet.type },
        ]);
      } else {
        rawResponse = await provider.generate(systemPrompt, userPrompt);
      }
    } catch (err: any) {
      logger.error({ err }, "AI Provider failed to generate exam grading");
      throw new AppError(`AI assessment generation failed: ${err.message}`, 502, "AI_PROVIDER_ERROR");
    }

    let parsedResult: any;
    try {
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      logger.info({ cleanJson }, "AI raw JSON string response");
      parsedResult = JSON.parse(cleanJson);
    } catch (err) {
      logger.error({ rawResponse, err }, "Failed to parse AI provider JSON response");
      throw new AppError("AI provider returned invalid JSON response format", 502, "AI_PARSE_ERROR");
    }

    const questions = Array.isArray(parsedResult.questions) ? parsedResult.questions : [];
    const answers = Array.isArray(parsedResult.answers) ? parsedResult.answers : [];
    const mappings = Array.isArray(parsedResult.mappings) ? parsedResult.mappings : [];

    const formattedQuestions = questions.map((q: any) => ({
      questionNumber: String(q.questionNumber || ""),
      text: String(q.text || ""),
      marks: Number(q.marks || 5),
      regions: [],
    }));

    const formattedAnswers = answers.map((a: any) => ({
      questionNumber: String(a.questionNumber || ""),
      text: String(a.text || ""),
      regions: Array.isArray(a.regions)
        ? a.regions.map((r: any) => ({
            pageNumber: typeof r.pageNumber === "number" ? r.pageNumber : 1,
            boundingBox: {
              x: typeof r.boundingBox?.x === "number" ? (r.boundingBox.x > 100 ? r.boundingBox.x / 10 : r.boundingBox.x) : 10,
              y: typeof r.boundingBox?.y === "number" ? (r.boundingBox.y > 100 ? r.boundingBox.y / 10 : r.boundingBox.y) : 10,
              width: typeof r.boundingBox?.width === "number" ? (r.boundingBox.width > 100 ? r.boundingBox.width / 10 : r.boundingBox.width) : 80,
              height: typeof r.boundingBox?.height === "number" ? (r.boundingBox.height > 100 ? r.boundingBox.height / 10 : r.boundingBox.height) : 20,
            },
          }))
        : [],
    }));

    const formattedMappings = mappings.map((m: any) => ({
      questionNumber: String(m.questionNumber || ""),
      matched: Boolean(m.matched),
      extractedAnswerIndex: typeof m.extractedAnswerIndex === "number" ? m.extractedAnswerIndex : undefined,
      score: typeof m.score === "number" ? m.score : 0,
      feedback: String(m.feedback || ""),
    }));

    const totalScore = formattedMappings.reduce((sum: number, m: any) => sum + (m.score || 0), 0);

    const fs = await import("fs");
    const path = await import("path");

    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const qPaperExt = path.extname(input.questionPaper.name) || ".pdf";
    const qPaperFilename = `question-paper-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${qPaperExt}`;
    const qPaperPath = path.join(uploadsDir, qPaperFilename);
    fs.writeFileSync(qPaperPath, input.questionPaper.buffer);

    const aSheetExt = path.extname(input.studentAnswerSheet.name) || ".pdf";
    const aSheetFilename = `answer-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${aSheetExt}`;
    const aSheetPath = path.join(uploadsDir, aSheetFilename);
    fs.writeFileSync(aSheetPath, input.studentAnswerSheet.buffer);

    const exam = await Exam.create({
      title: input.title?.trim() || "Exam Paper",
      status: "completed",
      questionPaper: {
        name: input.questionPaper.name,
        size: input.questionPaper.size,
        type: input.questionPaper.type,
        path: `/uploads/${qPaperFilename}`,
      },
      studentAnswerSheet: {
        name: input.studentAnswerSheet.name,
        size: input.studentAnswerSheet.size,
        type: input.studentAnswerSheet.type,
        path: `/uploads/${aSheetFilename}`,
      },
      userId: input.userId,
      questions: formattedQuestions,
      answers: formattedAnswers,
      mappings: formattedMappings,
      gradingStatus: "pending",
      totalScore,
    });

    return toExamResponse(exam);
  }

  async listExams(userId: string): Promise<ReturnType<typeof toExamResponse>[]> {
    const exams = await Exam.find({ userId }).sort({ createdAt: -1 });
    return exams.map(toExamResponse);
  }

  async getExamById(id: string, userId: string): Promise<ReturnType<typeof toExamResponse>> {
    const exam = await Exam.findOne({ _id: id, userId });
    if (!exam) {
      throw new NotFoundError("Exam not found or access denied");
    }
    return toExamResponse(exam);
  }

  async deleteExam(id: string, userId: string): Promise<void> {
    const result = await Exam.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError("Exam not found or access denied");
    }
  }

  async updateExam(id: string, userId: string, update: Partial<IExam>): Promise<ReturnType<typeof toExamResponse>> {
    if (update.mappings) {
      update.totalScore = update.mappings.reduce((sum, m) => sum + (m.score || 0), 0);
    }
    const exam = await Exam.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );
    if (!exam) {
      throw new NotFoundError("Exam not found or access denied");
    }
    return toExamResponse(exam);
  }
}

export const examService = new ExamService();
