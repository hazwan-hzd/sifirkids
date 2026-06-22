"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useSupabaseData, type SupabaseChildData } from "@/lib/supabase-read";
import { PROFILES, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import type { ChildData, ChildId, QuizSession, TopicStat, DayRecord } from "@/lib/types";
import { PageShell, Loading, BackButton, PointsBadge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PinGate } from "./PinGate";
import { MetricCard } from "./MetricCard";
import { BarChart, type BarDatum } from "./BarChart";
import { Sparkline } from "./Sparkline";
import { TopicPieChart, type PieDatum } from "./TopicPieChart";
import { TimeChart, type TimeDatum } from "./TimeChart";
import { MultiplicationGrid, ArabicGrid } from "./MasteryGrid";
import { RewardApprovals } from "./RewardApprovals";
import { TradeApprovals } from "./TradeApprovals";
import { Settings } from "./Settings";
import { formatDuration, formatLastOpen, lastNDays, dayLabel } from "./format";
import {
  fetchVocabGaps,
  toggleVocabReviewed,
  fetchQuizResults as fetchSejarahResults,
  fetchChapters as fetchSejarahChapters,
  type SejarahVocabGap,
  type SejarahQuizResult,
  type ChapterInfo,
} from "@/lib/sejarah";
import {
  fetchVocabGaps as fetchBMVocabGaps,
  toggleVocabReviewed as toggleBMVocabReviewed,
  fetchQuizResults as fetchBMResults,
  fetchTopics as fetchBMTopics,
  levelForChild,
  LEVEL_LABEL,
  type BMQuestion,
  type TopicInfo,
  type BMQuizResult,
  type BMVocabGap,
} from "@/lib/bahasamelayu";

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
  const { data: sbData, loading: sbLoading, error: sbError, refresh: sbRefresh } = useSupabaseData();
  const [unlocked, setUnlocked] = useState(false);
  const [active, setActive] = useState<ChildId | "all">("all");

  const combinedChildData = useMemo(() => {
    const kidsData = PROFILES.map((p) => {
      const local = state.children[p.id];
      const remote = sbData?.[p.id];
      return mergeChildData(local, remote);
    });

    // Merge sessions and sort by date descending
    const allSessions = kidsData.flatMap((kd) => kd.sessions)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Merge daily history
    const mergedHistory: Record<string, DayRecord> = {};
    for (const kd of kidsData) {
      for (const [day, rec] of Object.entries(kd.daily.history)) {
        if (!mergedHistory[day]) {
          mergedHistory[day] = { ...rec };
        } else {
          mergedHistory[day].sessions += rec.sessions;
          mergedHistory[day].pointsEarned += rec.pointsEarned;
          mergedHistory[day].questionsAnswered += rec.questionsAnswered;
          mergedHistory[day].opens += rec.opens;
        }
      }
    }

    const totalOpens = kidsData.reduce((sum, kd) => sum + kd.metrics.totalOpens, 0);
    const lastOpenTimes = kidsData
      .map((kd) => kd.metrics.lastOpen)
      .filter(Boolean) as string[];
    const lastOpen = lastOpenTimes.length > 0
      ? new Date(Math.max(...lastOpenTimes.map((t) => new Date(t).getTime()))).toISOString()
      : null;

    const totalTimeSec = kidsData.reduce((sum, kd) => sum + kd.metrics.totalTimeSec, 0);
    const currentStreak = Math.max(...kidsData.map((kd) => kd.daily.currentStreak));
    const longestStreak = Math.max(...kidsData.map((kd) => kd.daily.longestStreak));
    
    // Sum points
    const points = kidsData.reduce((sum, kd) => sum + kd.rewards.points, 0);
    const totalEarned = kidsData.reduce((sum, kd) => sum + kd.rewards.totalEarned, 0);

    return {
      profile: {
        id: "all" as ChildId,
        name: "All Kids",
        avatar: "👥",
        color: "grape" as const,
      },
      sessions: allSessions,
      daily: {
        history: mergedHistory,
        currentStreak,
        longestStreak,
        lastActiveDate: null,
        dailyGoal: 0,
      },
      metrics: {
        totalOpens,
        lastOpen,
        totalTimeSec,
      },
      rewards: {
        points,
        totalEarned,
        claims: kidsData.flatMap((kd) => kd.rewards.claims),
      },
      multiplication: {},
      arabic: {},
    } as ChildData;
  }, [state, sbData]);

  const child = useMemo(() => {
    if (active === "all") return combinedChildData;
    const local = state.children[active];
    const remote = sbData?.[active];
    return mergeChildData(local, remote);
  }, [state, active, sbData, combinedChildData]);

  const c = COLOR_CLASSES[child.profile.color];

  const stats = useMemo(() => {
    const sessions = child.sessions;
    const totalQ = sessions.reduce((a, s) => a + s.total, 0);
    const totalC = sessions.reduce((a, s) => a + s.correct, 0);
    const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
    
    let mathMastered = 0;
    let arabicMastered = 0;
    if (active === "all") {
      PROFILES.forEach((p) => {
        const local = state.children[p.id];
        const remote = sbData?.[p.id];
        const merged = mergeChildData(local, remote);
        mathMastered += TABLES.filter((t) => merged.multiplication[String(t)]?.mastered).length;
        arabicMastered += ARABIC_LETTERS.filter((l) => merged.arabic[l.id]?.mastered).length;
      });
    } else {
      mathMastered = TABLES.filter((t) => child.multiplication[String(t)]?.mastered).length;
      arabicMastered = ARABIC_LETTERS.filter((l) => child.arabic[l.id]?.mastered).length;
    }

    const days = lastNDays(14);
    const questionsPerDay: BarDatum[] = days.map((d) => ({
      key: d,
      label: dayLabel(d),
      value: child.daily.history[d]?.questionsAnswered ?? 0,
    }));
    const accuracyTrend = sessions.slice(-20).map((s) => (s.total ? (s.correct / s.total) * 100 : 0));

    // Time spent per day (convert seconds to minutes)
    const timePerDay: TimeDatum[] = days.map((d) => {
      const daySessions = sessions.filter((s) => s.date.startsWith(d));
      const totalSec = daySessions.reduce((a, s) => a + s.durationSec, 0);
      return { key: d, label: dayLabel(d), minutes: Math.round(totalSec / 60) };
    });

    // Topic/module distribution
    const moduleCounts: Record<string, number> = {};
    for (const s of sessions) {
      moduleCounts[s.module] = (moduleCounts[s.module] ?? 0) + 1;
    }
    const MODULE_COLORS: Record<string, string> = {
      multiplication: "#ff5a47",
      arabic: "#14c2a0",
      sejarah: "#8b4dff",
      peribahasa: "#e052a0",
      science: "#3b82f6",
      bahasa_melayu: "#eab308",
    };
    const MODULE_LABELS: Record<string, string> = {
      multiplication: "Times Tables",
      arabic: "Alif Ba Ta",
      sejarah: "Sejarah",
      peribahasa: "Peribahasa",
      science: "Sains",
      bahasa_melayu: "Bahasa Melayu",
    };
    const topicDistribution: PieDatum[] = Object.entries(moduleCounts).map(([mod, count]) => ({
      name: MODULE_LABELS[mod] ?? mod,
      value: count,
      color: MODULE_COLORS[mod] ?? "#94a3b8",
    }));

    return { totalQ, accuracy, mathMastered, arabicMastered, questionsPerDay, accuracyTrend, timePerDay, topicDistribution };
  }, [child, active, state.children, sbData]);

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
          {/* Data source indicator & manual refresh */}
          <div className="flex items-center gap-2">
            {sbData && !sbError && (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-leaf-100 px-3 py-2 text-sm font-semibold text-leaf-600">
                ☁️ Synced from cloud
                {sbLoading && " (loading...)"}
              </div>
            )}
            {sbError && (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-coral-100 px-3 py-2 text-sm font-semibold text-coral-600">
                ⚠️ Sync error: {sbError}
              </div>
            )}
            {!sbData && !sbLoading && !sbError && (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sunny-100 px-3 py-2 text-sm font-semibold text-sunny-600">
                📱 Local data only (this device)
              </div>
            )}
            <button
              onClick={sbRefresh}
              disabled={sbLoading}
              className="tap rounded-xl bg-white/70 hover:bg-white px-3 py-2 text-sm font-bold text-ink/70 transition border border-black/5 disabled:opacity-50"
              title="Sync now"
            >
              🔄
            </button>
          </div>

          {/* Child tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActive("all")}
              className={cn(
                "tap flex-1 min-w-[120px] rounded-2xl px-3 py-3 font-display font-bold transition",
                active === "all" ? "bg-grape-500 text-white shadow-[var(--shadow-pop)]" : "bg-white/70 text-grape-600/80",
              )}
            >
              <span className="mr-1">👥</span>
              All Kids
            </button>
            {PROFILES.map((p) => {
              const pc = COLOR_CLASSES[p.color];
              const on = p.id === active;
              const hasRemoteData = sbData?.[p.id] && sbData[p.id].sessions.length > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "tap flex-1 min-w-[120px] rounded-2xl px-3 py-3 font-display font-bold transition",
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
              <MetricCard icon="⭐" label="Stars" value={child.rewards.points} />
              <MetricCard icon="✖️" label="Tables" value={active === "all" ? `${stats.mathMastered}/${TABLES.length * PROFILES.length}` : `${stats.mathMastered}/${TABLES.length}`} sub="mastered" />
              <MetricCard icon="🔤" label="Letters" value={active === "all" ? `${stats.arabicMastered}/${ARABIC_LETTERS.length * PROFILES.length}` : `${stats.arabicMastered}/${ARABIC_LETTERS.length}`} sub="mastered" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeChart title="Time spent (14 days)" data={stats.timePerDay} />
            <TopicPieChart title="Topics breakdown" data={stats.topicDistribution} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BarChart title="Questions answered (14 days)" data={stats.questionsPerDay} color={c.solid} />
            <Sparkline title="Accuracy trend (recent quizzes)" values={stats.accuracyTrend} color={COLOR_CLASSES.teal.solid} />
          </div>

          {/* Progress Section */}
          {active === "all" ? (
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-ink">Individual Progress Overview</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {PROFILES.map((p) => {
                  const local = state.children[p.id];
                  const remote = sbData?.[p.id];
                  const childData = mergeChildData(local, remote);
                  const childColor = COLOR_CLASSES[p.color];

                  const childSessions = childData.sessions;
                  const childTotalQ = childSessions.reduce((a, s) => a + s.total, 0);
                  const childTotalC = childSessions.reduce((a, s) => a + s.correct, 0);
                  const childAccuracy = childTotalQ ? Math.round((childTotalC / childTotalQ) * 100) : 0;

                  const childTablesMastered = TABLES.filter(
                    (t) => childData.multiplication[String(t)]?.mastered,
                  ).length;
                  const childLettersMastered = ARABIC_LETTERS.filter(
                    (l) => childData.arabic[l.id]?.mastered,
                  ).length;

                  return (
                    <Card
                      key={p.id}
                      className={cn("border-2 hover:shadow-md transition-shadow p-4 bg-white", childColor.border)}
                    >
                      <div className="mb-3 flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{p.avatar}</span>
                          <span className={cn("font-display text-lg font-bold", childColor.text)}>
                            {p.name}
                          </span>
                        </div>
                        <PointsBadge points={childData.rewards.points} />
                      </div>
                      
                      <div className="space-y-2 text-sm text-ink/80">
                        <div className="flex justify-between">
                          <span>Stars:</span>
                          <span className="font-bold">{childData.rewards.points} ⭐</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy:</span>
                          <span className="font-bold">{childAccuracy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time spent:</span>
                          <span className="font-bold">{formatDuration(childData.metrics.totalTimeSec)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tables mastered:</span>
                          <span className="font-bold">{childTablesMastered}/{TABLES.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Letters mastered:</span>
                          <span className="font-bold">{childLettersMastered}/{ARABIC_LETTERS.length}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActive(p.id)}
                        className={cn(
                          "mt-4 w-full py-2 rounded-xl text-xs font-bold text-center border transition-colors bg-transparent",
                          childColor.text,
                          childColor.border,
                          "hover:bg-black/5"
                        )}
                      >
                        View Detailed Progress
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Mastery */}
              <MultiplicationGrid child={child} />
              <ArabicGrid child={child} />

              {/* Weak Letters */}
              <WeakLetters child={child} />

              {/* Sejarah Progress (Dhiya only) */}
              {active === "dhiya" && <SejarahProgress />}

              {/* Bahasa Melayu Progress (All children) */}
              <BahasaMelayuProgress childId={active} childName={child.profile.name} />

              {/* Dynamic Vocab Gaps Panel (All children) */}
              <VocabGapsPanel childId={active} childName={child.profile.name} />
            </>
          )}

          {/* Cross-child controls */}
          <RewardApprovals />
          <TradeApprovals />
          <Settings />
        </div>
      )}
    </PageShell>
  );
}

