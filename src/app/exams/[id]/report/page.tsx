"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function GradedExamReportPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const { currentExam, isLoading, fetchExamById } = useExamStore();
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    if (examId) {
      fetchExamById(examId, userId);
    }
  }, [examId, fetchExamById, userId]);

  if (isLoading || !currentExam) {
    return (
      <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
        <Sidebar variant="assignments" assignmentCount={0} />
        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
          <Header title="Exams Report" variant="assignments" backHref={`/exams/${examId}`} />
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-[#5e5e5e]/80">Loading report data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxMarks = currentExam.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;
  const totalScore = currentExam.mappings?.reduce((sum, m) => sum + (m.score || 0), 0) || 0;
  const percent = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;
  const totalPages = 2; // Simulated document pages

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Sidebar navigation (hidden in print) */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Page scroll wrapper */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        {/* Header navigation (hidden in print) */}
        <Header
          title="Exams Report"
          variant="assignments"
          backHref={`/exams/${examId}`}
        />

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          <div className="mx-auto w-full max-w-[850px] px-4 pt-4 pb-24 md:px-0 md:pb-12 flex-1 flex flex-col min-h-0">
            
            {/* Top dark action banner (hidden in print) */}
            <div className="bg-[#27272A] text-white border border-neutral-border rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print select-none mb-6">
              <div className="min-w-0 text-left space-y-1">
                <p className="text-xs font-semibold text-white/90 leading-relaxed">
                  Certainly, {preferences?.teacherName || "Teacher"}! Here is the printable report card containing grading metrics and coordinate overlays.
                </p>
              </div>
              
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => router.push(`/exams/${examId}`)}
                  className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-standard cursor-pointer border border-zinc-700 font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Details</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-white hover:bg-slate-100 text-neutral-primary transition-standard cursor-pointer font-bold text-sm"
                >
                  <FileText className="w-4 h-4 text-[#ff5623]" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>

            {/* ===============================================================
               A4 PHYSICAL GRADING REPORT SHEET
               =============================================================== */}
            <article className="bg-white md:border md:border-neutral-border md:rounded-[28px] p-6 md:p-8 shadow-sm space-y-8 print-surface print-container text-left">
              
              {/* Institution Header Block */}
              <div className="text-center space-y-2 pb-4 border-b border-black/5">
                <h1 className="text-[22px] font-extrabold text-[#303030] tracking-tight uppercase">
                  {preferences?.schoolName || "Delhi Public School, Bokaro Steel City"}
                </h1>
                <h2 className="text-xs font-extrabold tracking-widest text-[#ff5623] uppercase">
                  Graded Assessment Report
                </h2>
              </div>

              {/* Assessment profile metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/75 border border-black/5 p-4 rounded-2xl">
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1">
                    <span className="font-extrabold text-[#303030]">Exam Title:</span>
                    <span className="font-medium text-[#5e5e5e]">{currentExam.title}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="font-extrabold text-[#303030]">Student:</span>
                    <span className="font-medium text-[#5e5e5e]">Chemistry Student</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="font-extrabold text-[#303030]">Uploaded Date:</span>
                    <span className="font-medium text-[#5e5e5e]">
                      {new Date(currentExam.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-extrabold text-[#303030]">Grading Status:</span>
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0",
                      currentExam.gradingStatus === "completed"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                        : "bg-amber-50 text-amber-600 border-amber-200/50"
                    )}>
                      {currentExam.gradingStatus === "completed" ? "Graded" : "Pending Review"}
                    </span>
                  </div>
                  <p className="flex items-center justify-end gap-1.5">
                    <span className="font-extrabold text-[#303030]">Total Score:</span>
                    <span className="text-sm font-extrabold text-[#ff5623]">
                      {totalScore} / {maxMarks} ({percent}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Score Card Table Summary */}
              <div className="space-y-3 break-inside-avoid">
                <h3 className="text-sm font-extrabold text-[#303030] tracking-tight uppercase border-l-3 border-[#ff5623] pl-2">
                  Graded Score Card
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-black/5">
                    <thead>
                      <tr className="bg-slate-100/70 text-[#303030] border-b border-black/5">
                        <th className="p-3 font-extrabold border-r border-black/5 w-16">Q No</th>
                        <th className="p-3 font-extrabold border-r border-black/5">Question Details</th>
                        <th className="p-3 font-extrabold border-r border-black/5 w-24 text-center">Max Marks</th>
                        <th className="p-3 font-extrabold border-r border-black/5 w-28 text-center">Score Obtained</th>
                        <th className="p-3 font-extrabold w-20 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExam.questions?.map((q) => {
                        const qMapping = currentExam.mappings?.find((m) => m.questionNumber === q.questionNumber);
                        const scoreObtained = qMapping?.score ?? 0;
                        const isMapped = qMapping?.matched ?? false;

                        return (
                          <tr key={q.questionNumber} className="border-b border-black/5 hover:bg-slate-50/50">
                            <td className="p-3 font-bold border-r border-black/5">{q.questionNumber}</td>
                            <td className="p-3 border-r border-black/5 font-medium text-[#5e5e5e] truncate max-w-[280px]">
                              {q.text}
                            </td>
                            <td className="p-3 text-center border-r border-black/5 font-extrabold">{q.marks}</td>
                            <td className="p-3 text-center border-r border-black/5 font-extrabold text-[#ff5623]">
                              {scoreObtained}
                            </td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isMapped
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                                  : "bg-amber-50 text-amber-600 border-amber-200/50"
                              )}>
                                {isMapped ? "Mapped" : "Blank"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Breakdown Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#303030] tracking-tight uppercase border-l-3 border-[#ff5623] pl-2 break-inside-avoid">
                  Detailed Assessments
                </h3>
                
                <div className="space-y-4">
                  {currentExam.questions?.map((q) => {
                    const qAnswer = currentExam.answers?.find((a) => a.questionNumber === q.questionNumber);
                    const qMapping = currentExam.mappings?.find((m) => m.questionNumber === q.questionNumber);
                    const scoreObtained = qMapping?.score ?? 0;
                    const feedback = qMapping?.feedback ?? "No feedback provided.";

                    return (
                      <div
                        key={q.questionNumber}
                        className="p-4 border border-black/5 rounded-2xl bg-white space-y-3 break-inside-avoid border-l-4 border-l-slate-400"
                      >
                        <div className="flex items-center justify-between border-b border-black/5 pb-2">
                          <span className="font-extrabold text-xs text-[#303030]">
                            Question {q.questionNumber}
                          </span>
                          <span className="text-xs font-extrabold text-[#ff5623]">
                            Marks: {scoreObtained} / {q.marks}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-[#5e5e5e]/80">Question Text</p>
                          <p className="text-[12px] font-medium text-[#303030] leading-relaxed">
                            {q.text}
                          </p>
                        </div>

                        <div className="space-y-1 bg-slate-50/50 border border-black/5 p-3 rounded-xl">
                          <p className="text-[11px] font-extrabold text-[#5e5e5e]/80">Extracted Student Answer</p>
                          <p className="text-[12px] font-medium text-blue-900 font-serif italic leading-relaxed whitespace-pre-wrap">
                            {!qAnswer?.text || qAnswer.text === "Unanswered"
                              ? "Question left unanswered by student."
                              : qAnswer.text}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-[#5e5e5e]/80">Teacher Feedback</p>
                          <p className="text-[12px] font-medium text-[#5e5e5e] leading-relaxed bg-amber-50/10 p-2.5 rounded-xl border border-dashed border-amber-200/50">
                            {feedback}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Marked Answer Sheet Pages */}
              <div className="space-y-6 pt-4 border-t border-black/5 break-before-page print:break-before-page">
                <h3 className="text-sm font-extrabold text-[#303030] tracking-tight uppercase border-l-3 border-[#ff5623] pl-2 break-inside-avoid">
                  Marked Answer Sheets
                </h3>

                <div className="space-y-8">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <div key={pageNum} className={cn("space-y-2 break-inside-avoid", pageNum > 1 && "print:break-before-page")}>
                        <p className="text-xs font-extrabold text-[#303030]">
                          Answer Sheet Page {pageNum}
                        </p>
                        
                        {/* Interactive Page Container */}
                        <div
                          className="relative bg-white border border-slate-200 shadow-sm rounded-lg aspect-[1/1.414] w-full max-w-[500px] p-6 md:p-8 mx-auto text-left font-serif overflow-hidden select-none"
                        >
                          <div className="absolute top-3 right-3 text-[10px] font-bold text-[#a9a9a9] bg-slate-50 px-2 py-0.5 rounded border select-none">
                            Page {pageNum}
                          </div>

                          {/* Render highlight coordinates rects matching current database state */}
                          {currentExam.answers?.map((answer: any, aIdx: number) => {
                            const mapping = currentExam.mappings?.find((m) => m.questionNumber === answer.questionNumber);
                            return answer.regions?.map((region: any, rIdx: number) => {
                              if (region.pageNumber === pageNum) {
                                const { x, y, width, height } = region.boundingBox;
                                return (
                                  <div
                                    key={`${aIdx}-${rIdx}`}
                                    className="absolute border-[2.5px] border-[#ff5623] bg-[#ff5623]/8 rounded-xl transition-all duration-300 pointer-events-none flex flex-col justify-start overflow-hidden"
                                    style={{
                                      left: `${x}%`,
                                      top: `${y}%`,
                                      width: `${width}%`,
                                      height: `${height}%`,
                                    }}
                                  >
                                    <div className="bg-[#ff5623] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-br shadow-sm self-start select-none leading-none">
                                      Q{answer.questionNumber} ({mapping?.score ?? 0} M)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            });
                          })}

                          {/* Simulated Handwriting text */}
                           <div className="h-full flex flex-col justify-start space-y-8 font-serif italic text-blue-800 text-sm md:text-[15px] pt-8 select-none">
                            {(() => {
                              const answersForPage = currentExam.answers?.filter((ans: any) => {
                                const page = ans.regions?.[0]?.pageNumber || 1;
                                return page === pageNum;
                              }) || [];

                              if (answersForPage.length > 0) {
                                return answersForPage.map((ans: any, aIdx: number) => (
                                  <div key={aIdx} className="space-y-1 text-left">
                                    <p className="font-extrabold text-[11px] text-[#FA643C] not-italic">
                                      Q{ans.questionNumber} answer:
                                    </p>
                                    <p className="leading-relaxed whitespace-pre-wrap">
                                      {ans.text}
                                    </p>
                                  </div>
                                ));
                              }
                              return (
                                <p className="text-[#5e5e5e]/50 font-sans not-italic text-center py-10">
                                  No answers mapped to Page {pageNum}
                                </p>
                              );
                            })()}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </article>

          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
