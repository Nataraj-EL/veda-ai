import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

// Custom Figma outline/fill SVGs for the mobile footer tabs
const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-[22px] h-[22px] shrink-0", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="7" x="4" y="4" rx="1.5" />
    <rect width="7" height="7" x="13" y="4" rx="1.5" />
    <rect width="7" height="7" x="13" y="13" rx="1.5" />
    <rect width="7" height="7" x="4" y="13" rx="1.5" />
  </svg>
);

const AssignmentsIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-[22px] h-[22px] shrink-0", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="4" width="14" height="16" rx="2.5" />
    <path d="M9 2v4" />
    <path d="M15 2v4" />
    <line x1="9" y1="10" x2="15" y2="10" strokeWidth="2" />
    <line x1="9" y1="14" x2="15" y2="14" strokeWidth="2" />
  </svg>
);

const LibraryIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-[22px] h-[22px] shrink-0", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Page sheet outline with folded top-right corner */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    {/* Small plus sign badge inside */}
    <line x1="12" y1="12" x2="12" y2="18" strokeWidth="2" />
    <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2" />
  </svg>
);

const ExamsIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-[22px] h-[22px] shrink-0", className)}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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
);

const ToolkitIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-[22px] h-[22px] shrink-0", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Mathematically perfect four-point stars for premium AI spark representation */}
    <path d="M9 5c0 4-1 5-5 5 4 0 5 1 5 5 0-4 1-5 5-5-4 0-5-1-5-5Z" />
    <path d="M18 3c0 2.5-.5 3-3 3 2.5 0 3 .5 3 3 0-2.5 .5-3 3-3-2.5 0-3-.5-3-3Z" />
  </svg>
);

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const isExamsSection = pathname.startsWith("/exams");
  const plusHref = isExamsSection ? "/exams/create" : "/create";
  
  // Floating white circular + button with thin premium orange accent
  const items = [
    { label: "Home", href: "#", icon: HomeIcon },
    { label: "Assignments", href: "/", icon: AssignmentsIcon },
    { label: "Exams", href: "/exams", icon: ExamsIcon },
    { label: "AI Toolkit", href: "/create", icon: ToolkitIcon },
  ];

  return (
    <>
      {/* Premium background design pattern at the end of the page (blur & shadow overlay) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 h-[106px] bg-gradient-to-t from-[#E2E2E2] via-[#E2E2E2]/80 to-transparent pointer-events-none z-20 backdrop-blur-[2.5px] no-print" 
        aria-hidden
      />

      {/* Screen-wide horizontal black/grey separator line above the footer zone */}
      <div className="md:hidden fixed bottom-[90px] left-0 right-0 h-px bg-black/10 z-30 no-print" />

      <div className="md:hidden fixed bottom-5 left-4 right-4 bg-[#181818] border border-white/5 py-2.5 pl-6 pr-4 flex items-center justify-between z-40 select-none shadow-[0_12px_40px_rgba(0,0,0,0.55)] rounded-[28px] no-print">
        {/* Navigation items aligned nicely on the left/center */}
        <div className="flex flex-1 items-center justify-around">
          {items.map((item) => {
            // Dynamic tab highlighting matching active route
            const isCurrent = 
              (item.label === "Assignments" && pathname === "/" && !pathname.startsWith("/exams")) ||
              (item.label === "Exams" && (pathname === "/exams" || pathname.startsWith("/exams/"))) ||
              (item.label === "AI Toolkit" && (pathname === "/create" || pathname === "/output") && !pathname.startsWith("/exams"));
            
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                className="flex flex-col items-center space-y-1 py-1 cursor-pointer select-none"
              >
                <item.icon className={cn(
                  "transition-standard",
                  isCurrent ? "text-white stroke-[2px]" : "text-[#8E8E93] hover:text-white/80"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-colors duration-150",
                  isCurrent ? "text-white" : "text-[#8E8E93] hover:text-white/80"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Plus Action Circle Button - Completely aligned inside footer bar, distinct and neatly gapped */}
        <Link 
          href={plusHref} 
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff5623] text-white shadow-[0_4px_12px_rgba(255,86,35,0.3)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer z-50 ml-4"
          aria-label="Create item"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </>
  );
};
