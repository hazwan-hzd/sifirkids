"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { PROFILES, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { PageShell, Loading, BackButton, PointsBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PinGate } from "./PinGate";
import { MetricCard } from "./MetricCard";
import { BarChart, type BarDatum } from "./BarChart";
import { Sparkline } from "./Sparkline";
import { MultiplicationGrid, ArabicGrid } from "./MasteryGrid";
import { RewardApprovals } from "./RewardApprovals";
import { Settings } from "./Settings";
import { formatDuration, formatLastOpen, lastNDays, dayLabel } from "./format";

export default function ParentPage() {
  const { state, hydrated } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [active, setActive] = useState<ChildId>(PROFILES[0].id);

  const child = state.children[active];
  const c = COLOR_CLASSES[child.profile.color];

  const stats = useMemo(() => {
    const sessions = child.sessions;
    const totalQ = sessions.reduce((a, s) => a + s.total, 0);
    const totalC = sessions.reduce((a, s) => a + s.correct, 0);
    const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
    const mathMastered = TABLES.filter((t) => child.multiplication[String(t)]?.mastered).length;
    const arabicMastered = ARABIC_LETTERS.filter((l) => child.arabic[l.id]?.mastered).length;

    const days = lastNDays(14);
    const pointsPerDay: BarDatum[] = days.map((d) => ({
      key: d,
      label: dayLabel(d),
      value: child.daily.history[d]?.pointsEarned ?? 0,
    }));
    const questionsPerDay: BarDatum[] = days.map((d) => ({
      key: d,
      label: dayLabel(d),
      value: child.daily.history[d]?.questionsAnswered ?? 0,
    }));
    const accuracyTrend = sessions.slice(-20).map((s) => (s.total ? (s.correct / s.total) * 100 : 0));

    return { totalQ, accuracy, mathMastered, arabicMastered, pointsPerDay, questionsPerDay, accuracyTrend };
  }, [child]);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <BackButton href="/" />
        <h1 className="font-display text-2xl font-bold text-grape-600">Parent Dashboard</h1>
        <span className="w-12" />
      </div>

      {!unlocked ? (
        <PinGate onUnlock={() => setUnlocked(true)} />
      ) : (
        <div className="space-y-6">
          {/* Child tabs */}
          <div className="flex gap-2">
            {PROFILES.map((p) => {
              const pc = COLOR_CLASSES[p.color];
              const on = p.id === active;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "tap flex-1 rounded-2xl px-3 py-3 font-display font-bold transition",
                    on ? cn(pc.bg, "text-white shadow-[var(--shadow-pop)]") : "bg-white/70 text-ink/60",
                  )}
                >
                  <span className="mr-1">{p.avatar}</span>
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* At a glance */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className={cn("font-display text-xl font-bold", c.text)}>
                {child.profile.avatar} {child.profile.name}
              </h2>
              <PointsBadge points={child.rewards.points} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard icon="📂" label="App opens" value={child.metrics.totalOpens} sub={formatLastOpen(child.metrics.lastOpen)} />
              <MetricCard icon="⏱️" label="Time spent" value={formatDuration(child.metrics.totalTimeSec)} />
              <MetricCard icon="🔥" label="Streak" value={`${child.daily.currentStreak}d`} sub={`best ${child.daily.longestStreak}d`} />
              <MetricCard icon="🎯" label="Accuracy" value={`${stats.accuracy}%`} sub={`${stats.totalQ} questions`} />
              <MetricCard icon="⭐" label="Points now" value={child.rewards.points} />
              <MetricCard icon="🏅" label="Lifetime pts" value={child.rewards.totalEarned} />
              <MetricCard icon="✖️" label="Tables" value={`${stats.mathMastered}/${TABLES.length}`} sub="mastered" />
              <MetricCard icon="🔤" label="Letters" value={`${stats.arabicMastered}/${ARABIC_LETTERS.length}`} sub="mastered" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-3 sm:grid-cols-2">
            <BarChart title="Points earned (14 days)" data={stats.pointsPerDay} color={COLOR_CLASSES.grape.solid} />
            <BarChart title="Questions answered (14 days)" data={stats.questionsPerDay} color={c.solid} />
          </div>
          <Sparkline title="Accuracy trend (recent quizzes)" values={stats.accuracyTrend} color={COLOR_CLASSES.teal.solid} />

          {/* Mastery */}
          <MultiplicationGrid child={child} />
          <ArabicGrid child={child} />

          {/* Cross-child controls */}
          <RewardApprovals />
          <Settings />
        </div>
      )}
    </PageShell>
  );
}
