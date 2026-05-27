import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { SidebarBrand } from "@/components/brand/SidebarBrand";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import { PreferencesModal } from "@/components/ui/PreferencesModal";

/** Figma sidebar icons: 20×20, lightweight outline stroke */
const NAV_ICON_SIZE = 20;
const NAV_ICON_STROKE = 1.5;

type SidebarIconComponent = React.FC<{ className?: string }>;

/** Figma "Vector" icon — My Groups (node 2:8764) */
const MyGroupsIcon: SidebarIconComponent = ({ className }) => (
  <svg
    className={cn("h-3.5 w-5 shrink-0", className)}
    viewBox="0 0 20 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.0053 0C19.1069 0 20 0.867353 20 1.93727V12.0627C20 12.8063 19.5687 13.452 18.9357 13.7767C18.7114 13.0842 18.552 12.599 18.4574 12.321C18.403 12.1608 18.3777 12.011 18.2979 11.8819C18.2236 11.7617 18.1006 11.6182 17.9791 11.4747L17.9521 11.4428C17.5516 10.968 17.0414 10.3553 16.609 9.8284C16.1946 9.32331 15.8524 8.89639 15.7181 8.78227C15.3989 8.51105 14.9468 8.21401 14.2686 8.21401H9.66755C9.62487 8.2067 9.53035 8.1911 9.41489 8.14943C8.91888 7.97045 7.88479 7.51948 7.36702 7.30995C6.21465 6.13586 5.35029 5.25332 4.77394 4.66235C4.72638 4.61361 4.61117 4.49397 4.42827 4.30347C4.20391 4.06978 3.83109 4.04594 3.57713 4.24907C3.32508 4.45067 3.28322 4.81013 3.48253 5.06133C5.29064 7.33994 6.21755 8.50276 6.2633 8.5498C6.37468 8.66433 6.70673 8.87699 7.11436 9.14389C7.53415 9.41875 8.03354 9.75 8.41755 10.0092C8.77511 10.2505 8.97606 10.3192 9.01596 10.655C9.10394 11.3955 9.21032 12.5105 9.33511 14H1.99468C0.893058 14 0 13.1326 0 12.0627V1.93727C0 0.867353 0.893058 0 1.99468 0H18.0053ZM15.7979 11.7915C15.9066 11.7819 16.0276 11.915 16.0771 11.9594C16.2486 12.1131 16.3003 12.1721 16.4096 12.2694C16.5691 12.4114 16.7331 12.5764 16.7553 12.6051C16.9727 12.99 17.2919 13.7639 17.4073 14L15.4654 14C15.5489 13.0617 15.6021 12.459 15.625 12.1919C15.6516 11.8819 15.6891 11.8011 15.7979 11.7915ZM12.4734 3.06088C11.1955 3.06088 10.1596 4.06699 10.1596 5.30811C10.1596 6.54922 11.1955 7.55534 12.4734 7.55534C13.7513 7.55534 14.7872 6.54922 14.7872 5.30811C14.7872 4.06699 13.7513 3.06088 12.4734 3.06088Z"
      fill="currentColor"
    />
  </svg>
);

/** Figma sparkle icon — Create Assignment CTA (Frame 1618872409) */
const CreateAssignmentSparkleIcon: SidebarIconComponent = ({ className }) => (
  <svg
    className={cn("h-[18px] w-[19px] shrink-0", className)}
    viewBox="0 0 19 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M4.63783 8.63783L6.18377 4H7.13246L8.6784 8.63783L13.3162 10.1838V11.1325L8.6784 12.6784L7.13246 17.3162H6.18377L4.63783 12.6784L0 11.1325V10.1838L4.63783 8.63783Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M13.3878 2.38783L14.1838 0H15.1325L15.9284 2.38783L18.3162 3.18377V4.13246L15.9284 4.9284L15.1325 7.31623H14.1838L13.3878 4.9284L11 4.13246V3.18377L13.3878 2.38783Z" fill="currentColor"/>
  </svg>
);

