"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import { DownloadPdfIcon } from "@/components/icons/figma-icons";

import { useAssignmentStore } from "@/store/useAssignmentStore";
import { GeneratedAssignment } from "@/types/assignment.types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import { MathRenderer } from "@/components/MathRenderer";

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error?: { message?: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;

type GeneratedResultApi = {
  difficulty: GeneratedAssignment["difficulty"];
  totalMarks: number;
  sections: Array<{
    questions: Array<{
      question: string;
      marks: number;
      type?: string;
      options?: string[];
      sampleAnswer?: string;
      difficulty?: string;
    }>;
  }>;
};

const getAcademicSectionTitle = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("multiple choice") || lower.includes("mcq")) {
    return "Multiple Choice Questions";
  }
  if (lower.includes("short questions") || lower.includes("short answer")) {
    return "Short Answer Questions";
  }
  if (lower.includes("long questions") || lower.includes("long answer")) {
    return "Long Answer Questions";
  }
  if (lower.includes("true") || lower.includes("false")) {
    return "True/False Questions";
  }
  if (lower.includes("diagram") || lower.includes("graph")) {
    return "Diagram/Graph-Based Questions";
  }
  if (lower.includes("numerical")) {
    return "Numerical Problems";
  }
  return type;
};

// High-fidelity fallback assignment exactly replicating the Figma Assignment Output screenshot
const defaultFigmaAssignment: GeneratedAssignment = {
  id: "assign-figma",
  title: "Mid-Term Assessment Paper: NCERT Science Outline",
  difficulty: "medium",
  totalMarks: 20,
  numQuestions: 10,
  dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
  questions: [
    {
      id: "q-1",
      number: 1,
      type: "Short Questions",
      text: "Define electroplating. Explain its purpose.",
      marks: 2,
      sampleAnswer: "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness.",
    },
    {
      id: "q-2",
      number: 2,
      type: "Short Questions",
      text: "What is the role of a conductor in the process of electrolysis?",
      marks: 2,
      sampleAnswer: "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes.",
    },
    {
      id: "q-3",
      number: 3,
      type: "Short Questions",
      text: "Why does a solution of copper sulfate conduct electricity?",
      marks: 2,
      sampleAnswer: "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity.",
    },
    {
      id: "q-4",
      number: 4,
      type: "Short Questions",
      text: "Describe one example of the chemical effect of electric current in daily life.",
      marks: 2,
      sampleAnswer: "An example is the electroplating of silver on jewelry to prevent tarnishing.",
    },
    {
      id: "q-5",
      number: 5,
      type: "Short Questions",
      text: "Explain why electric current is said to have chemical effects.",
      marks: 2,
      sampleAnswer: "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects.",
    },
    {
      id: "q-6",
      number: 6,
      type: "Short Questions",
      text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.",
      marks: 2,
      sampleAnswer: "Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons: 2H2O + 2e- -> H2 + 2OH- ; Na+ + OH- -> NaOH (in solution)",
    },
    {
      id: "q-7",
      number: 7,
      type: "Short Questions",
      text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.",
      marks: 2,
      sampleAnswer: "At the cathode: water is reduced to hydrogen gas and hydroxide ions. At the anode: water is oxidized to oxygen gas and hydrogen ions.",
    },
    {
      id: "q-8",
      number: 8,
      type: "Short Questions",
      text: "Mention the type of current used in electroplating and justify why it is used.",
      marks: 2,
      sampleAnswer: "Direct current (DC) is used because it produces a consistent flow of electrons necessary for controlled deposition of metals.",
    },
    {
      id: "q-9",
      number: 9,
      type: "Short Questions",
      text: "What is the importance of electric current in the field of metallurgy?",
      marks: 2,
      sampleAnswer: "Electric current helps extract metals from their ores and purify metals by electrolysis in metallurgy.",
    },
    {
      id: "q-10",
      number: 10,
      type: "Short Questions",
      text: "Explain with a chemical equation how copper is deposited during the electroplating of an object.",
      marks: 2,
      sampleAnswer: "During copper electroplating, copper ions in solution gain electrons at the cathode and deposit as copper metal: Cu2+ + 2e- -> Cu (solid)",
    },
  ],
};

function AssessmentOutputInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("id");
  const { generatedAssignment, resetStore, setGeneratedAssignment } = useAssignmentStore();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(Boolean(assignmentId));
  const [hasFetchedOutput, setHasFetchedOutput] = useState(
    !assignmentId && Boolean(generatedAssignment)
  );
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);

  const { preferences, loadPreferences } = useUserPreferencesStore();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (!assignmentId) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not defined.");
      const timer = setTimeout(() => {
        setFetchError("API Configuration missing. Please set NEXT_PUBLIC_API_URL.");
        setIsFetching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const load = async (): Promise<void> => {
      setIsFetching(true);
      setHasFetchedOutput(false);
      setIsWaitingForResult(false);
      
      const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("vedam_user_id") || "";

      try {
        const assignmentRes = await fetch(
          `${apiBase}/api/assignments/${assignmentId}?userId=${encodeURIComponent(userId)}`
        );
        const assignmentJson = (await assignmentRes.json()) as ApiResponse<{
          assignment: {
            id: string;
            title: string;
            dueDate: string;
            subject?: string;
            gradeClass?: string;
          };
        }>;

        if (!assignmentRes.ok || !assignmentJson?.success) {
          const msg =
            !assignmentJson?.success
              ? assignmentJson?.error?.message || "Failed to fetch assignment"
              : "Failed to fetch assignment";
          throw new Error(msg);
        }

        // The result may not exist yet (generation still running). Treat that as a waiting state, not an error.
        let resultJson: ApiResponse<{ result: GeneratedResultApi }> | null = null;
        const resultRes = await fetch(
          `${apiBase}/api/assignments/${assignmentId}/result?userId=${encodeURIComponent(userId)}`
        );

        if (resultRes.ok) {
          resultJson = (await resultRes.json()) as ApiResponse<{ result: GeneratedResultApi }>;
          if (!resultJson.success) {
            const msg = resultJson.error?.message || "Failed to fetch generated assessment";
            throw new Error(msg);
          }
        } else if (resultRes.status === 404) {
          // Result not ready yet.
          setIsWaitingForResult(true);
          setFetchError(null);
          return;
        } else {
          // Other errors should surface.
          const maybe = (await resultRes.json().catch(() => null)) as ApiResponse<unknown> | null;
          const msg =
            maybe && !maybe.success
              ? maybe.error?.message || "Failed to fetch generated assessment"
              : "Failed to fetch generated assessment";
          throw new Error(msg);
        }

        const assignmentDetails = assignmentJson.data.assignment;
        const result = resultJson.data.result;

        const questions: GeneratedAssignment["questions"] = [];
        let number = 1;

        for (const section of result.sections) {
          for (const q of section.questions) {
            const inferredType = q.type
              ? q.type
              : Array.isArray(q.options)
                ? "Multiple Choice Questions"
                : "Short Questions";

            questions.push({
              id: `q-${assignmentId}-${number}`,
              number,
              type: inferredType,
              text: q.question,
              marks: q.marks,
              options: q.options,
              sampleAnswer: q.sampleAnswer,
              difficulty: q.difficulty || "medium",
            });
            number++;
          }
        }

        const mapped: GeneratedAssignment = {
          id: assignmentDetails.id,
          title: assignmentDetails.title,
          difficulty: result.difficulty,
          totalMarks: result.totalMarks,
          numQuestions: questions.length, // Calculate dynamically from questions.length!
          dueDate: assignmentDetails.dueDate,
          questions,
          subject: assignmentDetails.subject,
          gradeClass: assignmentDetails.gradeClass,
        };

        setGeneratedAssignment(mapped);
        setHasFetchedOutput(true);
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : "Fetch failed");
        setHasFetchedOutput(false);
      } finally {
        setIsFetching(false);
      }
    };

    void load();
  }, [assignmentId, setGeneratedAssignment]);

  // Poll status while generation is running, then refresh until result becomes available.
  useEffect(() => {
    if (!assignmentId) return;
    if (!isWaitingForResult) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not defined.");
      return;
    }
    const userId =
      useUserPreferencesStore.getState().userId ||
      localStorage.getItem("vedam_user_id") ||
      "";

    let isCancelled = false;
    const interval = window.setInterval(async () => {
      try {
        // If status says failed, surface it.
        const statusRes = await fetch(
          `${apiBase}/api/assignments/${assignmentId}/status?userId=${encodeURIComponent(userId)}`
        );
        const statusJson = await statusRes.json().catch(() => null);

        if (statusRes.ok && statusJson?.success) {
          const status = statusJson.data.status;
          if (status?.generationStatus === "failed") {
            const msg = status?.error || "Generation failed";
            if (!isCancelled) {
              setFetchError(msg);
              setIsWaitingForResult(false);
            }
            return;
          }
        }

        // Try fetching result again.
        const resultRes = await fetch(
          `${apiBase}/api/assignments/${assignmentId}/result?userId=${encodeURIComponent(userId)}`
        );
        if (resultRes.ok) {
          // Trigger the main loader effect by flipping waiting off; it will set the assignment in store.
          if (!isCancelled) setIsWaitingForResult(false);
        }
      } catch {
        // Ignore transient polling errors in dev.
      }
    }, 1500);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [assignmentId, isWaitingForResult]);

  const useMonoBrand =
    !fetchError &&
    !isFetching &&
    hasFetchedOutput &&
    Boolean(generatedAssignment);
  const brandVariant = useMonoBrand ? "mono" : "gradient";

  const assignment = generatedAssignment || defaultFigmaAssignment;

  const handlePrint = () => {
    const originalTitle = document.title;
    const formattedTitle = assignment.title
      ? assignment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "assignment";
    const dateStr = new Date().toISOString().split("T")[0];
    document.title = `assignment-${formattedTitle}-${dateStr}`;
    window.print();
    document.title = originalTitle;
  };

  const handleBack = () => {
    resetStore();
    router.push("/create");
  };

  // Group questions by type for neat division
  const questionTypes = Array.from(new Set(assignment.questions.map(q => q.type)));

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        variant="assignments"
        primaryCta="aiTeacherToolkit"
        brandVariant={brandVariant}
      />

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
        {/* Header bar */}
        <Header title="Create New" onBack={handleBack} brandVariant={brandVariant} />

        <div className="min-h-0 flex-1 overflow-y-auto">
        {isWaitingForResult && !fetchError && (
          <div className="px-6 pt-4">
            <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-neutral-border bg-white/70 px-4 py-3">
              <p className="text-sm font-bold text-neutral-primary">Generating your assessment…</p>
              <p className="mt-1 text-xs font-medium text-neutral-secondary">
                This can take a few seconds. The page will update automatically.
              </p>
            </div>
          </div>
        )}
        {fetchError && (
          <div className="px-6 pt-4">
            <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-feedback-error/30 bg-feedback-error/5 px-4 py-3">
              <p className="text-sm font-bold text-feedback-error">Generation failed</p>
              <p className="text-xs font-medium text-feedback-error/80 mt-1">
                {fetchError}
              </p>
            </div>
          </div>
        )}

        <div className="px-6 pt-4 pb-6 max-w-[820px] mx-auto w-full space-y-4">
          
          {/* ===============================================================
             FIGMA REPLICATION: TOP DARK CARD WITH "Download as PDF"
             =============================================================== */}
          <div className="bg-[#27272A] text-white border border-neutral-border rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print select-none">
            <div className="min-w-0 text-left space-y-1">
              <p className="text-xs font-semibold text-brand-light/95 leading-relaxed">
                Certainly, {preferences?.teacherName || "Teacher"}! Here is your customized {assignment.subject || "Science"} assessment for {assignment.gradeClass || "Class 8"} students.
              </p>
            </div>
            
            {/* Desktop Download Button */}
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center justify-center gap-[4px] h-11 w-[200px] rounded-[12px] bg-white hover:bg-slate-100 text-neutral-primary transition-standard cursor-pointer flex-shrink-0"
            >
              <DownloadPdfIcon />
              <span className="text-[16px] font-medium leading-[22px] tracking-[-0.64px]">
                Download as PDF
              </span>
            </button>

            {/* Mobile Circular Download Button */}
            <button
              onClick={handlePrint}
              className="inline-flex sm:hidden items-center justify-center w-9 h-9 rounded-full bg-[#E5E7EB] hover:bg-slate-200 text-neutral-primary shadow-none cursor-pointer flex-shrink-0"
              aria-label="Download PDF"
            >
              <DownloadPdfIcon size="sm" />
            </button>
          </div>

          {/* ===============================================================
             FIGMA REPLICATION: PHYSICAL ASSESSMENT SHEET
             =============================================================== */}
          <article className="bg-surface-fill border border-neutral-border rounded-[28px] p-6 shadow-sm space-y-4 print-surface print-container">
            
            {/* Center Aligned Headers */}
            <div className="text-center space-y-1 pb-2 select-none">
              <h2 className="text-lg font-bold text-neutral-primary tracking-tight">
                {preferences?.schoolName || "Delhi Public School"}{preferences?.schoolAddress ? `, ${preferences.schoolAddress}` : ", Sector-4, Bokaro"}
              </h2>
              <p className="text-xs font-semibold text-neutral-secondary">
                Subject: {assignment.subject || "Science"}
              </p>
              <p className="text-xs font-semibold text-neutral-secondary">
                Class: {assignment.gradeClass || "Class 8"}
              </p>
            </div>

            {/* Time and Maximum Marks row */}
            <div className="flex justify-between items-center text-xs font-bold text-neutral-primary pt-1 select-none">
              <span>Time Allowed: 45 minutes</span>
              <span>Maximum Marks: {assignment.totalMarks}</span>
            </div>

            {/* Compulsory Instruction */}
            <p className="text-xs font-bold text-neutral-primary text-left select-none">
              All questions are compulsory unless stated otherwise.
            </p>

            {/* Student Metadata fill-in spaces */}
            <div className="space-y-1 text-xs font-bold text-neutral-primary pt-2 select-none text-left leading-relaxed">
              <div>Name: ________________________</div>
              <div>Roll Number: _________________</div>
              <div>Class: {assignment.gradeClass || "Class 8"} Section: _________</div>
            </div>

            {/* Centered Segment Title */}
            <div className="text-center pt-4 select-none">
              <h3 className="text-sm font-bold text-neutral-primary uppercase tracking-wide">
                Section A
              </h3>
            </div>

            {/* Categorized Question Listings */}
            <div className="space-y-4 pt-2">
              {questionTypes.map((type) => {
                const typeQuestions = assignment.questions.filter(q => q.type === type);
                const marksPerQuestion = typeQuestions[0]?.marks || 2;
                
                return (
                  <div key={type} className="space-y-3 print-question">
                    {/* Header for format */}
                    <div className="pb-0.5 select-none">
                      <h4 className="text-sm font-bold text-neutral-primary">
                        {getAcademicSectionTitle(type)}
                      </h4>
                      <p className="text-xs text-neutral-500 italic mt-0.5">
                        Attempt all questions. Each question carries {marksPerQuestion} {marksPerQuestion === 1 ? "mark" : "marks"}
                      </p>
                    </div>

                    {/* Question items */}
                    <div className="space-y-2.5">
                      {typeQuestions.map((q) => (
                        <div key={q.id} className="space-y-1 question-item question-card">
                          <div className="text-xs font-normal text-neutral-primary leading-relaxed">
                            {q.number}. {q.difficulty ? `[${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}] ` : ""}<MathRenderer text={q.text} />{" "}
                            <span className="text-xs font-medium text-neutral-secondary whitespace-nowrap ml-1">
                              [{q.marks} {q.marks === 1 ? "Mark" : "Marks"}]
                            </span>
                          </div>
 
                          {/* MCQ Options with vertical alignment */}
                          {q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-4 pt-0.5">
                              {q.options.map((opt, oIdx) => {
                                const cleanOpt = opt.replace(/^[A-Da-d][\s]*[)..-][\s]*/, "");
                                const label = String.fromCharCode(65 + oIdx);
                                return (
                                  <div key={oIdx} className="text-xs font-normal text-neutral-primary">
                                    {label}) <MathRenderer text={cleanOpt} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* End Marker */}
            <div className="pt-2 text-left text-xs font-bold text-neutral-primary select-none">
              <p>End of Question Paper</p>
            </div>

            {/* Print-only Page 1 Footer */}
            <div className="hidden print:flex justify-between items-center text-[10px] text-[#5e5e5e]/60 font-sans border-t border-black/5 pt-2 mt-8 select-none">
              <span>Generated by Vedam AI</span>
              <span>Page 1</span>
            </div>

            {/* ===============================================================
               FIGMA REPLICATION: ANSWER KEYS SHEET (Starts on fresh physical page in print)
               =============================================================== */}
            <section 
              className="pt-6 space-y-3 print-question break-before-page print:break-before-page" 
              style={{ breakBefore: "page", pageBreakBefore: "always" }}
            >
              <div className="pb-1 select-none">
                <h3 className="text-sm font-bold text-neutral-primary uppercase">
                  Answer Key:
                </h3>
              </div>

              <div className="space-y-2">
                {assignment.questions.map((q) => {
                  const isTechnical = 
                    q.type === "Numerical Problems" || 
                    q.type === "Diagram/Graph-Based Questions" ||
                    q.sampleAnswer?.includes("Step 1") ||
                    q.sampleAnswer?.includes("\n");
                    
                  return (
                    <div key={q.id} className="text-xs leading-relaxed text-neutral-primary question-card">
                      <div className="font-normal text-neutral-primary">
                        <span className="font-bold">{q.number}. </span>
                        <span className={cn(
                          "text-neutral-secondary",
                          isTechnical ? "font-mono bg-slate-50/50 p-2 rounded border border-slate-100 text-[11px] inline-block w-full mt-1" : ""
                        )}>
                          <MathRenderer text={q.sampleAnswer || ""} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Print-only Page 2 Footer */}
              <div className="hidden print:flex justify-between items-center text-[10px] text-[#5e5e5e]/60 font-sans border-t border-black/5 pt-2 mt-8 select-none">
                <span>Generated by Vedam AI</span>
                <span>Page 2</span>
              </div>
            </section>

          </article>
        </div>

        </div>
      </div>
    </div>
  );
}

export default function AssessmentOutputPage() {
  return <Suspense fallback={null}><AssessmentOutputInner /></Suspense>;
}
