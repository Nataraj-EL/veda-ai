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

  const items = [
    { label: "Home", href: "#", icon: HomeIcon },
    { label: "Assignments", href: "/", icon: AssignmentsIcon },
    { label: "Library", href: "#", icon: LibraryIcon },
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

      <div className="md:hidden fixed bottom-5 left-4 right-4 bg-[#181818] border border-white/5 py-3 px-6 flex items-center justify-around z-40 select-none shadow-[0_12px_40px_rgba(0,0,0,0.55)] rounded-[28px] no-print">
        {/* Floating white circular + button with thin premium orange accent */}
        <Link 
          href="/create" 
          className="absolute -top-6 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-black/5 text-[#ff5623] hover:scale-105 transition-transform duration-150 cursor-pointer z-50"
          aria-label="Create assignment"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
          </svg>
        </Link>

        {items.map((item) => {
          // Dynamic tab highlighting matching active route
          const isCurrent = 
            (item.label === "Assignments" && pathname === "/") ||
            (item.label === "AI Toolkit" && (pathname === "/create" || pathname === "/output"));
          
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className="flex flex-col items-center space-y-1.5 py-1 cursor-pointer select-none"
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
    </>
  );
};