/* --------------------------- Sejarah Progress --------------------------- */

function SejarahProgress() {
  const [results, setResults] = useState<SejarahQuizResult[]>([]);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSejarahResults("dhiya"),
      fetchSejarahChapters(),
    ]).then(([r, c]) => {
      setResults(r);
      setChapters(c);
      setLoading(false);
    });
  }, []);

  // Compute per-chapter best scores
  const chapterStats = useMemo(() => {
    const map = new Map<
      number,
      { best: number; total: number; attempts: number; totalCorrect: number; totalQ: number }
    >();
    for (const r of results) {
      const prev = map.get(r.chapter) ?? {
        best: 0,
        total: 0,
        attempts: 0,
        totalCorrect: 0,
        totalQ: 0,
      };
      const pct = r.total_questions > 0
        ? Math.round((r.correct_answers / r.total_questions) * 100)
        : 0;
      prev.best = Math.max(prev.best, pct);
      prev.attempts += 1;
      prev.totalCorrect += r.correct_answers;
      prev.totalQ += r.total_questions;
      map.set(r.chapter, prev);
    }
    return map;
  }, [results]);

  // Overall stats
  const overall = useMemo(() => {
    const totalQ = results.reduce((a, r) => a + r.total_questions, 0);
    const totalC = results.reduce((a, r) => a + r.correct_answers, 0);
    const totalPts = results.reduce((a, r) => a + (r.points_earned ?? 0), 0);
    return {
      sessions: results.length,
      accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
      totalQ,
      totalPts,
    };
  }, [results]);

  return (
    <div className="rounded-[var(--radius-blob)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-grape-600">
        📜 Sejarah Tingkatan 3
      </h3>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-3xl mb-2">📚</p>
          <p className="text-sm text-ink/50">
            Dhiya belum mula kuiz Sejarah. {chapters.length} bab tersedia dengan {chapters.reduce((a, c) => a + c.questionCount, 0)} soalan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-grape-50 p-3">
              <span className="font-display text-2xl font-bold text-grape-600">
                {overall.accuracy}%
              </span>
              <span className="text-xs font-semibold text-ink/50">Accuracy</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-grape-50 p-3">
              <span className="font-display text-2xl font-bold text-grape-600">
                {overall.sessions}
              </span>
              <span className="text-xs font-semibold text-ink/50">Quizzes</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-grape-50 p-3">
              <span className="font-display text-2xl font-bold text-grape-600">
                {overall.totalPts}
              </span>
              <span className="text-xs font-semibold text-ink/50">Points</span>
            </div>
          </div>

          {/* Per-chapter grid */}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/60">Per-chapter scores</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {chapters.map((ch) => {
                const stat = chapterStats.get(ch.chapter);
                const best = stat?.best ?? 0;
                const attempts = stat?.attempts ?? 0;
                const barColor =
                  best >= 90
                    ? "bg-leaf-500"
                    : best >= 70
                      ? "bg-sunny-400"
                      : best > 0
                        ? "bg-coral-400"
                        : "bg-black/10";
                return (
                  <div
                    key={ch.chapter}
                    className="flex flex-col gap-1 rounded-2xl bg-white/70 p-3"
                  >
                    <span className="text-xs font-bold text-grape-600">
                      Bab {ch.chapter}
                    </span>
                    <span
                      className="text-xs text-ink/50 leading-tight"
                      title={ch.chapter_title}
                    >
                      {ch.chapter_title.length > 25
                        ? ch.chapter_title.slice(0, 25) + "..."
                        : ch.chapter_title}
                    </span>
                    <div className="mt-1 h-2 w-full rounded-full bg-black/5">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${best}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        {best > 0 ? `${best}%` : "—"}
                      </span>
                      <span className="text-xs text-ink/40">
                        {attempts > 0 ? `${attempts}x` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent quizzes */}
          {results.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink/60">Recent quizzes</p>
              <div className="space-y-1.5">
                {results.slice(0, 5).map((r) => {
                  const pct = r.total_questions > 0
                    ? Math.round((r.correct_answers / r.total_questions) * 100)
                    : 0;
                  const dateStr = new Date(r.created_at).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-ink">
                        Bab {r.chapter}
                      </span>
                      <span className="text-xs text-ink/40">{dateStr}</span>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          pct >= 90
                            ? "text-leaf-600"
                            : pct >= 70
                              ? "text-sunny-600"
                              : "text-coral-600",
                        )}
                      >
                        {r.correct_answers}/{r.total_questions} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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

/* --------------------------- Bahasa Melayu Progress --------------------------- */

interface BahasaMelayuProgressProps {
  childId: ChildId;
  childName: string;
}

function BahasaMelayuProgress({ childId, childName }: BahasaMelayuProgressProps) {
  const [results, setResults] = useState<BMQuizResult[]>([]);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const level = levelForChild(childId);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBMResults(childId),
      fetchBMTopics(level),
    ]).then(([r, t]) => {
      setResults(r);
      setTopics(t);
      setLoading(false);
    });
  }, [childId, level]);

  const topicStats = useMemo(() => {
    const map = new Map<
      number,
      { best: number; total: number; attempts: number; totalCorrect: number; totalQ: number }
    >();
    for (const r of results) {
      const prev = map.get(r.topic) ?? {
        best: 0,
        total: 0,
        attempts: 0,
        totalCorrect: 0,
        totalQ: 0,
      };
      const pct = r.total_questions > 0
        ? Math.round((r.correct_answers / r.total_questions) * 100)
        : 0;
      prev.best = Math.max(prev.best, pct);
      prev.attempts += 1;
      prev.totalCorrect += r.correct_answers;
      prev.totalQ += r.total_questions;
      map.set(r.topic, prev);
    }
    return map;
  }, [results]);

  const overall = useMemo(() => {
    const totalQ = results.reduce((a, r) => a + r.total_questions, 0);
    const totalC = results.reduce((a, r) => a + r.correct_answers, 0);
    const totalPts = results.reduce((a, r) => a + (r.points_earned ?? 0), 0);
    return {
      sessions: results.length,
      accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
      totalQ,
      totalPts,
    };
  }, [results]);

  const TOPIC_NAMES: Record<number, string> = {
    1: "Tatabahasa",
    2: "Karangan",
  };

  return (
    <div className="rounded-[var(--radius-blob)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-sunny-600">
        📝 Bahasa Melayu ({LEVEL_LABEL[level]})
      </h3>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-3xl mb-2">📖</p>
          <p className="text-sm text-ink/50">
            {childName} belum mula kuiz Bahasa Melayu. {topics.length} subtopik tersedia.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-sunny-50 p-3">
              <span className="font-display text-2xl font-bold text-sunny-600">
                {overall.accuracy}%
              </span>
              <span className="text-xs font-semibold text-ink/50">Accuracy</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-sunny-50 p-3">
              <span className="font-display text-2xl font-bold text-sunny-600">
                {overall.sessions}
              </span>
              <span className="text-xs font-semibold text-ink/50">Quizzes</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-sunny-50 p-3">
              <span className="font-display text-2xl font-bold text-sunny-600">
                {overall.totalPts}
              </span>
              <span className="text-xs font-semibold text-ink/50">Points</span>
            </div>
          </div>

          {/* Per-topic grid */}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink/60">Per-topic scores</p>
            <div className="grid grid-cols-2 gap-2">
              {topics.map((t) => {
                const stat = topicStats.get(t.topic);
                const best = stat?.best ?? 0;
                const attempts = stat?.attempts ?? 0;
                const barColor =
                  best >= 90
                    ? "bg-leaf-500"
                    : best >= 70
                      ? "bg-sunny-400"
                      : best > 0
                        ? "bg-coral-400"
                        : "bg-black/10";
                const displayName = TOPIC_NAMES[t.topic] || t.topic_title;
                return (
                  <div
                    key={t.topic}
                    className="flex flex-col gap-1 rounded-2xl bg-white/70 p-3"
                  >
                    <span className="text-xs font-bold text-sunny-600">
                      Topik {t.topic}
                    </span>
                    <span className="text-xs text-ink/50 leading-tight">
                      {displayName}
                    </span>
                    <div className="mt-1 h-2 w-full rounded-full bg-black/5">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${best}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        {best > 0 ? `${best}%` : "—"}
                      </span>
                      <span className="text-xs text-ink/40">
                        {attempts > 0 ? `${attempts}x` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent quizzes */}
          {results.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink/60">Recent quizzes</p>
              <div className="space-y-1.5">
                {results.slice(0, 5).map((r) => {
                  const pct = r.total_questions > 0
                    ? Math.round((r.correct_answers / r.total_questions) * 100)
                    : 0;
                  const dateStr = new Date(r.created_at).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {TOPIC_NAMES[r.topic] || `Topik ${r.topic}`}
                      </span>
                      <span className="text-xs text-ink/40">{dateStr}</span>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          pct >= 90
                            ? "text-leaf-600"
                            : pct >= 70
                              ? "text-sunny-600"
                              : "text-coral-600",
                        )}
                      >
                        {r.correct_answers}/{r.total_questions} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Vocab Gaps ----------------------------- */

interface VocabGapsPanelProps {
  childId: ChildId;
  childName: string;
}

interface CombinedVocabGap {
  id: string;
  word: string;
  source: "sejarah" | "bahasa_melayu";
  chapterOrTopic: number;
  reviewed: boolean;
  context: string | null;
}

function VocabGapsPanel({ childId, childName }: VocabGapsPanelProps) {
  const [gaps, setGaps] = useState<CombinedVocabGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promises: Promise<any>[] = [fetchBMVocabGaps(childId)];
    if (childId === "dhiya") {
      promises.push(fetchVocabGaps("dhiya"));
    }

    Promise.all(promises).then(([bmData, sejData]) => {
      const combined: CombinedVocabGap[] = [];
      ((bmData as BMVocabGap[]) ?? []).forEach((g) => {
        combined.push({
          id: g.id,
          word: g.word,
          source: "bahasa_melayu",
          chapterOrTopic: g.topic ?? 0,
          reviewed: g.reviewed,
          context: g.context,
        });
      });
      if (sejData) {
        ((sejData as SejarahVocabGap[]) ?? []).forEach((g) => {
          combined.push({
            id: g.id,
            word: g.word,
            source: "sejarah",
            chapterOrTopic: g.chapter ?? 0,
            reviewed: g.reviewed,
            context: g.context,
          });
        });
      }
      setGaps(combined);
      setLoading(false);
    });
  }, [childId]);

  const handleToggle = async (id: string, source: "sejarah" | "bahasa_melayu", current: boolean) => {
    if (source === "sejarah") {
      await toggleVocabReviewed(id, !current);
    } else {
      await toggleBMVocabReviewed(id, !current);
    }
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, reviewed: !current } : g)),
    );
  };

  // Group by source and chapter/topic
  const grouped = useMemo(() => {
    const map = new Map<string, CombinedVocabGap[]>();
    for (const g of gaps) {
      const label = g.source === "sejarah" 
        ? `Sejarah - Bab ${g.chapterOrTopic}`
        : `Bahasa Melayu - ${g.chapterOrTopic === 1 ? "Tatabahasa" : "Karangan"}`;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(g);
    }
    return Array.from(map.entries()).sort();
  }, [gaps]);

  return (
    <div className="rounded-[var(--radius-blob)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-teal-600">
        📝 {childName} - Perkataan Tak Paham
      </h3>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : gaps.length === 0 ? (
        <p className="text-sm text-ink/50">
          No words flagged yet. Words will appear here when {childName} marks them during BM or Sejarah quizzes.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([sectionLabel, words]) => (
            <div key={sectionLabel}>
              <p className="mb-1.5 text-sm font-bold text-teal-600">
                {sectionLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {words.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleToggle(w.id, w.source, w.reviewed)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-sm font-semibold transition",
                      w.reviewed
                        ? "bg-leaf-100 text-leaf-600 line-through"
                        : w.source === "sejarah"
                          ? "bg-teal-100 text-teal-800"
                          : "bg-sunny-100 text-sunny-800",
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
