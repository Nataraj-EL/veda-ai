import Link from "next/link";
import { cn } from "@/utils/cn";

type BrandVariant = "gradient" | "mono";

const LOGO_SRC = {
  gradient: "/images/vedaai-logo-gradient.png",
  mono: "/images/vedaai-logo-mono.png",
} as const;

/** Figma 2:10590 (gradient) / 2:10644 (mono) — full mark + VedaAI wordmark */
export function SidebarBrand({
  className,
  variant = "gradient",
}: {
  className?: string;
  variant?: BrandVariant;
}) {
  const src = LOGO_SRC[variant];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex cursor-pointer select-none items-center h-10 w-[136px]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="VedaAI"
        width={136}
        height={40}
        className="object-contain object-left h-10 w-[136px]"
      />
    </Link>
  );
}
