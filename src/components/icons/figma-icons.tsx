import { cn } from "@/utils/cn";

export function FilterByIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2.32153C0 1.03938 1.03938 0 2.32153 0H12.6785C13.9606 0 15 1.03938 15 2.32153C15 2.99412 14.7594 3.64453 14.3217 4.1552L11.9599 6.91062C11.0537 7.96787 10.5556 9.31442 10.5556 10.7069V12.5C10.5556 13.8807 9.43627 15 8.05556 15H6.94444C5.56373 15 4.44444 13.8807 4.44444 12.5V10.7069C4.44444 9.31442 3.94632 7.96787 3.04011 6.91062L0.678317 4.1552C0.240601 3.64453 0 2.99412 0 2.32153ZM2.32153 1.66667C1.95986 1.66667 1.66667 1.95986 1.66667 2.32153C1.66667 2.59627 1.76495 2.86195 1.94375 3.07054L4.30554 5.82597C5.47067 7.18529 6.11111 8.91657 6.11111 10.7069V12.5C6.11111 12.9602 6.48421 13.3333 6.94444 13.3333H8.05556C8.51579 13.3333 8.88889 12.9602 8.88889 12.5V10.7069C8.88889 8.91657 9.52933 7.18529 10.6945 5.82597L13.0563 3.07054C13.2351 2.86195 13.3333 2.59627 13.3333 2.32153C13.3333 1.95986 13.0401 1.66667 12.6785 1.66667H2.32153Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Figma node 2:10630 — 20×20 quad grid beside “Assignment” */
export function HeaderAssignmentGridIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/header-assignment-grid.svg"
      alt=""
      width={20}
      height={20}
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    />
  );
}

/** Figma node 2:10633 — 24×24 bell, stroke 2.25 */
export function HeaderBellIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/header-bell.svg"
      alt=""
      width={24}
      height={24}
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden
    />
  );
}

/** Figma 2:9458 / 19:947 — Download arrow + tray, 24×24 (laptop “Download as PDF”) */
export function DownloadPdfIcon({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "sm";
}) {
  const isSm = size === "sm";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isSm ? "/images/download-pdf-sm.svg" : "/images/download-pdf.svg"}
      alt=""
      width={isSm ? 20 : 24}
      height={isSm ? 20 : 24}
      className={cn(isSm ? "h-5 w-5" : "h-6 w-6", "shrink-0", className)}
      aria-hidden
    />
  );
}

/** Figma 2:9459 — Upload cloud, 24×24 */
export function UploadCloudIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/upload-cloud.svg"
      alt=""
      width={24}
      height={24}
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden
    />
  );
}

/** Figma 2:9500–9501 — 36×36 black circle + white plus (Add Question Type) */
export function AddQuestionTypeIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#303030]",
        className
      )}
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 5V15"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5 10H15"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Figma node 2:10628 — 24×24 arrow inside 40×40 back control */
export function HeaderBackArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10 shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="20" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M18.7071 12.2929C19.0976 12.6834 19.0976 13.3166 18.7071 13.7071L13.4142 19H29C29.5523 19 30 19.4477 30 20C30 20.5523 29.5523 21 29 21H13.4142L18.7071 26.2929C19.0976 26.6834 19.0976 27.3166 18.7071 27.7071C18.3166 28.0976 17.6834 28.0976 17.2929 27.7071L10.2929 20.7071C9.90237 20.3166 9.90237 19.6834 10.2929 19.2929L17.2929 12.2929C17.6834 11.9024 18.3166 11.9024 18.7071 12.2929Z" fill="#303030"/>
    </svg>
  );
}
