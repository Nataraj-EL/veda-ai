"use client";

import React, { useEffect, useState } from "react";

interface ClickEffect {
  id: number;
  x: number;
  y: number;
}

export default function ClickBurstProvider({ children }: { children: React.ReactNode }) {
  const [effects, setEffects] = useState<ClickEffect[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Filter out interactive controls / CTA targets
      const isInteractive = (el: HTMLElement): boolean => {
        const tag = el.tagName.toLowerCase();
        return (
          tag === "button" ||
          tag === "a" ||
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          el.getAttribute("role") === "button" ||
          el.closest("button") !== null ||
          el.closest("a") !== null ||
          el.closest('[role="button"]') !== null
        );
      };

      if (isInteractive(target)) return;

      const newEffect = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setEffects((prev) => [...prev, newEffect]);

      // Remove component after animation finishes (500ms)
      setTimeout(() => {
        setEffects((prev) => prev.filter((eff) => eff.id !== newEffect.id));
      }, 500);
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
        {effects.map((eff) => (
          <div
            key={eff.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
            style={{ left: eff.x, top: eff.y }}
          >
            <span className="absolute w-[3px] h-[9px] rounded-full bg-[#181818] animate-burst-1" />
            <span className="absolute w-[3px] h-[9px] rounded-full bg-[#181818] animate-burst-2" />
            <span className="absolute w-[3px] h-[9px] rounded-full bg-[#181818] animate-burst-3" />
            <span className="absolute w-[3px] h-[9px] rounded-full bg-[#181818] animate-burst-4" />
          </div>
        ))}
      </div>
    </>
  );
}
