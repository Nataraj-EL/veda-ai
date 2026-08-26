"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, AlertCircle, FileText, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function ExamAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentExam, isLoading, fetchExamById } = useExamStore();
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<string>("1");

  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    if (examId) {
      fetchExamById(examId, userId);
    }
  }, [examId, fetchExamById, userId]);

  // Set initial selected question once exam is loaded
  useEffect(() => {
    if (currentExam?.questions && currentExam.questions.length > 0) {
      setSelectedQuestionNumber(currentExam.questions[0].questionNumber);
    }
  }, [currentExam]);

  const handleQuestionClick = (qNum: string) => {
    setSelectedQuestionNumber(qNum);

    // Find the page number of this question's answer region
    const answer = currentExam?.answers?.find((a) => a.questionNumber === qNum);
    const targetPage = answer?.regions?.[0]?.pageNumber;

    if (targetPage && pageRefs.current[targetPage]) {
      pageRefs.current[targetPage]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  if (isLoading || !currentExam) {
    return (
      <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
        <Sidebar variant="assignments" assignmentCount={0} />
        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
          <Header title="Exams" variant="assignments" backHref="/exams" />
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-[#5e5e5e]/80">Loading exam assessment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current active details
  const activeQuestion = currentExam.questions?.find((q) => q.questionNumber === selectedQuestionNumber);
  const activeAnswer = currentExam.answers?.find((a) => a.questionNumber === selectedQuestionNumber);
  const activeMapping = currentExam.mappings?.find((m) => m.questionNumber === selectedQuestionNumber);

  const isUnanswered = !activeAnswer || activeAnswer.regions.length === 0;

  // Extract unique pages from the answer regions
  const totalPages = 2; // Fixed document length for our high-fidelity sample

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Persistent Left Sidebar */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Page Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Exams"
          variant="assignments"
          backHref="/exams"
        />

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          {/* Side-by-Side Main Container */}
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 pb-24 md:px-0 md:pb-12 flex-1 flex flex-col min-h-0">
            
            {/* Top title and metadata bar */}
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3">
              <div>
                <h2 className="text-[20px] font-extrabold tracking-tight text-[#303030]">
                  {currentExam.title}
                </h2>
                <p className="text-xs text-[#5e5e5e]/55 font-medium mt-0.5">
                  AI Assessment &amp; Answer Mapping
                </p>
              </div>
            </div>

            {/* Split panels - side-by-side on desktop, stacked on mobile */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 items-stretch">
              
              {/* Left Panel: Questions list */}
              <div className="w-full lg:w-[460px] bg-white border border-neutral-border rounded-[28px] p-5 flex flex-col justify-between shadow-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                    <BookOpen className="w-5 h-5 text-[#ff5623]" />
                    <h3 className="text-sm font-bold tracking-tight text-[#303030]">Extracted Questions</h3>
                  </div>

                  {/* Scrollable Questions List */}
                  <div className="space-y-3 max-h-[500px] lg:max-h-[60vh] overflow-y-auto pr-1">
                    {currentExam.questions?.map((q) => {
                      const qAnswer = currentExam.answers?.find((a) => a.questionNumber === q.questionNumber);
                      const qUnanswered = !qAnswer || qAnswer.regions.length === 0;

                      return (
                        <div
                          key={q.questionNumber}
                          onClick={() => handleQuestionClick(q.questionNumber)}
                          className={cn(
                            "group relative rounded-[20px] border p-4 cursor-pointer text-left transition-standard select-none",
                            selectedQuestionNumber === q.questionNumber
                              ? "bg-orange-50/15 border-[#ff5623] shadow-inner"
                              : "bg-white border-black/5 hover:border-black/15"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-extrabold text-[#303030]">
                                Question {q.questionNumber}
                              </span>
                              <span className="text-[10px] font-bold text-[#5e5e5e]/50 px-2 py-0.5 bg-slate-100 rounded-full">
                                {q.marks} Marks
                              </span>
                            </div>

                            {/* Status badge */}
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                                qUnanswered
                                  ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                              )}
                            >
                              {qUnanswered ? "Unanswered" : "Mapped"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5e5e5e]/80 line-clamp-3">
                            {q.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Question Details */}
                {activeQuestion && (
                  <div className="mt-5 border-t border-black/5 pt-4 space-y-3 bg-slate-50/50 p-4 rounded-[20px]">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#303030]">
                      <AlertCircle className="w-4 h-4 text-[#ff5623]" />
                      <span>Selected Question Details</span>
                    </div>
                    <div className="text-xs font-semibold leading-relaxed text-[#5e5e5e]/80">
                      <p className="font-extrabold text-black">Q{activeQuestion.questionNumber}:</p>
                      <p className="mt-0.5">{activeQuestion.text}</p>
                    </div>
                    {activeMapping && activeMapping.matched && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Extracted Answer Score: {activeMapping.score} / {activeQuestion.marks}</span>
                        </div>
                        <p className="font-semibold text-emerald-800/80">{activeMapping.feedback}</p>
                      </div>
                    )}
                    {activeMapping && !activeMapping.matched && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-2.5 space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Status: Left Unanswered</span>
                        </div>
                        <p className="font-semibold text-amber-800/80">Student did not attempt this question.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel: Answer Sheet Canvas */}
              <div className="flex-1 bg-white border border-neutral-border rounded-[28px] p-5 flex flex-col shadow-none min-h-[500px]">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3 justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#ff5623]" />
                    <h3 className="text-sm font-bold tracking-tight text-[#303030]">Student Answer Sheet</h3>
                  </div>
                  <div className="text-[11px] font-bold text-[#5e5e5e]/55">
                    {isUnanswered ? "No highlight" : `Answer Region Highlighted`}
                  </div>
                </div>

                {/* Viewport for document sheets */}
                <div className="flex-1 overflow-y-auto max-h-[70vh] bg-slate-50/50 rounded-2xl p-4 space-y-6 mt-4 border border-black/5">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <div
                        key={pageNum}
                        ref={(el) => { pageRefs.current[pageNum] = el; }}
                        className="relative bg-white border border-slate-200 shadow-sm rounded-lg aspect-[1/1.414] w-full max-w-[500px] p-6 md:p-8 mx-auto my-4 text-left font-serif overflow-hidden select-none"
                      >
                        {/* Page number badge */}
                        <div className="absolute top-3 right-3 text-[10px] font-bold text-[#a9a9a9] bg-slate-50 px-2 py-0.5 rounded border">
                          Page {pageNum}
                        </div>

                        {/* Bounding box highlight overlay */}
                        {activeQuestion && activeAnswer?.regions?.map((region, rIdx) => {
                          if (region.pageNumber === pageNum) {
                            const { x, y, width, height } = region.boundingBox;
                            return (
                              <div
                                key={rIdx}
                                className="absolute border-[2.5px] border-[#ff5623] bg-[#ff5623]/8 rounded-xl transition-all duration-300 animate-pulse pointer-events-none"
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  width: `${width}%`,
                                  height: `${height}%`,
                                }}
                              />
                            );
                          }
                          return null;
                        })}

                        {/* Simulated Handwriting text */}
                        <div className="h-full flex flex-col justify-start space-y-8 font-serif italic text-blue-800 text-sm md:text-[15px] pt-8">
                          {pageNum === 1 ? (
                            <>
                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q1 answer:</p>
                                <p className="leading-relaxed">
                                  In brine (NaCl solution) electrolysis, chlorine gas is liberated at the anode, while hydrogen gas is evolved at the cathode. Sodium hydroxide solution accumulates near the cathode.
                                </p>
                                <p className="leading-normal font-mono text-xs md:text-sm text-blue-900 mt-1 pl-4">
                                  At Anode: 2Cl⁻ → Cl₂ + 2e⁻<br />
                                  At Cathode: 2H₂O + 2e⁻ → H₂ + 2OH⁻
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q2 answer:</p>
                                <p className="leading-relaxed">
                                  Sodium ions (Na⁺) and hydroxide (OH⁻) ions remain in the solution and combine to form NaOH because hydrogen ions (H⁺) are preferentially reduced at the cathode due to their lower reduction potential.
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q3(a) answer:</p>
                                <p className="leading-relaxed">
                                  Chlorine gas reacts with dry slaked lime [Ca(OH)₂] to form calcium oxychloride (bleaching powder) and water:
                                </p>
                                <p className="leading-normal font-mono text-xs md:text-sm text-blue-900 mt-1 pl-4">
                                  Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">Q4 answer:</p>
                                <p className="leading-relaxed">
                                  Common name: Baking Soda.<br />
                                  Chemical formula: NaHCO3.<br />
                                  Use: Bakery (bread/cakes) to make them fluffy by releasing CO2 gas on heating.
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
