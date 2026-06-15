"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  MoreVertical
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FilterByIcon } from "@/components/icons/figma-icons";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

interface Assignment {
  id: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  subject?: string;
  gradeClass?: string;
  numQuestions?: number;
  totalMarks?: number;
  status?: string;
}

interface ApiAssignment {
  id: string;
  title: string;
  createdAt: string;
  dueDate: string;
  subject?: string;
  gradeClass?: string;
  totalQuestions?: number;
  totalMarks?: number;
  generationStatus?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDev = searchParams.get("dev") === "true";

  const [isEmptyState, setIsEmptyState] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Fetch assignments from backend
  useEffect(() => {
    const fetchAssignments = async () => {
      // Load preferences and ensure userId is generated
      useUserPreferencesStore.getState().loadPreferences();
      const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("vedam_user_id") || "";

      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) {
        console.error("NEXT_PUBLIC_API_URL environment variable is not defined.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiBase}/api/assignments?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const data = await response.json();
          const assignmentsList = data.data?.assignments || data.assignments || [];
          const formattedAssignments = assignmentsList.map((a: ApiAssignment) => ({
            id: a.id,
            title: a.title,
            assignedDate: new Date(a.createdAt).toLocaleDateString('en-GB'),
            dueDate: new Date(a.dueDate).toLocaleDateString('en-GB'),
            subject: a.subject,
            gradeClass: a.gradeClass,
            numQuestions: a.totalQuestions,
            totalMarks: a.totalMarks,
            status: a.generationStatus,
          }));
          setAssignments(formattedAssignments);
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleToggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
      e.nativeEvent.stopImmediatePropagation();
    }
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm("Are you sure you want to delete this assignment?");
    if (!confirmDelete) {
      setActiveMenuId(null);
      return;
    }

    const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("vedam_user_id") || "";
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error("NEXT_PUBLIC_API_URL environment variable is not defined.");
      setActiveMenuId(null);
      return;
    }
    try {
      const response = await fetch(`${apiBase}/api/assignments/${id}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAssignments((prev) => prev.filter((item) => item.id !== id));
      } else {
        console.error('Failed to delete assignment');
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
    setActiveMenuId(null);
  };

  // Close menus on clicking anywhere on the document canvas
  React.useEffect(() => {
    const closeAll = () => setActiveMenuId(null);
    document.addEventListener("click", closeAll);
    return () => document.removeEventListener("click", closeAll);
  }, []);

  return (
    <div className="flex h-screen bg-page-fill text-neutral-primary font-sans overflow-hidden">
      {/* 1. Left Persistent Sidebar Layout wrapper */}
      <Sidebar variant="assignments" assignmentCount={assignments.length} />

      {/* 2. Main Page Container */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden md:px-3 md:pt-3">
        <Header title="Assignment" variant="assignments" />

        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 3. Developer States Switcher - Visual floating pill only for review utility */}
        {isDev && (
          <div className="mx-6 mt-4 p-2 bg-white border border-neutral-border rounded-lg flex items-center justify-between no-print">
          <span className="text-xs font-semibold text-neutral-secondary">
            DEVELOPER UTILITY: TOGGLE DASHBOARD VIEWS
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => { setIsEmptyState(true); setActiveMenuId(null); }}
              className={cn(
                "px-3 py-1 rounded text-xs font-bold transition-standard cursor-pointer",
                isEmptyState ? "bg-brand-primary text-white" : "bg-page-fill text-neutral-secondary border border-neutral-border hover:bg-neutral-border"
              )}
            >
              Empty State (0 State)
            </button>
            <button
              onClick={() => { setIsEmptyState(false); setActiveMenuId(null); }}
              className={cn(
                "px-3 py-1 rounded text-xs font-bold transition-standard cursor-pointer",
                !isEmptyState ? "bg-brand-primary text-white" : "bg-page-fill text-neutral-secondary border border-neutral-border hover:bg-neutral-border"
              )}
            >
              Filled State ({assignments.length} Quizzes)
            </button>
          </div>
        </div>
        )}

        {/* Main Content Area */}
        <div className="mx-auto w-full max-w-[1100px] px-4 pt-3 pb-24 md:px-0 md:pb-20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#ff5623] animate-spin" />
              </div>
              <p className="text-[14px] font-semibold text-[#5e5e5e]/80">
                Loading assignments...
              </p>
            </div>
          ) : isEmptyState || assignments.length === 0 ? (
            
            /* ===============================================================
               PORTFOLIO SHOWCASE: 0 STATE SCREEN
               =============================================================== */
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center space-y-6 py-6">
              
              {/* Geometric Code Emblem */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-2xl rounded-full h-32 w-32 -z-10 animate-pulse" />
                <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600">
                  <rect x="10" y="10" width="100" height="100" rx="24" className="stroke-indigo-200 fill-white" strokeWidth="2.5" />
                  <path d="M36 44H84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M36 58H84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M36 72H68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <rect x="74" y="66" width="16" height="16" rx="4" className="fill-purple-500 stroke-purple-600" strokeWidth="1.5" />
                  <circle cx="82" cy="74" r="2.5" fill="white" />
                  <path d="M22 28L25 31M25 28L22 31" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="98" cy="34" r="3" className="fill-indigo-500" />
                </svg>
              </div>

              {/* Descriptions & Branding */}
              <div className="space-y-3">
                <h2 className="text-[22px] font-bold tracking-tight text-[#303030]">
                  Welcome to Vedam AI
                </h2>
                <p className="text-[15px] font-medium leading-relaxed text-[#5e5e5e] max-w-xl mx-auto">
                  An AI-powered academic assistant and document generation platform built by <span className="font-semibold text-indigo-600">Nataraj EL</span>.
                </p>
              </div>

              {/* Engineering Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4 text-left">
                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    AI Document Generation
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Generate typographically perfect, structured academic assessments and answer keys with LaTeX formatting.
                  </p>
                </div>

                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    Assignment Assistance
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Dynamically shape topics and difficulty requirements into customized curriculum test structures.
                  </p>
                </div>

                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    PDF Parsing & Summarization
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Parse structured concepts directly from uploaded notes or textbooks to generate tailored assessment sets.
                  </p>
                </div>

                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Real-Time Progress Tracking
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Monitor worker generation pipelines step-by-step using WebSocket notification syncs.
                  </p>
                </div>

                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Queue-Based Architecture
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Leverages BullMQ background processes backed by a Redis key-value store to run intensive jobs.
                  </p>
                </div>

                <div className="p-4 bg-white border border-neutral-border rounded-xl shadow-sm hover:shadow-md transition-standard">
                  <h3 className="font-bold text-[#303030] text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Scalable Backend Design
                  </h3>
                  <p className="text-[11.5px] text-[#5e5e5e]/80 mt-1 leading-relaxed">
                    Features an Express server with decoupled workers, avoiding HTTP client socket hang-ups.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Link href="/create" passHref>
                  <span className="inline-flex h-12 cursor-pointer select-none items-center justify-center gap-1.5 rounded-full border border-white/50 bg-[#181818] px-6 text-sm font-medium tracking-tight text-white shadow-none transition-standard hover:bg-[#272727]">
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Assignment</span>
                  </span>
                </Link>
              </div>

            </div>

          ) : (
            
            /* ===============================================================
               FIGMA REPLICATION: FILLED STATE
               =============================================================== */
            <div className="flex flex-col gap-3">
              {/* Figma 2:9745 — section title with responsive dot and description overrides */}
              <div className="hidden md:flex items-center gap-3 px-2">
                <div className="hidden md:block size-3 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16),0_0_14px_rgba(16,185,129,0.35)]" />
                <div className="min-w-0">
                  <h2 className="text-[20px] font-bold leading-normal tracking-[-0.8px] text-[#303030]">
                    Assignments
                  </h2>
                  <p className="hidden md:block mt-0.5 text-[14px] font-normal leading-normal tracking-[-0.56px] text-[#5e5e5e]/55">
                    Manage and create assignments for your classes.
                  </p>
                </div>
              </div>

              {/* Desktop unified filter + search row: both in the same curved rounded edge background (Figma Replica) */}
              <div className="hidden md:flex items-center justify-between bg-white rounded-[24px] border border-black/10 p-2 w-full no-print gap-4 shadow-none">
                {/* Filter option inside its own rounded light background pill */}
                <div className="flex shrink-0 items-center px-4 h-[42px]">
                  <label className="flex cursor-pointer items-center gap-2 text-[14px] font-normal tracking-[-0.56px] text-[#8E8E93]">
                    <FilterByIcon className="text-[#8E8E93] h-4 w-4" />
                    <span className="whitespace-nowrap select-none">Filter by</span>
                    <select
                      className="cursor-pointer appearance-none border-0 bg-transparent pr-4 font-normal focus:outline-none text-[14px] text-[#8E8E93] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%238E8E93%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-no-repeat bg-[right_center]"
                      defaultValue="all"
                      aria-label="Filter assignments"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                </div>

                {/* Search name input inside its own rounded light background pill aligned completely to the right */}
                <div className="relative flex items-center bg-[#f6f6f6] rounded-full px-4 h-[42px] w-full max-w-[360px] border border-black/5">
                  <div className="pointer-events-none flex items-center text-[#8E8E93] mr-2">
                    <Search className="h-4 w-4 text-[#8E8E93]" strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Assignment"
                    className="h-full w-full bg-transparent text-[14px] font-normal tracking-[-0.56px] text-[#303030] placeholder:text-[#a9a9a9] focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile unified filter + search row: both in the same curved rounded edge background (Figma Replica) */}
              <div className="flex md:hidden items-center justify-between bg-white rounded-[24px] border border-black/10 p-2 w-full no-print gap-3 shadow-none">
                {/* Mobile filter option inside its own rounded light background pill */}
                <div className="flex shrink-0 items-center px-3 h-[38px]">
                  <label className="flex cursor-pointer items-center gap-1.5 text-[13px] font-normal tracking-[-0.56px] text-[#8E8E93]">
                    <FilterByIcon className="text-[#8E8E93] h-3.5 w-3.5" />
                    <span className="whitespace-nowrap select-none">Filter by</span>
                    <select
                      className="cursor-pointer appearance-none border-0 bg-transparent pr-3 font-normal focus:outline-none text-[13px] text-[#8E8E93]"
                      defaultValue="all"
                      aria-label="Filter assignments"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                </div>

                {/* Mobile search name input inside its own rounded light background pill */}
                <div className="relative flex items-center bg-[#f6f6f6] rounded-full px-3 h-[38px] flex-1 border border-black/5">
                  <div className="pointer-events-none flex items-center text-[#8E8E93] mr-1.5">
                    <Search className="h-3.5 w-3.5 text-[#8E8E93]" strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Name"
                    className="h-full w-full bg-transparent text-[13px] font-normal tracking-[-0.56px] text-[#303030] placeholder:text-[#a9a9a9] focus:outline-none"
                  />
                </div>
              </div>

              {/* Figma 2:9762 — 2 cols · gap 12px · row gap 16px · card 542×162 */}
              <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-3 md:gap-y-4">
                {assignments.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "relative flex h-[116px] md:h-[162px] min-w-0 flex-col justify-between rounded-[24px] bg-white border border-black/5 p-5 md:p-6 shadow-none transition-standard md:max-w-[542px]",
                      activeMenuId === item.id ? "z-40" : "z-0"
                    )}
                  >
                    {activeMenuId === item.id && (
                      <div
                        role="menu"
                        className="absolute right-4 top-12 md:right-6 md:top-14 z-30 min-w-[180px] rounded-2xl border border-black/5 bg-white py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-2 duration-150"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            router.push(`/output?id=${encodeURIComponent(item.id)}`);
                          }}
                          className="mx-1.5 flex min-h-[40px] w-[calc(100%-12px)] cursor-pointer items-center rounded-lg px-3 text-left text-[14px] font-bold leading-[1.2] tracking-[-0.56px] text-[#303030] transition-colors hover:bg-[#f4f4f4] border-none"
                        >
                          View Assignment
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="mx-1.5 flex min-h-[40px] w-[calc(100%-12px)] cursor-pointer items-center rounded-lg px-3 text-left text-[14px] font-bold leading-[1.2] tracking-[-0.56px] text-[#c53535] transition-colors hover:bg-[#f4f4f4] border-none"
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
                            className="cursor-pointer p-0.5 text-[#303030] transition-standard hover:opacity-70"
                            aria-label="Assignment options"
                          >
                            <MoreVertical className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-between w-full pr-14 md:pr-0 text-[12px] md:text-[14px] font-normal leading-[1.2] text-[#5e5e5e]/80">
                      <p>
                        <span className="font-extrabold text-[#303030]">Assigned on</span>
                        <span>{` : ${item.assignedDate}`}</span>
                      </p>
                      <p>
                        <span className="font-extrabold text-[#303030]">Due</span>
                        <span>{` : ${item.dueDate}`}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:flex justify-center pb-2 pt-2">
                <Link href="/create" passHref>
                  <span className="inline-flex h-12 cursor-pointer select-none items-center justify-center gap-1 rounded-full border border-white/50 bg-[#181818] px-6 text-[16px] font-medium tracking-[-0.64px] text-white shadow-none transition-standard hover:bg-[#272727]">
                    <Plus className="h-5 w-5" strokeWidth={2} />
                    <span>Create Assignment</span>
                  </span>
                </Link>
              </div>
            </div>
          )}
          
          {/* Footer Copyright */}
          <footer className="w-full text-center text-xs text-[#5e5e5e]/50 py-6 mt-12 border-t border-black/5 no-print select-none">
            © 2026 Nataraj EL. All Rights Reserved.
          </footer>
        </div>

        <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-page-fill text-neutral-secondary font-semibold">
        Loading...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
