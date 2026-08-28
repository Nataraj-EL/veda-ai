import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronLeft, X, LayoutGrid, ClipboardList, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { HeaderBackArrowIcon, HeaderBellIcon } from "@/components/icons/figma-icons";
import { SidebarBrand } from "@/components/brand/SidebarBrand";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";

export interface HeaderProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  showMobileProgress?: boolean;
  variant?: "default" | "assignments";
  /** Figma 2:10625 — always show back control in assignments header */
  showAssignmentsBack?: boolean;
  /** Figma 2:10590 gradient vs 2:10644 mono (assignment output only) */
  helpIconVariant?: "default" | "lucide";
  showMobileVLogo?: boolean;
  brandVariant?: "gradient" | "mono";
}

export const Header: React.FC<HeaderProps> = ({
  title,
  backHref,
  onBack,
  showMobileProgress = false,
  variant = "default",
  showAssignmentsBack = true,
  brandVariant = "gradient",
  helpIconVariant = "default",
  showMobileVLogo = false,
}) => {
  const isAssignments = variant === "assignments";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { preferences, loadPreferences, setIsSettingsOpen } = useUserPreferencesStore();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const showBackButton =
    !!backHref || !!onBack || (isAssignments && showAssignmentsBack);

  const assignmentsTitle =
    title === "Create Assignment" ? "Assignment" : title;

  return (
    <>
      {/* ===============================================================
         DESKTOP — Figma Frame 1618872397 (2:10625) / 2:10001
         1100×56 · pl 24 · pr 12 · gap 10 · radius 16 · bg white/75
         =============================================================== */}
      <header
        className={cn(
          "hidden md:flex shrink-0 items-center justify-between z-20 select-none no-print",
          isAssignments
            ? "h-[56px] max-w-[1100px] w-full gap-[10px] rounded-[16px] bg-white/75 pl-6 pr-3 mx-auto mt-3"
            : "h-[72px] px-6 border-b border-neutral-border bg-surface-fill w-full"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            isAssignments ? "flex-1 gap-[10px]" : "gap-2"
          )}
        >
          {showBackButton && (
            <button
              type="button"
              onClick={handleBackClick}
              className="flex shrink-0 items-center justify-center transition-standard cursor-pointer h-10 w-10 rounded-full bg-white hover:opacity-85"
              aria-label="Navigate back"
            >
              <HeaderBackArrowIcon className="h-10 w-10 shrink-0" />
            </button>
          )}

          {isAssignments ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {title !== "Create Assignment" && (
                title === "Exams" || title === "Upload Exam" ? (
                  <svg
                    className="h-[18px] w-[18px] text-[#a9a9a9] shrink-0"
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
                ) : (
                  <LayoutGrid className="h-[18px] w-[18px] text-[#a9a9a9] shrink-0" strokeWidth={2.2} />
                )
              )}
              <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-normal tracking-[-0.64px] text-[#a9a9a9]">
                {assignmentsTitle}
              </h1>
            </div>
          ) : (
            <h1 className="truncate text-base font-bold tracking-[-0.04em] text-neutral-primary">
              {title}
            </h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-[10px]">
          {isAssignments && helpIconVariant !== "lucide" ? (
            <button
              type="button"
              className="hidden lg:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#303030] hover:bg-[#eaeaea] transition-standard cursor-pointer hover:opacity-85 bg-transparent border-none"
              aria-label="Help"
            >
              {/* Figma Help SVG */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 shrink-0"
              >
                <rect width="36" height="36" rx="18" fill="#F6F6F6"/>
                <rect x="7" y="7" width="22" height="22" rx="11" stroke="#303030" strokeWidth="2"/>
                <path d="M16.6108 19.5934C16.6108 17.5706 17.1694 16.7037 18.1712 15.8561L18.6528 15.4323C19.25 14.9507 19.6353 14.4305 19.6353 13.6214C19.6353 12.5041 18.9032 11.7143 17.8822 11.7143C16.7649 11.7143 15.9558 12.716 15.898 14.2957L13.3551 13.7563C13.4322 11.1363 15.3201 9.46034 17.9208 9.46034C20.5407 9.46034 22.3901 11.0785 22.3901 13.4481C22.3901 14.9892 21.6773 15.9139 20.6563 16.6845L20.1169 17.0697C19.3078 17.7055 18.961 18.2834 18.961 19.5934H16.6108ZM17.8244 23.8123C16.8997 23.8123 16.2448 23.1765 16.2448 22.2711C16.2448 21.385 16.8997 20.7492 17.8244 20.7492C18.7299 20.7492 19.3848 21.385 19.3848 22.2711C19.3848 23.1765 18.7299 23.8123 17.8244 23.8123Z" fill="#303030"/>
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="hidden lg:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#303030] hover:bg-[#eaeaea] transition-standard bg-transparent border-none cursor-pointer"
              aria-label="Help"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 shrink-0"
              >
                <rect x="7" y="7" width="22" height="22" rx="11" stroke="#303030" strokeWidth="2"/>
                <path d="M16.6108 19.5934C16.6108 17.5706 17.1694 16.7037 18.1712 15.8561L18.6528 15.4323C19.25 14.9507 19.6353 14.4305 19.6353 13.6214C19.6353 12.5041 18.9032 11.7143 17.8822 11.7143C16.7649 11.7143 15.9558 12.716 15.898 14.2957L13.3551 13.7563C13.4322 11.1363 15.3201 9.46034 17.9208 9.46034C20.5407 9.46034 22.3901 11.0785 22.3901 13.4481C22.3901 14.9892 21.6773 15.9139 20.6563 16.6845L20.1169 17.0697C19.3078 17.7055 18.961 18.2834 18.961 19.5934H16.6108ZM17.8244 23.8123C16.8997 23.8123 16.2448 23.1765 16.2448 22.2711C16.2448 21.385 16.8997 20.7492 17.8244 20.7492C18.7299 20.7492 19.3848 21.385 19.3848 22.2711C19.3848 23.1765 18.7299 23.8123 17.8244 23.8123Z" fill="#303030"/>
              </svg>
            </button>
          )}

          <button
            type="button"
            className={cn(
              "relative flex shrink-0 items-center justify-center text-[#303030] transition-standard cursor-pointer",
              isAssignments
                ? "h-9 w-9 rounded-full bg-[#f6f6f6] hover:bg-[#eaeaea]"
                : "rounded-full p-1.5 text-neutral-secondary hover:bg-page-fill hover:text-neutral-primary"
            )}
            aria-label="View notifications"
          >
            {isAssignments ? (
              <>
                <HeaderBellIcon />
                <span className="absolute top-[2px] right-[2px] h-2.5 w-2.5 rounded-full bg-[#ff5623]" />
              </>
            ) : (
              <HeaderBellIcon className="h-5 w-5" />
            )}
          </button>

          {isAssignments && (
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#303030] transition-standard cursor-pointer hover:opacity-85 bg-transparent border-none"
              aria-label="AI Toolkit"
            >
              {/* Figma Sparkles SVG */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 shrink-0"
              >
                <rect width="36" height="36" rx="18" fill="white"/>
                <g filter="url(#filter0_i_0_39)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.2319 16.6604C14.4714 15.9139 16.2288 14.1565 16.9753 11.917L17.7219 9.67725L18.3125 8L18.9078 9.67725L19.6543 11.917C20.4008 14.1565 22.1582 15.9139 24.3977 16.6604L26.6375 17.407L28.3125 18L26.6375 18.5928L24.3977 19.3394C22.1582 20.0859 20.4008 21.8433 19.6543 24.0828L18.9078 26.3225L18.3125 28L17.7219 26.3225L16.9753 24.0828C16.2288 21.8433 14.4714 20.0859 12.2319 19.3394L9.99219 18.5928L7.6875 18L9.99219 17.407L12.2319 16.6604Z" fill="#2B2B2B"/>
                </g>
                <defs>
                  <filter id="filter0_i_0_39" x="7.6875" y="8" width="20.625" height="20" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_39"/>
                  </filter>
                </defs>
              </svg>
            </button>
          )}

          <div
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "flex cursor-pointer items-center transition-standard hover:opacity-85",
              isAssignments
                ? "gap-2 rounded-xl bg-white px-3 py-1.5"
                : "space-x-2.5 rounded-lg p-1.5 hover:bg-page-fill"
            )}
          >
            <InitialsAvatar
              name={preferences?.teacherName || "John Doe"}
              imageUrl="/images/user-avatar.png"
              className={cn(
                "shrink-0",
                isAssignments ? "h-8 w-8" : "h-7 w-7"
              )}
            />
            <span
              className={cn(
                "hidden font-semibold tracking-[-0.04em] text-[#303030] sm:inline",
                isAssignments
                  ? "text-[16px] leading-normal tracking-[-0.64px]"
                  : "text-xs"
              )}
            >
              {preferences?.teacherName || "John Doe"}
            </span>
            <ChevronDown
              className={cn(
                "shrink-0",
                isAssignments ? "h-6 w-6 text-[#303030]" : "h-3.5 w-3.5 text-[#a9a9a9]"
              )}
            />
          </div>
        </div>
      </header>

      {/* ===============================================================
         MOBILE
         =============================================================== */}
      {/* ===============================================================
         MOBILE
         =============================================================== */}
      <header className="flex md:hidden shrink-0 z-40 w-full flex-col bg-transparent select-none no-print px-4 pt-3 gap-1">
        <div className="flex h-14 w-full items-center justify-between rounded-[20px] border border-black/10 bg-white px-4 shadow-sm">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                type="button"
                onClick={handleBackClick}
                className="flex items-center justify-center p-1 text-[#303030] hover:opacity-80 transition-standard cursor-pointer"
                aria-label="Navigate back"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            )}
            {showMobileVLogo && (
              <div className="h-6 w-6 overflow-hidden flex items-center justify-start shrink-0 mr-0.5 select-none pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/vedaai-logo-mono.png"
                  alt="VedaAI Logo"
                  className="h-6 min-w-[82px] object-contain object-left"
                />
              </div>
            )}
            <span className="text-[20px] font-bold tracking-[-0.8px] text-[#303030] leading-none">
              VedaAI
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with light circular gray background */}
            <button
              type="button"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f6f6] text-[#303030] hover:bg-[#eaeaea] transition-standard cursor-pointer"
              aria-label="View notifications"
            >
              <HeaderBellIcon className="h-5 w-5" />
              <span className="absolute top-[2px] right-[2px] h-2.5 w-2.5 rounded-full bg-[#ff5623]" />
            </button>
            <InitialsAvatar
              name={preferences?.teacherName || "John Doe"}
              imageUrl="/images/user-avatar.png"
              onClick={() => setIsSettingsOpen(true)}
              className="h-8 w-8 border border-slate-200 cursor-pointer hover:opacity-85"
            />
            {/* Hamburger menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded p-1 text-neutral-primary hover:bg-page-fill cursor-pointer"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-[#303030]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6H20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 12H20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 18H20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {showMobileProgress && (
          <div className="flex h-1 w-full bg-slate-100">
            <div className="h-full w-1/2 bg-slate-800" />
            <div className="h-full w-1/2 bg-slate-200" />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="absolute top-[72px] right-4 left-4 z-50 space-y-3 rounded-[20px] border border-black/10 bg-white p-4 shadow-lg">
            <div className="px-2 text-xs font-semibold text-neutral-500">
              {preferences?.schoolName || "Delhi Public School"}
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className="block rounded px-3 py-2 text-xs font-semibold text-neutral-primary hover:bg-slate-50 cursor-pointer">
                  Home Dashboard
                </span>
              </Link>
              <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                <span className="block rounded px-3 py-2 text-xs font-semibold text-neutral-primary hover:bg-slate-50 cursor-pointer">
                  Create Assignment
                </span>
              </Link>
              <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                <span className="block rounded px-3 py-2 text-xs font-semibold text-neutral-primary hover:bg-slate-50 cursor-pointer">
                  AI Toolkit
                </span>
              </Link>
              <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                <span className="block rounded px-3 py-2 text-xs font-semibold text-neutral-primary hover:bg-slate-50 cursor-pointer">
                  My Library
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full text-left block rounded px-3 py-2 text-xs font-semibold text-neutral-primary hover:bg-slate-50 cursor-pointer bg-transparent border-none"
              >
                Teacher Settings
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
