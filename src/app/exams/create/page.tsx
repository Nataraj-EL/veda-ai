"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function CreateExamPage() {
  const router = useRouter();
  const { createExam, isUploading, uploadError, clearUploadError } = useExamStore();

  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

  const [questionPaperError, setQuestionPaperError] = useState("");
  const [answerSheetError, setAnswerSheetError] = useState("");

  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [processingState, setProcessingState] = useState<"idle" | "uploading" | "verifying" | "saving">("idle");

  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    clearUploadError();
  }, [clearUploadError]);

  // Simulate progress when uploading/processing
  useEffect(() => {
    if (!isUploading) return;

    let cancelled = false;
    const start = window.setTimeout(() => {
      if (cancelled) return;
      setSimulatedProgress(0);
      setProcessingState("uploading");
    }, 0);

    const interval = window.setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 45) {
          return prev + 5;
        }
        if (prev < 80) {
          setProcessingState("verifying");
          return prev + 2;
        }
        if (prev < 98) {
          setProcessingState("saving");
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearInterval(interval);
      setSimulatedProgress(0);
      setProcessingState("idle");
    };
  }, [isUploading]);

  const validateFile = (file: File, fieldName: string, setError: (msg: string) => void): boolean => {
    setError("");
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (file.size > maxSizeBytes) {
      setError(`${fieldName} exceeds the maximum size limit of 10MB.`);
      return false;
    }
    if (!allowedExtensions.includes(ext)) {
      setError(`${fieldName} must be a PDF or image (JPG, JPEG, PNG, WEBP).`);
      return false;
    }
    return true;
  };

  const handleQuestionPaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      if (validateFile(file, "Question paper", setQuestionPaperError)) {
        setQuestionPaper(file);
      } else {
        setQuestionPaper(null);
      }
    }
  };

  const handleAnswerSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      if (validateFile(file, "Handwritten answer sheet", setAnswerSheetError)) {
        setAnswerSheet(file);
      } else {
        setAnswerSheet(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!questionPaper) {
      setQuestionPaperError("Question paper file is required");
      hasError = true;
    }

    if (!answerSheet) {
      setAnswerSheetError("Student answer sheet is required");
      hasError = true;
    }

    if (hasError) return;

    // Auto-generate title from question paper filename
    const generatedTitle = questionPaper!.name.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append("title", generatedTitle);
    formData.append("userId", userId);
    formData.append("questionPaper", questionPaper!);
    formData.append("studentAnswerSheet", answerSheet!);

    try {
      const newExam = await createExam(formData, userId);
      if (newExam && newExam.id) {
        router.push(`/exams/${newExam.id}`);
      } else {
        router.push("/exams");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar variant="assignments" assignmentCount={0} primaryCta="aiTeacherToolkit" />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header
          title="Exams"
          variant="assignments"
          backHref="/exams"
        />

        {/* Figma Extraction flow — Extracting state inside main layout */}
        {isUploading ? (
          <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex-1 w-full bg-white rounded-[24px] border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-6 px-6 text-center">
                {/* Figma sparkles loading illustration */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/loading-sparkles.png"
                    alt="Loading..."
                    width={96}
                    height={96}
                    className="h-full w-full object-contain animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[28px] md:text-[32px] font-extrabold tracking-[-1.04px] text-[#303030] leading-tight">
                    Extracting
                  </h3>
                  <p className="text-[14px] md:text-[16px] font-normal tracking-[-0.56px] text-[#5e5e5e]/70">
                    This may take a while
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
            <div className="mx-auto w-full px-4 pt-4 pb-36 md:px-2 md:pb-6 flex-grow flex flex-col items-center justify-center">
              
              {/* Error block if backend fails */}
              {uploadError && (
                <div className="max-w-[820px] w-full mb-4 bg-feedback-error/5 border border-feedback-error/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="text-feedback-error w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-feedback-error">Upload failed</h4>
                    <p className="text-xs text-feedback-error/80 mt-1">{uploadError}</p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="w-full max-w-[820px] flex flex-col items-center"
              >
                
                {/* Header Title block — Figma Extraction flow */}
                <div className="w-full text-center flex flex-col items-center justify-center mb-6 md:mb-8">
                  <h2 className="text-[#303030] select-none text-center">
                    {/* Desktop layout: Upload + Badge side-by-side */}
                    <span className="hidden sm:flex flex-row items-center justify-center gap-3 leading-none">
                      {/* Upload - 130 Hug x 48 Hug */}
                      <span className="flex h-12 items-center justify-center text-[28px] font-extrabold tracking-[-1.12px] md:text-[36px]">
                        Upload
                      </span>
                      {/* Question Paper & Answer Sheets - 613 Hug x 56 Hug */}
                      <span className="inline-flex h-[56px] items-center justify-center rounded-[12px] bg-[#ff5623]/10 px-4 text-[22px] font-extrabold tracking-[-0.88px] text-[#ff5623] md:text-[30px] whitespace-nowrap">
                        Question Paper &amp; Answer Sheets
                      </span>
                    </span>
                    {/* Mobile layout: Plain centered text wrapping naturally */}
                    <span className="block sm:hidden text-[22px] font-extrabold tracking-[-0.88px] leading-tight px-4">
                      Upload Question Paper &amp; Answer Sheets
                    </span>
                  </h2>
                  <p className="text-[14px] font-semibold tracking-[-0.56px] text-[#5e5e5e]/80 md:text-[16px] mt-2">
                    Upload both files to get started
                  </p>
                </div>

                {/* Figma teacher avatar illustration */}
                <div className="relative mb-6 md:mb-8 h-[180px] w-[180px] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/teacher-avatar.png"
                    alt="Teacher Illustration"
                    width={180}
                    height={180}
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Upload boxes container card — Figma border, radius, spacing and padding */}
                <div className="w-full rounded-[24px] border border-black/[0.08] bg-[#f9f9f9] p-4 md:p-6 mb-8 md:mb-10">
                  <div className="flex w-full flex-col gap-4 md:flex-row md:gap-5">
                    
                    {/* 1. Question Paper Card */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="question-paper-input"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleQuestionPaperChange}
                        className="hidden"
                      />
                      {!questionPaper ? (
                        <div
                          onClick={() => document.getElementById("question-paper-input")?.click()}
                          className={cn(
                            "flex h-44 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-black/10 bg-white p-6 text-center transition-standard hover:border-[#ff5623]/50",
                            questionPaperError && "border-feedback-error bg-feedback-error/5"
                          )}
                        >
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                            <Upload className="h-5 w-5 text-[#303030]" strokeWidth={2} />
                          </div>
                          <p className="text-sm font-semibold text-[#303030]">
                            Upload <span className="text-[#ff5623]">Question Paper</span>
                          </p>
                          <p className="mt-1 text-[11px] text-[#5e5e5e]/50">Max 10MB</p>
                        </div>
                      ) : (
                        <div className="flex h-44 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-black/10 bg-white p-4 text-center">
                          <div className="relative flex w-full max-w-[280px] items-center gap-3 rounded-[12px] bg-[#f7f7f7] px-4 py-3 text-left">
                            <button
                              type="button"
                              onClick={() => setQuestionPaper(null)}
                              className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[#303030] text-white hover:bg-black border-none"
                              aria-label="Remove question paper"
                            >
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {/* Figma red PDF badge */}
                            <div className="flex h-10 w-[34px] shrink-0 flex-col items-center justify-center rounded-[6px] bg-[#e53935] text-[10px] font-extrabold text-white leading-none tracking-normal">
                              PDF
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold tracking-[-0.56px] text-[#303030]">
                                {questionPaper.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#5e5e5e]/70">
                                {(questionPaper.size / 1024 / 1024).toFixed(0)}MB <span className="mx-1">•</span> 2 Pages
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {questionPaperError && (
                        <p className="mt-2 text-center text-xs font-medium text-feedback-error">{questionPaperError}</p>
                      )}
                    </div>

                    {/* 2. Answer Sheet Card */}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="answer-sheet-input"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleAnswerSheetChange}
                        className="hidden"
                      />
                      {!answerSheet ? (
                        <div
                          onClick={() => document.getElementById("answer-sheet-input")?.click()}
                          className={cn(
                            "flex h-44 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-black/10 bg-white p-6 text-center transition-standard hover:border-[#ff5623]/50",
                            answerSheetError && "border-feedback-error bg-feedback-error/5"
                          )}
                        >
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                            <Upload className="h-5 w-5 text-[#303030]" strokeWidth={2} />
                          </div>
                          <p className="text-sm font-semibold text-[#303030]">
                            Upload <span className="text-[#ff5623]">Answer Sheet</span>
                          </p>
                          <p className="mt-1 text-[11px] text-[#5e5e5e]/50">Max 10MB</p>
                        </div>
                      ) : (
                        <div className="flex h-44 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-black/10 bg-white p-4 text-center">
                          <div className="relative flex w-full max-w-[280px] items-center gap-3 rounded-[12px] bg-[#f7f7f7] px-4 py-3 text-left">
                            <button
                              type="button"
                              onClick={() => setAnswerSheet(null)}
                              className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[#303030] text-white hover:bg-black border-none"
                              aria-label="Remove answer sheet"
                            >
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {/* Figma red PDF badge */}
                            <div className="flex h-10 w-[34px] shrink-0 flex-col items-center justify-center rounded-[6px] bg-[#e53935] text-[10px] font-extrabold text-white leading-none tracking-normal">
                              PDF
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold tracking-[-0.56px] text-[#303030]">
                                {answerSheet.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#5e5e5e]/70">
                                {(answerSheet.size / 1024 / 1024).toFixed(0)}MB <span className="mx-1">•</span> 6 Pages
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {answerSheetError && (
                        <p className="mt-2 text-center text-xs font-medium text-feedback-error">{answerSheetError}</p>
                      )}
                    </div>

                  </div>
                </div>

                {/* Start Mapping / Start Grading CTA */}
                <div className="flex w-full flex-col items-center justify-center pt-2">
                  <button
                    type="submit"
                    disabled={!questionPaper || !answerSheet}
                    className={cn(
                      "inline-flex h-11 cursor-pointer select-none items-center justify-center gap-1.5 rounded-full px-6 text-[14px] font-semibold tracking-[-0.56px] transition-standard border",
                      questionPaper && answerSheet
                        ? "bg-[#303030] text-white border-white/15 hover:bg-[#3d3d3d]"
                        : "cursor-not-allowed bg-[#c5c5c5] text-white/70 border-transparent"
                    )}
                  >
                    <span>Start Mapping</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                  <p className="mt-3 max-w-[410px] text-center text-[14px] leading-[22px] tracking-[-0.8px] text-[#5e5e5e]/80">
                    Once both files are uploaded, you&apos;ll able to map answers with questions
                  </p>
                </div>

              </form>
            </div>

            <Footer />
            <MobileBottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
