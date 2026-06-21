"use client";

import type { ModuleConfig } from "@/lib/moduleRegistry";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* LockedModuleCard                                                    */
/* Renders a shaded, non-clickable card for modules that are           */
/* "coming_soon" or "locked". Shows construction icon + BM label.      */
/* ------------------------------------------------------------------ */

interface LockedModuleCardProps {
  module: ModuleConfig;
  className?: string;
}

export function LockedModuleCard({ module, className }: LockedModuleCardProps) {
  return (
    <div
      role="presentation"
      aria-disabled="true"
      className={cn(
        "relative flex flex-col gap-3 rounded-[var(--radius-blob)] p-6",
        "bg-ink/5 cursor-not-allowed select-none",
        "opacity-40 grayscale",
        "transition-all duration-300",
        className,
      )}
      style={{ animationDelay: `${module.animationDelay}ms` }}
    >
      {/* Construction badge */}
      <div className="absolute -right-1 -top-1 z-10 flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1">
        <span className="text-sm">🚧</span>
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-ink/50">
          Dalam Pembinaan
        </span>
      </div>

      {/* Module icon - greyed out */}
      <span className="text-6xl opacity-60">
        {module.emoji}
      </span>

      {/* Module title */}
      <span className="font-display text-2xl font-bold text-ink/40">
        {module.label}
      </span>

      {/* Description */}
      <span className="text-sm text-ink/30">
        {module.description}
      </span>

      {/* Under construction message */}
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-ink/5 px-3 py-2">
        <span className="text-base">🔒</span>
        <span className="font-display text-xs font-semibold text-ink/40">
          Modul ini sedang dibina — akan dibuka tidak lama lagi!
        </span>
      </div>
    </div>
  );
}
