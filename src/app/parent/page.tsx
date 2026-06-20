"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useSupabaseData, type SupabaseChildData } from "@/lib/supabase-read";
import { PROFILES, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import type { ChildData, ChildId, QuizSession, TopicStat } from "@/lib/types";
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
import { fetchVocabGaps, toggleVocabReviewed, type SejarahVocabGap } from "@/lib/sejarah";

/**
 * Merge localStorage child data with Supabase data.
 * Supabase is authoritative for sessions/stats; localStorage provides
 * rewards, opens, and other client-only data.
 */
function mergeChildData(local: ChildData, remote: SupabaseChildData | undefined): ChildData {
  if (!remote || remote.sessions.length === 0) return local;

  // Use whichever source has more sessions (Supabase is cross-device)
  const useRemoteSessions = remote.sessions.length > local.sessions.length;
  const sessions = useRemoteSessions ? remote.sessions : local.sessions;

  // Merge topic stats: take the one with more attempts
  const mergeTopicBucket = (
    localBucket: Record<string, TopicStat>,
    remoteBucket: Record<string, TopicStat>,
    isArabic = false,
  ): Record<string, TopicStat> => {
    const isArabicAggregateKey = (k: string) =>
      k === "all" || k.startsWith("set-");
    const merged = { ...localBucket };
    for (const [key, remoteStat] of Object.entries(remoteBucket)) {
      // Skip aggregate keys for Arabic - they'd clobber per-letter progress
      if (isArabic && isArabicAggregateKey(key)) continue;
      const localStat = merged[key];
      if (!localStat || remoteStat.attempts > localStat.attempts) {
        merged[key] = remoteStat;
      }
    }
    return merged;
  };

  // Merge daily history: take the higher value per day
  const mergedDailyHistory = { ...local.daily.history };
  for (const [day, remoteRec] of Object.entries(remote.daily.history)) {
    const localRec = mergedDailyHistory[day];
    if (!localRec || remoteRec.sessions > localRec.sessions) {
      mergedDailyHistory[day] = remoteRec;
    }
  }

  return {
    ...local,
    sessions,
    multiplication: mergeTopicBucket(local.multiplication, remote.multiplication),
    arabic: mergeTopicBucket(local.arabic, remote.arabic, true),
    daily: {
      ...local.daily,
      history: mergedDailyHistory,
      currentStreak: Math.max(local.daily.currentStreak, remote.daily.currentStreak),
      longestStreak: Math.max(local.daily.longestStreak, remote.daily.longestStreak),
      lastActiveDate: remote.daily.lastActiveDate ?? local.daily.lastActiveDate,
    },
    metrics: {
      ...local.metrics,
      totalTimeSec: Math.max(local.metrics.totalTimeSec, remote.metrics.totalTimeSec),
    },
    rewards: {
      ...local.rewards,
      totalEarned: Math.max(local.rewards.totalEarned, remote.rewards.totalEarned),
    },
  };
}

export default function ParentPage() {
  const { state, hydrated } = useApp();
  const { data: sbData, loading: sbLoading } = useSupabaseData();
  const [unlocked, setUnlocked] = useState(false);
  const [active, setActive] = useState<ChildId>(PROFILES[0].id);

  const child = useMemo(() => {
    const local = state.children[active];
    const remote = sbData?.[active];
    return mergeChildData(local, remote);
  }, [state, active, sbData]);

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
          {/* Data source indicator */}
          {sbData && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-leaf-100 px-3 py-2 text-sm font-semibold text-leaf-600">
              ☁️ Synced from cloud
              {sbLoading && " (loading...)"}
            </div>
          )}
          {!sbData && !sbLoading && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-sunny-100 px-3 py-2 text-sm font-semibold text-sunny-600">
              📱 Local data only (this device)
            </div>
          )}

          {/* Child tabs */}
          <div className="flex gap-2">
            {PROFILES.map((p) => {
              const pc = COLOR_CLASSES[p.color];
              const on = p.id === active;
              const hasRemoteData = sbData?.[p.id] && sbData[p.id].sessions.length > 0;
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
                  {hasRemoteData && <span className="ml-1 text-xs">☁️</span>}
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

          {/* Weak Letters */}
          <WeakLetters child={child} />

          {/* Sejarah Vocab Gaps (Dhiya only) */}
          {active === "dhiya" && <VocabGapsPanel />}

          {/* Cross-child controls */}
          <RewardApprovals />
          <Settings />
        </div>
      )}
    </PageShell>
  );
}

