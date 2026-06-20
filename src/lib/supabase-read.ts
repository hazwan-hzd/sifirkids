"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { ChildId, QuizSession, TopicStat, DayRecord, QuizMode } from "./types";
import { emptyTopicStat } from "./types";
import { MASTERY, POINTS, TABLES } from "./data";
import { computePoints } from "./store";

export interface SupabaseChildData {
  sessions: QuizSession[];
  multiplication: Record<string, TopicStat>;
  arabic: Record<string, TopicStat>;
  daily: {
    history: Record<string, DayRecord>;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  metrics: {
    totalTimeSec: number;
    totalQuestions: number;
    totalCorrect: number;
  };
  rewards: {
    totalEarned: number;
  };
}

function dayKeyFromIso(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetweenKeys(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function buildChildData(
  rows: Array<{
    id: string;
    child_id: string;
    module: string;
    topic: string;
    quiz_mode: string | null;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    best_streak: number;
    points_earned: number;
    created_at: string;
  }>,
): SupabaseChildData {
  const sessions: QuizSession[] = [];
  const multiplication: Record<string, TopicStat> = {};
  const arabic: Record<string, TopicStat> = {};
  const dailyHistory: Record<string, DayRecord> = {};
  let totalTimeSec = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalEarned = 0;

  // Sort by created_at ascending
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  for (const row of sorted) {
    // Build session
    sessions.push({
      id: row.id,
      module: row.module as "multiplication" | "arabic",
      topic: row.topic,
      quizMode: (row.quiz_mode as QuizMode) ?? undefined,
      total: row.total_questions,
      correct: row.correct_answers,
      durationSec: row.duration_sec,
      pointsEarned: row.points_earned,
      date: row.created_at,
    });

    // Accumulate topic stats
    const bucket = row.module === "multiplication" ? multiplication : arabic;
    const stat = bucket[row.topic] ?? emptyTopicStat();
    stat.attempts += row.total_questions;
    stat.correct += row.correct_answers;
    stat.bestStreak = Math.max(stat.bestStreak, row.best_streak);
    stat.lastPracticed = row.created_at;
    stat.mastered =
      stat.attempts >= MASTERY.minAttempts && stat.correct / stat.attempts >= MASTERY.accuracy;
    bucket[row.topic] = stat;

    // Daily history
    const day = dayKeyFromIso(row.created_at);
    const rec = dailyHistory[day] ?? {
      date: day,
      sessions: 0,
      pointsEarned: 0,
      questionsAnswered: 0,
      opens: 0,
    };
    rec.sessions += 1;
    rec.pointsEarned += row.points_earned;
    rec.questionsAnswered += row.total_questions;
    dailyHistory[day] = rec;

    // Totals
    totalTimeSec += row.duration_sec;
    totalQuestions += row.total_questions;
    totalCorrect += row.correct_answers;
    totalEarned += row.points_earned;
  }

  // Compute streaks from daily history
  const activeDays = Object.keys(dailyHistory).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastActiveDate: string | null = null;

  for (let i = 0; i < activeDays.length; i++) {
    if (i === 0 || daysBetweenKeys(activeDays[i - 1], activeDays[i]) === 1) {
      tempStreak += 1;
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    lastActiveDate = activeDays[i];
  }

  // Current streak: count backwards from the last active day
  if (activeDays.length > 0) {
    const today = dayKeyFromIso(new Date().toISOString());
    const last = activeDays[activeDays.length - 1];
    const gap = daysBetweenKeys(last, today);
    if (gap <= 1) {
      currentStreak = 1;
      for (let i = activeDays.length - 2; i >= 0; i--) {
        if (daysBetweenKeys(activeDays[i], activeDays[i + 1]) === 1) {
          currentStreak += 1;
        } else break;
      }
    }
  }

  return {
    sessions,
    multiplication,
    arabic,
    daily: { history: dailyHistory, currentStreak, longestStreak, lastActiveDate },
    metrics: { totalTimeSec, totalQuestions, totalCorrect },
    rewards: { totalEarned },
  };
}

/**
 * Hook that fetches quiz data from Supabase for all children.
 * Returns a map of childId -> SupabaseChildData, plus loading/error state.
 */
export function useSupabaseData() {
  const [data, setData] = useState<Record<string, SupabaseChildData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: err } = await supabase
        .from("quiz_sessions")
        .select("*")
        .order("created_at", { ascending: true });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      // Group by child_id
      const grouped: Record<string, typeof rows> = {};
      for (const row of rows ?? []) {
        const cid = row.child_id;
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(row);
      }

      const result: Record<string, SupabaseChildData> = {};
      for (const [cid, childRows] of Object.entries(grouped)) {
        result[cid] = buildChildData(childRows);
      }

      setData(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
