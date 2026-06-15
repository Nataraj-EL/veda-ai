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
import { Footer } from "@/components/layout/Footer";

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
      const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("veda_user_id") || "";

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

    const userId = useUserPreferencesStore.getState().userId || localStorage.getItem("veda_user_id") || "";
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

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col">
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
        <div className="mx-auto w-full max-w-[1100px] px-4 pt-3 pb-24 md:px-0 md:pb-20 flex-1 flex flex-col">
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
               FIGMA REPLICATION: 0 STATE SCREEN
               =============================================================== */
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-4">
              
              {/* Graphic Illustration Placeholder styled minimally */}
              <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_2_10580)">
                <path d="M150 269C216.274 269 270 215.274 270 149C270 82.7258 216.274 29 150 29C83.7258 29 30 82.7258 30 149C30 215.274 83.7258 269 150 269Z" fill="url(#paint0_linear_2_10580)"/>
                <g filter="url(#filter0_d_2_10580)">
                <rect x="89.0001" y="63.5564" width="124.537" height="155.029" rx="16" fill="white"/>
                </g>
                <rect x="100" y="83.5564" width="50" height="9.8" rx="4.9" fill="#011625"/>
                <rect x="100" y="111.356" width="100" height="9.8" rx="4.9" fill="#D5D5D5"/>
                <rect x="100" y="139.156" width="100" height="9.8" rx="4.9" fill="#D5D5D5"/>
                <rect x="100" y="166.956" width="100" height="9.8" rx="4.9" fill="#D5D5D5"/>
                <rect x="100" y="194.756" width="100" height="9.8" rx="4.9" fill="#D5D5D5"/>
                <g filter="url(#filter1_d_2_10580)">
                <path d="M288.15 46.424H228.069C225.27 46.424 223 48.8125 223 51.7588V81.478C223 84.4243 225.27 86.8128 228.069 86.8128H288.15C290.95 86.8128 293.219 84.4243 293.219 81.478V51.7588C293.219 48.8125 290.95 46.424 288.15 46.424Z" fill="white"/>
                </g>
                <path d="M238 73C241.314 73 244 70.3137 244 67C244 63.6863 241.314 61 238 61C234.686 61 232 63.6863 232 67C232 70.3137 234.686 73 238 73Z" fill="#CCC6D9"/>
                <rect x="252" y="61" width="32" height="12" rx="6" fill="#D5D5D5"/>
                <path d="M185.11 100.563C219.627 100.563 247.61 128.545 247.61 163.063C247.61 176.539 243.344 189.017 236.091 199.224L275.364 236.716L260.605 253.841L219.904 214.988C209.958 221.666 197.989 225.563 185.11 225.563C150.592 225.563 122.61 197.581 122.61 163.063C122.61 128.545 150.592 100.563 185.11 100.563ZM185.505 110.15C156.282 110.15 132.592 133.84 132.592 163.063C132.592 192.286 156.282 215.976 185.505 215.976C214.728 215.976 238.418 192.286 238.418 163.063C238.418 133.84 214.728 110.15 185.505 110.15Z" fill="#CCC6D9"/>
                <foreignObject x="123" y="101" width="125" height="124"><div style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", clipPath: "url(#bgblur_1_2_10580_clip_path)", height: "100%", width: "100%" }}></div></foreignObject><path data-figma-bg-blur-radius="8" d="M185.5 217C215.6 217 240 192.823 240 163C240 133.177 215.6 109 185.5 109C155.4 109 131 133.177 131 163C131 192.823 155.4 217 185.5 217Z" fill="white" fillOpacity={0.3}/>
                <path d="M194.923 163L208.112 149.862C209.348 148.562 210.025 146.835 209.999 145.047C209.974 143.259 209.248 141.552 207.976 140.287C206.704 139.023 204.986 138.301 203.187 138.276C201.388 138.251 199.65 138.923 198.342 140.151L185.124 153.289L171.935 140.151C171.3 139.484 170.537 138.95 169.691 138.58C168.845 138.211 167.933 138.014 167.009 138.001C166.085 137.988 165.168 138.159 164.312 138.504C163.456 138.85 162.678 139.362 162.024 140.012C161.371 140.661 160.855 141.434 160.508 142.285C160.16 143.136 159.988 144.048 160.001 144.967C160.014 145.885 160.212 146.791 160.584 147.632C160.955 148.473 161.493 149.231 162.165 149.862L175.376 163L162.165 176.138C161.493 176.769 160.955 177.527 160.584 178.368C160.212 179.209 160.014 180.115 160.001 181.033C159.988 181.952 160.16 182.863 160.508 183.715C160.855 184.566 161.371 185.339 162.024 185.988C162.678 186.637 163.456 187.15 164.312 187.496C165.168 187.841 166.085 188.012 167.009 187.999C167.933 187.986 168.845 187.789 169.691 187.42C170.537 187.05 171.3 186.516 171.935 185.849L185.153 172.711L198.372 185.849C199.692 187.004 201.405 187.616 203.164 187.559C204.922 187.503 206.592 186.782 207.834 185.544C209.076 184.305 209.796 182.643 209.848 180.896C209.9 179.148 209.279 177.446 208.112 176.138L194.923 163Z" fill="#FF4040"/>
                <path d="M260.601 253.843L275.362 236.717L277.585 238.84C279.742 240.899 281.033 243.775 281.175 246.836C281.317 249.898 280.297 252.893 278.341 255.163C276.384 257.433 273.651 258.792 270.742 258.941C267.833 259.09 264.987 258.017 262.83 255.958L260.607 253.836L260.601 253.843Z" fill="#E1DCEB"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M56.3144 91.1717C56.2956 89.7456 56.1167 88.3073 55.7589 86.8592C54.5042 81.7771 48.9064 78.5144 42.9484 77.7473C36.9927 76.9802 30.7993 78.7258 28.4123 83.1465C27.047 85.674 26.8587 87.8525 27.4166 89.6891C27.9721 91.5159 29.2903 93.0304 31.0793 94.2106C36.0675 97.4978 44.8034 98.169 48.7887 96.7946C50.6319 96.1578 52.4327 95.3908 54.1864 94.513C53.1836 100.259 49.4477 105.702 44.4619 110.607C33.6264 121.268 16.8117 129.36 7.65456 132.335C7.16257 132.495 6.88948 133.04 7.04249 133.554C7.19551 134.068 7.71809 134.356 8.21008 134.196C17.5485 131.162 34.6905 122.898 45.7402 112.026C51.4487 106.411 55.5164 100.089 56.2109 93.4435C69.1156 86.242 79.7134 73.1767 88.774 62.1815C89.1106 61.7758 89.0659 61.1587 88.6751 60.8071C88.2844 60.4579 87.6958 60.5022 87.3592 60.9103C78.6681 71.4556 68.5812 83.9997 56.3144 91.1717ZM54.4383 92.2166C54.509 90.6136 54.3582 88.9859 53.951 87.3435C52.8658 82.9449 47.8776 80.3437 42.72 79.6798C39.5585 79.2742 36.3077 79.6086 33.7583 80.7985C32.1552 81.546 30.8345 82.6302 30.0389 84.1055C28.9937 86.0404 28.7677 87.6951 29.1961 89.099C29.6245 90.5128 30.6887 91.6486 32.0752 92.5608C36.6208 95.5579 44.575 96.1948 48.2025 94.9433C50.3423 94.2057 52.4186 93.2861 54.4383 92.2166Z" fill="#011625"/>
                <circle cx="285" cy="184" r="6" fill="#417BA4"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M58.3844 225.394C59.4552 224.993 60.582 224.459 61.4509 223.686C62.4829 222.769 62.9026 221.587 63.1845 220.343C63.5463 218.744 63.6909 217.042 64.1297 215.441C64.2921 214.846 64.6048 214.621 64.7389 214.522C65.078 214.27 65.4207 214.202 65.7432 214.228C66.1254 214.257 66.6503 214.409 66.9955 215.083C67.0448 215.18 67.1087 215.327 67.1518 215.528C67.1832 215.676 67.2035 216.137 67.2367 216.328C67.3198 216.797 67.3894 217.266 67.4546 217.737C67.6718 219.306 67.7968 220.639 68.4829 222.081C69.414 224.038 70.3469 225.235 71.6122 225.766C72.8355 226.279 74.2983 226.182 76.1672 225.78C76.3451 225.735 76.521 225.696 76.6952 225.664C77.5192 225.513 78.3069 226.082 78.4687 226.946C78.6306 227.809 78.1069 228.65 77.2903 228.84C77.1198 228.88 76.9518 228.917 76.7857 228.952C74.2601 228.952 71.3364 231.958 69.6374 234.014C69.1137 234.648 68.3469 236.421 67.5647 237.551C66.9875 238.386 66.3389 238.935 65.7943 239.13C65.4294 239.261 65.1217 239.24 64.8675 239.174C64.4983 239.079 64.1918 238.868 63.9568 238.533C63.8288 238.35 63.71 238.104 63.6534 237.791C63.6263 237.64 63.6232 237.257 63.6238 237.083C63.4644 236.506 63.2694 235.943 63.1272 235.36C62.7881 233.971 62.1229 233.092 61.3327 231.93C60.5937 230.843 59.7998 230.159 58.6361 229.614C58.4848 229.575 57.2632 229.26 56.8318 229.08C56.2017 228.815 55.9014 228.371 55.7924 228.132C55.6072 227.727 55.5881 227.373 55.6251 227.077C55.6798 226.641 55.8657 226.268 56.1955 225.967C56.3998 225.78 56.7051 225.598 57.1137 225.509C57.4294 225.44 58.2669 225.4 58.3844 225.394ZM65.5506 223.13C65.6072 223.263 65.6675 223.396 65.7315 223.531C67.0952 226.397 68.6201 227.998 70.4737 228.774L70.5358 228.799C69.2958 229.768 68.1733 230.851 67.3155 231.889C66.9623 232.317 66.4946 233.205 65.9894 234.115C65.5303 232.545 64.7795 231.435 63.8355 230.045C63.1143 228.985 62.3586 228.187 61.43 227.537C62.1506 227.148 62.838 226.692 63.4367 226.16C64.4337 225.273 65.0927 224.246 65.5506 223.13Z" fill="#417BA4"/>
                </g>
                <defs>
                <filter id="filter0_d_2_10580" x="59.0001" y="53.5564" width="184.537" height="215.029" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="20"/>
                <feGaussianBlur stdDeviation="15"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.570833 0 0 0 0 0.570833 0 0 0 0 0.570833 0 0 0 0.19 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2_10580"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2_10580" result="shape"/>
                </filter>
                <filter id="filter1_d_2_10580" x="216" y="37.424" width="96.219" height="66.3889" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="6" dy="4"/>
                <feGaussianBlur stdDeviation="6.5"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.104618 0 0 0 0 0.465612 0 0 0 0 0.545833 0 0 0 0.09 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2_10580"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2_10580" result="shape"/>
                </filter>
                <clipPath id="bgblur_1_2_10580_clip_path" transform="translate(-123 -101)"><path d="M185.5 217C215.6 217 240 192.823 240 163C240 133.177 215.6 109 185.5 109C155.4 109 131 133.177 131 163C131 192.823 155.4 217 185.5 217Z"/>
                </clipPath><linearGradient id="paint0_linear_2_10580" x1="149.075" y1="-10.0749" x2="151.533" y2="411.347" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F2F2F2"/>
                <stop offset="1" stopColor="#EFEFEF"/>
                </linearGradient>
                <clipPath id="clip0_2_10580">
                <rect width="300" height="300" fill="white"/>
                </clipPath>
                </defs>
              </svg>

              {/* Descriptions matching Figma exact string copy */}
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold tracking-[-0.8px] text-[#303030]">
                  No assignments yet
                </h2>
                <p className="text-[14px] font-normal leading-normal tracking-[-0.56px] text-[#5e5e5e]/55">
                  Create your first assignment to start collecting and grading student submissions. 
                  You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
              </div>

              {/* Figma Button Replicating Black Rounded Pill */}
              <Link href="/create" passHref>
                <span className="inline-flex h-12 cursor-pointer select-none items-center justify-center gap-1 rounded-full border border-white/50 bg-[#181818] px-6 text-[16px] font-medium tracking-[-0.64px] text-white shadow-none transition-standard hover:bg-[#272727]">
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Assignment</span>
                </span>
              </Link>

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
        </div>

        <Footer />
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
