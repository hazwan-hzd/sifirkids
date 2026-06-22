"use client";

import { useApp } from "@/lib/store";
import { CHILD_IDS, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import {
  PageShell,
  Loading,
  BackButton,
  Card,
  PointsBadge,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ScoreboardPage() {
  const { state, hydrated } = useApp();

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const kids = CHILD_IDS.map((id) => {
    const child = state.children[id];
    const tablesMastered = TABLES.filter(
      (t) => child.multiplication[String(t)]?.mastered,
    ).length;
    const lettersMastered = ARABIC_LETTERS.filter(
      (l) => child.arabic[l.id]?.mastered,
    ).length;
    const questionsAnswered = Object.values(child.daily.history).reduce(
      (sum, rec) => sum + rec.questionsAnswered,
      0,
    );
    return {
      id,
      child,
      tablesMastered,
      lettersMastered,
      questionsAnswered,
    };
  });

  const ranked = [...kids].sort(
    (a, b) => b.child.rewards.points - a.child.rewards.points,
  );

  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-3">
        <BackButton href="/" />
        <h1 className="font-display text-3xl font-bold text-ink">🏆 Scoreboard</h1>
      </div>

      <p className="mb-6 text-center font-display text-xl text-ink/80">
        Everyone&apos;s a star! 🌟
      </p>

      {/* ---------------------- Leaderboard ---------------------- */}
      <div className="mb-10 flex flex-col gap-3">
        {ranked.map((k, i) => {
          const c = COLOR_CLASSES[k.child.profile.color];
          return (
            <Card
              key={k.id}
              className={cn(
                "animate-rise flex items-center gap-4 p-4",
                c.bgSoft,
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="w-10 text-center text-4xl" aria-hidden>
                {MEDALS[i] ?? "⭐"}
              </span>
              <span className="text-4xl" aria-hidden>
                {k.child.profile.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-display text-2xl font-bold", c.text)}>
                  {k.child.profile.name}
                </p>
              </div>
              <PointsBadge points={k.child.rewards.points} />
            </Card>
          );
        })}
      </div>

      {/* ---------------------- Comparison cards ---------------------- */}
      <h2 className="mb-3 font-display text-2xl font-bold text-ink">
        Star Stats ✨
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {kids.map((k, i) => {
          const c = COLOR_CLASSES[k.child.profile.color];
          const stats = [
            { icon: "🔥", value: k.child.daily.currentStreak, label: "day streak" },
            { icon: "✖️", value: `${k.tablesMastered}/${TABLES.length}`, label: "tables mastered" },
            { icon: "🔤", value: `${k.lettersMastered}/${ARABIC_LETTERS.length}`, label: "letters mastered" },
            { icon: "❓", value: k.questionsAnswered, label: "questions answered" },
          ];
          return (
            <Card
              key={k.id}
              className={cn("animate-rise border-4", c.border)}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="text-4xl" aria-hidden>
                  {k.child.profile.avatar}
                </span>
                <p className={cn("font-display text-2xl font-bold", c.text)}>
                  {k.child.profile.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex flex-col items-center rounded-3xl p-3 text-center",
                      c.bgSoft,
                    )}
                  >
                    <span className="text-2xl" aria-hidden>
                      {s.icon}
                    </span>
                    <span className={cn("font-display text-2xl font-bold", c.text)}>
                      {s.value}
                    </span>
                    <span className="font-display text-xs text-ink/70">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