/** Figma "Book" icon — AI Teacher's Toolkit (node I2:8788) */
const AiToolkitIcon: SidebarIconComponent = ({ className }) => (
  <svg
    className={cn("h-5 w-5 shrink-0", className)}
    viewBox="0 0 15.3333 18.6667"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M1 15.5833C1 15.0308 1.21949 14.5009 1.61019 14.1102C2.00089 13.7195 2.5308 13.5 3.08333 13.5H14.3333M1 15.5833C1 16.1359 1.21949 16.6658 1.61019 17.0565C2.00089 17.4472 2.5308 17.6667 3.08333 17.6667H14.3333V1H3.08333C2.5308 1 2.00089 1.21949 1.61019 1.61019C1.21949 2.00089 1 2.5308 1 3.08333V15.5833Z"
      stroke="currentColor"
      strokeWidth={NAV_ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Figma "Credit Report" icon — My Library (two-layer composite, node I2:9984) */
const MyLibraryIcon: SidebarIconComponent = ({ className }) => (
  <span className={cn("relative inline-block h-5 w-5 shrink-0 text-current", className)} aria-hidden>
    <svg
      className="absolute inset-[8.35%_8.33%_11.79%_11.63%] h-auto w-auto"
      viewBox="0 0 18.0089 17.9714"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.0087 11.8836C16.4785 13.1373 15.6493 14.2421 14.5936 15.1013C13.5378 15.9606 12.2876 16.5481 10.9524 16.8126C9.61709 17.077 8.23736 17.0104 6.93379 16.6184C5.63023 16.2265 4.44252 15.5211 3.47452 14.5641C2.50651 13.6071 1.78768 12.4275 1.38087 11.1285C0.974049 9.82954 0.891637 8.45066 1.14083 7.11245C1.39003 5.77424 1.96325 4.51744 2.81037 3.45194C3.6575 2.38645 4.75274 1.54468 6.00034 1.00025"
        stroke="currentColor"
        strokeWidth={NAV_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <svg
      className="absolute bottom-1/2 left-1/2 right-[8.33%] top-[8.33%]"
      viewBox="0 0 10.3333 10.3333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.33333 9.33333C9.33333 8.23898 9.11779 7.15535 8.699 6.1443C8.28021 5.13326 7.66638 4.2146 6.89256 3.44078C6.11873 2.66696 5.20008 2.05313 4.18903 1.63434C3.17798 1.21555 2.09435 1 1 1V9.33333H9.33333Z"
        stroke="currentColor"
        strokeWidth={NAV_ICON_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

function SidebarNavIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Icon
      size={NAV_ICON_SIZE}
      strokeWidth={NAV_ICON_STROKE}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

export interface SidebarProps {
  variant?: "default" | "assignments";
  /** Total assignments — Figma orange count badge on Assignments nav */
  assignmentCount?: number;
  /**
   * Primary CTA label on top of the sidebar.
   * Figma: only the Assignment output page uses "AI Teacher’s Toolkit".
   */
  primaryCta?: "create" | "aiTeacherToolkit";
  /** Figma 2:10590 gradient logo vs 2:10644 mono logo (output page only) */
  brandVariant?: "gradient" | "mono";
}

export const Sidebar: React.FC<SidebarProps> = ({
  variant = "default",
  assignmentCount = 0,
  primaryCta = "create",
  brandVariant = "gradient",
}) => {
  const pathname = usePathname();
  const isAssignments = variant === "assignments";
  const ctaHref = primaryCta === "aiTeacherToolkit" ? "#" : "/create";
  const ctaLabel = primaryCta === "aiTeacherToolkit" ? "AI Teacher's Toolkit" : "Create Assignment";

  const { preferences, loadPreferences, setIsSettingsOpen } = useUserPreferencesStore();

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Highlight navigation options mimicking Figma's vertical lists
  const navItems: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
    customIcon?: SidebarIconComponent;
    active?: boolean;
  }> = [
    { label: "Home", href: "/", icon: LayoutGrid },
    { label: "My Groups", href: "#", customIcon: MyGroupsIcon },
    { label: "Assignments", href: "/", icon: FileText, active: true },
    { label: "AI Teacher's Toolkit", href: "#", customIcon: AiToolkitIcon },
    { label: "My Library", href: "#", customIcon: MyLibraryIcon },
  ];

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col flex-shrink-0 z-30 select-none no-print bg-surface-fill",
          isAssignments
            ? "w-[304px] m-3 rounded-2xl h-[calc(100vh-1.5rem)] shadow-sm"
            : "w-[300px] border-r border-neutral-border h-screen sticky top-0"
        )}
      >
        
        {isAssignments ? (
          <div className="flex flex-col px-[26.5px] pt-6">
            {/* Figma 2:10590 — 136×40 logo + wordmark */}
            <SidebarBrand variant={brandVariant} />

            {/* Figma 2:10598 — 56px below logo, CTA centered in 251px column */}
            <div className="mt-14 flex w-full max-w-[251px] justify-center">
              <Link href={ctaHref} passHref className="w-full">
                <span className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium leading-[28px] tracking-[-0.64px] text-[#E2E8F0] transition-standard shadow-sm cursor-pointer select-none btn-gradient-border group hover:text-white">
                  <CreateAssignmentSparkleIcon className="shrink-0 text-[#E2E8F0] group-hover:text-white transition-colors" />
                  <span className="whitespace-nowrap">{ctaLabel}</span>
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <SidebarBrand variant={brandVariant} />
            <div className="mt-6">
              <Link href={ctaHref} passHref className="w-full">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 px-6 text-[16px] font-medium text-[#E2E8F0] transition-standard shadow-sm cursor-pointer select-none btn-gradient-border group hover:text-white">
                  <CreateAssignmentSparkleIcon className="text-[#E2E8F0] group-hover:text-white transition-colors" />
                  <span>{ctaLabel}</span>
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Reusable Navigation List */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto flex flex-col",
            isAssignments ? "mt-14 gap-2 px-[26.5px]" : "gap-2 px-4"
          )}
        >
          {navItems.map((item) => {
            // Highlight active page based on matching route path
            const isActive = item.active || (pathname === "/" && item.label === "Assignments");
            const iconColor = isActive
              ? "text-[#303030]"
              : isAssignments
                ? "text-[#5e5e5e]/80"
                : "text-[#757575]";

            return (
              <Link key={item.label} href={item.href} passHref>
                <span
                  className={cn(
                    "flex h-10 items-center justify-between rounded-lg px-3 text-[16px] leading-[1.4] tracking-[-0.64px] transition-standard cursor-pointer select-none font-normal",
                    isAssignments
                      ? "text-[#5e5e5e]/80 hover:text-[#303030] hover:bg-[#f0f0f0]/50"
                      : "text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F4F4F4]/50",
                    isActive &&
                      (isAssignments
                        ? "bg-[#e2e2e2] text-[#303030] font-medium"
                        : "bg-[#e5e5e5] text-[#1A1A1A] font-medium")
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    {item.customIcon ? (
                      <item.customIcon className={iconColor} />
                    ) : item.icon ? (
                      <SidebarNavIcon icon={item.icon} className={iconColor} />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.label === "Assignments" && assignmentCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-[48px] bg-[#ff5623] px-2.5 text-sm font-semibold leading-[1.4] tracking-[-0.56px] text-white shadow-[inset_0_0_32px_rgba(255,161,10,0.25)]">
                      {assignmentCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* 4. Bottom Utilities & School Profile block */}
        <div
          className={cn(
            "space-y-2",
            isAssignments
              ? "space-y-2 px-[26.5px] pb-6 pt-0"
              : "space-y-3 border-t border-neutral-border p-4"
          )}
        >
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-lg px-3 cursor-pointer select-none font-normal text-[16px] leading-[1.4] tracking-[-0.64px] transition-standard bg-transparent border-none text-left",
              isAssignments
                ? "text-[#5e5e5e]/80 hover:text-[#303030] hover:bg-[#f0f0f0]/50"
                : "text-sm text-neutral-secondary hover:text-neutral-primary font-medium"
            )}
          >
            <SidebarNavIcon
              icon={Settings}
              className={isAssignments ? "text-[#5e5e5e]/80" : "text-neutral-secondary"}
            />
            <span>Settings</span>
          </button>

          {/* Dynamic high contrast School Info block */}
          <div
            className={cn(
              "flex items-center p-3 cursor-pointer hover:bg-black/5 transition-standard",
              isAssignments
                ? "gap-2 bg-[#f0f0f0] rounded-2xl"
                : "space-x-3 bg-page-fill border border-neutral-border rounded-xl"
            )}
            onClick={() => setIsSettingsOpen(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/school-avatar.png"
              alt=""
              className={cn(
                "object-contain shrink-0",
                isAssignments ? "h-14 w-[59px]" : "h-10 w-10"
              )}
            />
            <div className="min-w-0 text-left">
              <p
                className={cn(
                  "font-bold text-[#303030] truncate",
                  isAssignments ? "text-base" : "text-xs text-neutral-primary"
                )}
              >
                {preferences?.schoolName || "Delhi Public School"}
              </p>
              <p
                className={cn(
                  "truncate",
                  isAssignments ? "text-sm text-[#5e5e5e]" : "text-[10px] text-neutral-secondary"
                )}
              >
                {preferences?.schoolAddress || "Bokaro Steel City"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <PreferencesModal />
    </>
  );
};
