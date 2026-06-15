import Link from "next/link";
import { cn } from "@/utils/cn";

export function SidebarBrand({
  className,
  variant = "gradient",
}: {
  className?: string;
  variant?: "gradient" | "mono";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2.5 h-10 font-sans",
        className
      )}
    >
      {/* Dynamic Geometric Gradient Icon */}
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl font-extrabold text-white shadow-sm transition-all",
        variant === "mono" 
          ? "bg-neutral-800" 
          : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
      )}>
        <span className="text-lg tracking-tighter">V</span>
      </div>
      <span className={cn(
        "text-lg font-bold tracking-tight",
        variant === "mono" 
          ? "text-neutral-850" 
          : "bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 bg-clip-text text-transparent"
      )}>
        Vedam <span className={cn(variant === "mono" ? "text-neutral-500" : "text-indigo-600 font-bold")}>AI</span>
      </span>
    </Link>
  );
}
