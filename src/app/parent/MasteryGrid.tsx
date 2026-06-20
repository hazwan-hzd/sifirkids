"use client";

import type { ChildData } from "@/lib/types";
import { TABLES, ARABIC_LETTERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { masteryTier, TIER_STYLE, accuracyPct } from "./format";

function Tile({
  top,
  bottom,
  attempts,
  correct,
  mastered,
  arabic,
}: {
  top: string;
  bottom: string;
  attempts: number;
  correct: number;
  mastered: boolean;
  arabic?: boolean;
}) {
  const tier = masteryTier(attempts, correct, mastered);
  const s = TIER_STYLE[tier];
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl p-2 text-center", s.bg, s.text)}>
      <span className={cn("font-display text-xl font-bold leading-none", arabic && "font-arabic text-2xl")}>
        {top}
      </span>
      <span className="mt-1 text-[10px] opacity-90">
        {attempts > 0 ? `${accuracyPct(attempts, correct)}% · ${attempts}` : bottom}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-ink/60">
      {(["mastered", "strong", "improving", "weak", "untouched"] as const).map((t) => (
        <span key={t} className="inline-flex items-center gap-1">
          <span className={cn("h-3 w-3 rounded", TIER_STYLE[t].bg)} />
          {TIER_STYLE[t].label}
        </span>
      ))}
    </div>
  );
}

export function MultiplicationGrid({ child }: { child: ChildData }) {
  const weakest = TABLES.map((t) => {
    const st = child.multiplication[String(t)];
    return { t, acc: st && st.attempts ? st.correct / st.attempts : -1, attempts: st?.attempts ?? 0 };
  })
    .filter((x) => x.attempts > 0 && x.acc < 0.75)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3)
    .map((x) => `${x.t}×`);

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <h4 className="mb-3 font-display font-semibold text-ink/80">Times Tables</h4>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {TABLES.map((t) => {
          const st = child.multiplication[String(t)];
          return (
            <Tile
              key={t}
              top={`${t}×`}
              bottom="–"
              attempts={st?.attempts ?? 0}
              correct={st?.correct ?? 0}
              mastered={st?.mastered ?? false}
            />
          );
        })}
      </div>
      {weakest.length > 0 && (
        <p className="mt-3 text-sm text-coral-600">Focus next: {weakest.join(", ")}</p>
      )}
      <Legend />
    </div>
  );
}

export function ArabicGrid({ child }: { child: ChildData }) {
  const weakest = ARABIC_LETTERS.map((l) => {
    const st = child.arabic[l.id];
    return { name: l.name, acc: st && st.attempts ? st.correct / st.attempts : -1, attempts: st?.attempts ?? 0 };
  })
    .filter((x) => x.attempts > 0 && x.acc < 0.75)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 4)
    .map((x) => x.name);

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      <h4 className="mb-3 font-display font-semibold text-ink/80">Arabic Letters</h4>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ARABIC_LETTERS.map((l) => {
          const st = child.arabic[l.id];
          return (
            <Tile
              key={l.id}
              top={l.glyph}
              bottom={l.name}
              attempts={st?.attempts ?? 0}
              correct={st?.correct ?? 0}
              mastered={st?.mastered ?? false}
              arabic
            />
          );
        })}
      </div>
      {weakest.length > 0 && (
        <p className="mt-3 text-sm text-coral-600">Focus next: {weakest.join(", ")}</p>
      )}
      <Legend />
    </div>
  );
}
