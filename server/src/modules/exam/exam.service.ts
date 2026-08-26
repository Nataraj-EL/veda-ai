import { NotFoundError } from "../../utils/app-error.js";
import { Exam, type IExam } from "./exam.model.js";
import type { CreateExamDto } from "./exam.types.js";

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

export class ExamService {
  async createExam(input: CreateExamDto): Promise<ReturnType<typeof toExamResponse>> {
    const mockQuestions = [
      {
        questionNumber: "1",
        text: "Explain the process of brine electrolysis (chlor-alkali process). Write the chemical equations for the cathode and anode reactions.",
        marks: 5,
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 5, width: 90, height: 10 } }],
      },
      {
        questionNumber: "2",
        text: "Explain why sodium hydroxide is formed in the solution instead of at the electrode.",
        marks: 3,
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 17, width: 90, height: 8 } }],
      },
      {
        questionNumber: "3(a)",
        text: "Write the balanced chemical equation for the reaction of chlorine gas with slaked lime.",
        marks: 2,
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 28, width: 90, height: 8 } }],
      },
      {
        questionNumber: "3(b)",
        text: "Explain the role of gypsum in the manufacturing and setting of cement.",
        marks: 5,
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 39, width: 90, height: 8 } }],
      },
      {
        questionNumber: "4",
        text: "What is the common name of Sodium Hydrogen Carbonate? Write its chemical formula and one domestic use.",
        marks: 5,
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 50, width: 90, height: 10 } }],
      },
    ];

    const mockAnswers = [
      {
        questionNumber: "1",
        text: "During brine (concentrated NaCl solution) electrolysis, chlorine gas is evolved at the anode and hydrogen gas at the cathode. Sodium hydroxide solution is formed near the cathode.\nAt Anode: 2Cl⁻ → Cl₂ + 2e⁻\nAt Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻",
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 10, width: 90, height: 20 } }],
      },
      {
        questionNumber: "2",
        text: "Sodium ions (Na⁺) and hydroxide ions (OH⁻) remain in the solution and combine to form NaOH because hydrogen ions (H⁺) are preferentially reduced at the cathode due to their lower reduction potential.",
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 32, width: 90, height: 16 } }],
      },
      {
        questionNumber: "3(a)",
        text: "Chlorine gas reacts with dry slaked lime [Ca(OH)₂] to produce bleaching powder (calcium oxychloride):\nCa(OH)₂ + Cl₂ → CaOCl₂ + H₂O",
        regions: [{ pageNumber: 1, boundingBox: { x: 5, y: 50, width: 90, height: 14 } }],
      },
      {
        questionNumber: "3(b)",
        text: "",
        regions: [],
      },
      {
        questionNumber: "4",
        text: "Common name: Baking Soda.\nChemical formula: NaHCO3.\nUse: Used in bakery (bread/cakes) to make them soft and spongy by releasing carbon dioxide gas on heating.",
        regions: [{ pageNumber: 2, boundingBox: { x: 5, y: 12, width: 90, height: 22 } }],
      },
    ];

    const mockMappings = [
      { questionNumber: "1", matched: true, extractedAnswerIndex: 0, score: 5, feedback: "Excellent answer covering both anode and cathode equations accurately." },
      { questionNumber: "2", matched: true, extractedAnswerIndex: 1, score: 3, feedback: "Correct explanation of preferential discharge." },
      { questionNumber: "3(a)", matched: true, extractedAnswerIndex: 2, score: 2, feedback: "Equation is balanced and products are correct." },
      { questionNumber: "3(b)", matched: false, score: 0, feedback: "Question left unanswered by student." },
      { questionNumber: "4", matched: true, extractedAnswerIndex: 4, score: 5, feedback: "All parts answered correctly with chemical equation implications." },
    ];

    const totalScore = mockMappings.reduce((sum, m) => sum + (m.score || 0), 0);

    const exam = await Exam.create({
      title: input.title?.trim() || "Exam Paper",
      status: "completed",
      questionPaper: input.questionPaper,
      studentAnswerSheet: input.studentAnswerSheet,
      userId: input.userId,
      questions: mockQuestions,
      answers: mockAnswers,
      mappings: mockMappings,
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