/* ----------------------------- Weak Letters ----------------------------- */

function WeakLetters({ child }: { child: ChildData }) {
  // Find Arabic letters with low accuracy (attempted but < 80% correct)
  const weakLetters = useMemo(() => {
    const results: Array<{
      letter: (typeof ARABIC_LETTERS)[number];
      attempts: number;
      correct: number;
      accuracy: number;
    }> = [];
    for (const l of ARABIC_LETTERS) {
      const stat = child.arabic[l.id];
      if (!stat || stat.attempts === 0) continue;
      const accuracy = Math.round((stat.correct / stat.attempts) * 100);
      if (accuracy < 80) {
        results.push({ letter: l, attempts: stat.attempts, correct: stat.correct, accuracy });
      }
    }
    // Also find letters never attempted
    const notAttempted = ARABIC_LETTERS.filter(
      (l) => !child.arabic[l.id] || child.arabic[l.id].attempts === 0,
    );
    return { weak: results.sort((a, b) => a.accuracy - b.accuracy), notAttempted };
  }, [child.arabic]);

  if (weakLetters.weak.length === 0 && weakLetters.notAttempted.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-blob)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-coral-600">
        🔍 Arabic - Needs Practice
      </h3>

      {weakLetters.weak.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-sm font-semibold text-ink/60">Weak letters (&lt;80% accuracy)</p>
          <div className="flex flex-wrap gap-2">
            {weakLetters.weak.map(({ letter, accuracy, attempts }) => (
              <div
                key={letter.id}
                className="flex flex-col items-center gap-0.5 rounded-2xl bg-coral-100 px-3 py-2"
              >
                <span className="font-arabic text-3xl text-ink">{letter.glyph}</span>
                <span className="text-xs font-bold text-ink">{letter.name}</span>
                <span className="text-xs font-semibold text-coral-600">
                  {accuracy}% ({attempts} tries)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakLetters.notAttempted.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink/60">
            Not yet tested ({weakLetters.notAttempted.length} letters)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {weakLetters.notAttempted.map((l) => (
              <span
                key={l.id}
                className="rounded-xl bg-black/5 px-2 py-1 font-arabic text-xl text-ink/40"
              >
                {l.glyph}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Vocab Gaps ----------------------------- */

function VocabGapsPanel() {
  const [gaps, setGaps] = useState<SejarahVocabGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVocabGaps("dhiya").then((data) => {
      setGaps(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await toggleVocabReviewed(id, !current);
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, reviewed: !current } : g)),
    );
  };

  // Group by chapter
  const grouped = useMemo(() => {
    const map = new Map<number, SejarahVocabGap[]>();
    for (const g of gaps) {
      const ch = g.chapter ?? 0;
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch)!.push(g);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [gaps]);

  return (
    <div className="rounded-[var(--radius-blob)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-teal-600">
        📝 Dhiya - Perkataan Tak Paham
      </h3>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : gaps.length === 0 ? (
        <p className="text-sm text-ink/50">
          No words flagged yet. Words will appear here when Dhiya marks them during Sejarah quizzes.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([chapter, words]) => (
            <div key={chapter}>
              <p className="mb-1.5 text-sm font-bold text-teal-600">
                Bab {chapter}
              </p>
              <div className="flex flex-wrap gap-2">
                {words.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleToggle(w.id, w.reviewed)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-sm font-semibold transition",
                      w.reviewed
                        ? "bg-leaf-100 text-leaf-600 line-through"
                        : "bg-teal-100 text-teal-800",
                    )}
                    title={w.context ? `Context: ${w.context.slice(0, 60)}...` : ""}
                  >
                    {w.word}
                    {w.reviewed && " ✓"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-ink/40">
            Tap a word to mark as reviewed. Tap again to unmark.
          </p>
        </div>
      )}
    </div>
  );
}
