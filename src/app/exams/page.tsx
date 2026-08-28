"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, FileText, ClipboardList } from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export default function ExamsDashboard() {
  const router = useRouter();
  const { exams, isLoading, fetchExams, deleteExam } = useExamStore();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const userId = useUserPreferencesStore((state) => state.userId) || "default-user";

  useEffect(() => {
    useUserPreferencesStore.getState().loadPreferences();
    const currentUserId = useUserPreferencesStore.getState().userId || "default-user";
    fetchExams(currentUserId);
  }, [fetchExams]);

  const handleToggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this exam record?");
    if (!confirmDelete) {
      setActiveMenuId(null);
      return;
    }
    try {
      await deleteExam(id, userId);
    } catch (error) {
      alert("Failed to delete exam");
    }
    setActiveMenuId(null);
  };

  // Close menus on clicking anywhere on the document canvas
  useEffect(() => {
    const closeAll = () => setActiveMenuId(null);
    document.addEventListener("click", closeAll);
    return () => document.removeEventListener("click", closeAll);
  }, []);

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* Left Persistent Sidebar */}
      <Sidebar variant="assignments" assignmentCount={0} />

      {/* Main Page Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header title="Exams" variant="assignments" showAssignmentsBack={false} />

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
          {/* Main Content Area */}
          <div className="mx-auto w-full max-w-[1100px] px-4 pt-3 pb-24 md:px-0 md:pb-20 flex-1 flex flex-col">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-4">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
                </div>
                <p className="text-[14px] font-semibold text-[#5e5e5e]/80">
                  Loading exams...
                </p>
              </div>
            ) : exams.length === 0 ? (
              /* Empty state screen */
              <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-5">
                <div className="bg-white/40 p-6 rounded-full border border-black/5 shadow-inner">
                  <svg
                    className="w-16 h-16 text-[#ff5623] shrink-0"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M13.3335 3.33334H15.0002C15.4422 3.33334 15.8661 3.50894 16.1787 3.8215C16.4912 4.13406 16.6668 4.55798 16.6668 5.00001V16.6667C16.6668 17.1087 16.4912 17.5326 16.1787 17.8452C15.8661 18.1577 15.4422 18.3333 15.0002 18.3333H5.00016C4.55814 18.3333 4.13421 18.1577 3.82165 17.8452C3.50909 17.5326 3.3335 17.1087 3.3335 16.6667V5.00001C3.3335 4.55798 3.50909 4.13406 3.82165 3.8215C4.13421 3.50894 4.55814 3.33334 5.00016 3.33334H6.66683"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.4998 1.66666H7.49984C7.0396 1.66666 6.6665 2.03975 6.6665 2.49999V4.16666C6.6665 4.62689 7.0396 4.99999 7.49984 4.99999H12.4998C12.9601 4.99999 13.3332 4.62689 13.3332 4.16666V2.49999C13.3332 2.03975 12.9601 1.66666 12.4998 1.66666Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-[20px] font-bold tracking-[-0.8px] text-[#303030]">
                    No exams uploaded yet
                  </h2>
                  <p className="text-[14px] font-normal leading-normal tracking-[-0.56px] text-[#5e5e5e]/55">
                    Upload your printed question paper and handwritten student answer sheets to configure exams, extract questions, and map student responses.
                  </p>
                </div>

                <Link href="/exams/create" passHref>
                  <span className="inline-flex h-11 cursor-pointer select-none items-center justify-center gap-1.5 rounded-full border border-white/15 bg-[#303030] px-5 text-[14px] font-semibold tracking-[-0.56px] text-white transition-standard hover:bg-[#3d3d3d]">
                    <Plus className="w-4 h-4" />
                    <span>Upload Exam Files</span>
                  </span>
                </Link>
              </div>
            ) : (
              /* Filled List State */
              <div className="flex flex-col gap-4">
                {/* Dashboard headers */}
                <div className="flex items-center justify-between px-2">
                  <div className="hidden md:block">
                    <h2 className="text-[20px] font-bold leading-normal tracking-[-0.8px] text-[#303030]">
                      Exams
                    </h2>
                    <p className="mt-0.5 text-[14px] font-normal leading-normal tracking-[-0.56px] text-[#5e5e5e]/55">
                      Extract assessments, evaluate handwriting, and verify mapped student answers.
                    </p>
                  </div>
                  <Link href="/exams/create" passHref>
                    <span className="hidden md:inline-flex h-10 cursor-pointer select-none items-center justify-center gap-1 rounded-full border border-white/15 bg-[#303030] px-5 text-[14px] font-semibold tracking-[-0.56px] text-white transition-standard hover:bg-[#3d3d3d]">
                      <Plus className="w-4 h-4" />
                      <span>Upload Exam</span>
                    </span>
                  </Link>
                </div>

                {/* Search Bar */}
                <div className="relative flex items-center bg-white rounded-[24px] border border-black/10 focus-within:border-[#FA643C]/40 focus-within:shadow-[0_0_0_2px_rgba(250,100,60,0.08)] px-4 h-[46px] w-full max-w-[360px] no-print transition-all duration-200">
                  <Search className="h-4 w-4 text-[#8E8E93] mr-2" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-0 font-normal outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[14px] text-neutral-primary placeholder-[#8E8E93]"
                  />
                </div>

                {/* Exam Cards Grid */}
                <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-4 md:gap-y-4">
                  {filteredExams.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/exams/${item.id}`)}
                      className={cn(
                        "relative flex h-auto min-h-[142px] md:h-[182px] min-w-0 flex-col justify-between rounded-[24px] bg-white border border-black/5 p-5 md:p-6 shadow-none transition-standard md:max-w-[542px] cursor-pointer hover:border-black/15",
                        activeMenuId === item.id ? "z-40" : "z-0"
                      )}
                    >
                      {activeMenuId === item.id && (
                        <div
                          role="menu"
                          className="absolute right-4 top-12 md:right-6 md:top-14 z-30 min-w-[180px] rounded-2xl border border-black/5 bg-white py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-2 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              router.push(`/exams/${item.id}`);
                            }}
                            className="mx-1.5 flex min-h-[40px] w-[calc(100%-12px)] cursor-pointer items-center rounded-lg px-3 text-left text-[14px] font-bold leading-[1.2] tracking-[-0.56px] text-[#303030] transition-colors hover:bg-[#f4f4f4] border-none bg-transparent"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item.id)}
                            className="mx-1.5 flex min-h-[40px] w-[calc(100%-12px)] cursor-pointer items-center rounded-lg px-3 text-left text-[14px] font-bold leading-[1.2] tracking-[-0.56px] text-[#c53535] transition-colors hover:bg-[#f4f4f4] border-none bg-transparent"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1 justify-start gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate pr-2 text-[18px] md:text-[24px] font-extrabold leading-[1.2] tracking-[-0.72px] md:tracking-[-0.96px] text-[#303030]">
                            {item.title}
                          </h3>
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleMenu(e, item.id)}
                              className="cursor-pointer p-0.5 text-[#303030] transition-standard hover:opacity-70 border-none bg-transparent"
                              aria-label="Exam options"
                            >
                              <MoreVertical className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.25} />
                            </button>
                          </div>
                        </div>

                        {/* File names display */}
                        <div className="mt-2 space-y-1 text-xs md:text-sm text-[#5e5e5e]/80">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-extrabold text-[#303030] shrink-0">Q Paper:</span>
                            <span className="truncate font-medium">{item.questionPaper?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-extrabold text-[#303030] shrink-0">Answer Sheet:</span>
                            <span className="truncate font-medium">{item.studentAnswerSheet?.name}</span>
                          </div>
                          {/* Score Display */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-dashed border-black/5">
                            <span className="font-extrabold text-[#303030]">Score:</span>
                            <span className="text-[12px] font-extrabold text-[#303030]">
                              {item.totalScore} / {item.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0} Marks
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date display */}
                      <div className="flex flex-row items-center justify-between w-full text-[12px] md:text-[14px] font-normal leading-[1.2] text-[#5e5e5e]/80 pt-2 border-t border-black/5 mt-auto">
                        <p>
                          <span className="font-extrabold text-[#303030]">Uploaded</span>
                          <span>{` : ${new Date(item.createdAt).toLocaleDateString('en-GB')}`}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                 {/* Mobile Create Button */}
                 <div className="md:hidden flex justify-center pb-2 pt-2">
                   <Link href="/exams/create" passHref>
                     <span className="inline-flex h-11 cursor-pointer select-none items-center justify-center gap-1.5 rounded-full border border-white/15 bg-[#303030] px-5 text-[14px] font-semibold tracking-[-0.56px] text-white transition-standard hover:bg-[#3d3d3d]">
                       <Plus className="h-4 w-4" />
                       <span>Upload Exam Paper</span>
                     </span>
                   </Link>
                 </div>
              </div>
            )}
          </div>

          <Footer />
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
