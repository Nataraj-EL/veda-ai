import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, X, LayoutGrid } from "lucide-react";
import { cn } from "@/utils/cn";
import { HeaderBackArrowIcon, HeaderBellIcon } from "@/components/icons/figma-icons";
import { SidebarBrand } from "@/components/brand/SidebarBrand";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";

export interface HeaderProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  showMobileProgress?: boolean;
  variant?: "default" | "assignments";
  /** Figma 2:10625 — always show back control in assignments header */
  showAssignmentsBack?: boolean;
  /** Figma 2:10590 gradient vs 2:10644 mono (assignment output only) */
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
                <LayoutGrid className="h-[18px] w-[18px] text-[#a9a9a9] shrink-0" strokeWidth={2.2} />
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
          <button
            type="button"
            className={cn(
              "relative flex shrink-0 items-center justify-center text-[#303030] transition-standard cursor-pointer",
              isAssignments
                ? "h-9 w-9 rounded-full bg-[#f6f6f6]"
                : "rounded-full p-1.5 text-neutral-secondary hover:bg-page-fill hover:text-neutral-primary"
            )}
            aria-label="View notifications"
          >
            {isAssignments ? (
              <>
                <HeaderBellIcon />
                <span className="absolute left-[27px] top-px h-2 w-2 rounded-full bg-[#ff5623] border border-white" />
              </>
            ) : (
              <HeaderBellIcon className="h-5 w-5" />
            )}
          </button>

          <div
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "flex cursor-pointer items-center transition-standard hover:opacity-85",
              isAssignments
                ? "gap-2 rounded-xl bg-white px-3 py-1.5"
                : "space-x-2.5 rounded-lg p-1.5 hover:bg-page-fill"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/monkey-avatar.png"
              alt={preferences?.teacherName || "John Doe"}
              className={cn(
                "shrink-0 rounded-full object-cover",
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
                "shrink-0 text-[#a9a9a9]",
                isAssignments ? "h-6 w-6" : "h-3.5 w-3.5"
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
          <SidebarBrand
            variant={isAssignments ? "mono" : brandVariant}
            className="origin-left"
          />

          <div className="flex items-center gap-3">
            {/* Notification Bell with light circular gray background */}
            <button
              type="button"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f6f6] text-[#303030] hover:bg-[#eaeaea] transition-standard cursor-pointer"
              aria-label="View notifications"
            >
              <HeaderBellIcon className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-[#ff5623]" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/user-avatar.png"
              alt={preferences?.teacherName || "John Doe"}
              onClick={() => setIsSettingsOpen(true)}
              className="h-8 w-8 rounded-full border border-slate-200 object-cover cursor-pointer hover:opacity-85"
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

        {/* Figma-aligned breadcrumb row — Transparent on mobile viewports, title center-aligned on grey background */}
        <div className="relative flex h-14 w-full items-center justify-center bg-transparent px-1">
          {showBackButton && (
            <button
              type="button"
              onClick={handleBackClick}
              className="absolute left-1 z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#E5E7EB] hover:bg-[#D1D5DB] transition-standard"
              aria-label="Navigate back"
            >
              <svg width="24" height="24" viewBox="9 9 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M18.7071 12.2929C19.0976 12.6834 19.0976 13.3166 18.7071 13.7071L13.4142 19H29C29.5523 19 30 19.4477 30 20C30 20.5523 29.5523 21 29 21H13.4142L18.7071 26.2929C19.0976 26.6834 19.0976 27.3166 18.7071 27.7071C18.3166 28.0976 17.6834 28.0976 17.2929 27.7071L10.2929 20.7071C9.90237 20.3166 9.90237 19.6834 10.2929 19.2929L17.2929 12.2929C17.6834 11.9024 18.3166 11.9024 18.7071 12.2929Z" fill="#303030"/>
              </svg>
            </button>
          )}

          <span className="min-w-0 text-[20px] font-bold tracking-[-0.8px] text-[#303030] leading-normal font-sans text-center">
            {title === "Assignment" ? "Assignments" : title}
          </span>
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
