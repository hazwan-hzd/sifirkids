"use client";

import { cn } from "@/lib/utils";

export function MetricCard({
  icon,
  label,
  value,
  sub,
  className,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]", className)}>
      <div className="flex items-center gap-2 text-ink/60">
        <span aria-hidden className="text-xl">
          {icon}
        </span>
        <span className="font-display text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-1 font-display text-2xl font-bold text-ink">{value}</div>
      {sub && <div className="text-xs text-ink/50">{sub}</div>}
    </div>
  );
}
