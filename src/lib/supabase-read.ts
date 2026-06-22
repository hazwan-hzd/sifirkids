"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { ChildId, QuizSession, TopicStat, DayRecord, QuizMode } from "./types";
import { emptyTopicStat } from "./types";
import { MASTERY, POINTS, TABLES, ARABIC_LETTERS } from "./data";
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

/** Build a name→id lookup for Arabic letters (case-insensitive) */
const ARABIC_NAME_TO_ID: Record<string, string> = {};
for (const l of ARABIC_LETTERS) {
  ARABIC_NAME_TO_ID[l.name.toLowerCase()] = l.id;
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
  arabicAnswers: Array<{
    correct_answer: string;
    is_correct: boolean;
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

    // Accumulate topic stats (for multiplication only - Arabic uses per-letter from answers)
    if (row.module === "multiplication") {
      const stat = multiplication[row.topic] ?? emptyTopicStat();
      stat.attempts += row.total_questions;
      stat.correct += row.correct_answers;
      stat.bestStreak = Math.max(stat.bestStreak, row.best_streak);
      stat.lastPracticed = row.created_at;
      stat.mastered =
        stat.attempts >= MASTERY.minAttempts && stat.correct / stat.attempts >= MASTERY.accuracy;
      multiplication[row.topic] = stat;
    }

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

  // Build per-letter Arabic stats from individual answer records
  for (const ans of arabicAnswers) {
    const letterId = ARABIC_NAME_TO_ID[ans.correct_answer.toLowerCase()];
    if (!letterId) continue;
    const stat = arabic[letterId] ?? emptyTopicStat();
    stat.attempts += 1;
    if (ans.is_correct) stat.correct += 1;
    stat.lastPracticed = ans.created_at;
    stat.mastered =
      stat.attempts >= 3 && stat.correct / stat.attempts >= MASTERY.accuracy;
    arabic[letterId] = stat;
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

    setLoading(true);
    setError(null);

    try {
      // Fetch sessions, Arabic answers, Sejarah, Peribahasa and BM results in parallel
      const [sessionsRes, arabicAnswersRes, sejarahRes, peribahasaRes, bmRes] = await Promise.all([
        supabase
          .from("quiz_sessions")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("quiz_answers")
          .select("child_id, correct_answer, is_correct, created_at")
          .eq("module", "arabic")
          .order("created_at", { ascending: true }),
        supabase
          .from("sejarah_quiz_results")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("peribahasa_quiz_results")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("bm_quiz_results")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (sejarahRes.error) throw sejarahRes.error;
      if (peribahasaRes.error) throw peribahasaRes.error;
      if (bmRes.error) throw bmRes.error;

      const rows = sessionsRes.data ?? [];
      const arabicAnswerRows = arabicAnswersRes.data ?? [];

      // Map Sejarah results to the generic quiz session shape
      const sejarahRows = (sejarahRes.data ?? []).map((r) => ({
        id: r.id,
        child_id: r.child_id,
        module: "sejarah",
        topic: `bab-${r.chapter}`,
        quiz_mode: null,
        total_questions: r.total_questions,
        correct_answers: r.correct_answers,
        duration_sec: r.duration_sec ?? 0,
        best_streak: 0, // not tracked in DB
        points_earned: r.points_earned ?? 0,
        created_at: r.created_at,
      }));

      // Map Peribahasa results to the generic quiz session shape
      const peribahasaRows = (peribahasaRes.data ?? []).map((r) => ({
        id: r.id,
        child_id: r.child_id,
        module: "peribahasa",
        topic: `tingkatan-${r.tingkatan}`,
        quiz_mode: null,
        total_questions: r.total_questions,
        correct_answers: r.correct_answers,
        duration_sec: r.duration_sec ?? 0,
        best_streak: 0, // not tracked in DB
        points_earned: r.points_earned ?? 0,
        created_at: r.created_at,
      }));

      // Map Bahasa Melayu results to the generic quiz session shape
      const bmRows = (bmRes.data ?? []).map((r) => ({
        id: r.id,
        child_id: r.child_id,
        module: "bahasa_melayu",
        topic: `topik-${r.topic}`,
        quiz_mode: null,
        total_questions: r.total_questions,
        correct_answers: r.correct_answers,
        duration_sec: r.duration_sec ?? 0,
        best_streak: 0, // not tracked in DB
        points_earned: r.points_earned ?? 0,
        created_at: r.created_at,
      }));

      // Combine all rows
      const combinedRows = [...rows, ...sejarahRows, ...peribahasaRows, ...bmRows];

      // Group sessions by child_id
      const grouped: Record<string, typeof combinedRows> = {};
      for (const row of combinedRows) {
        const cid = row.child_id;
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(row);
      }

      // Group Arabic answers by child_id
      const arabicGrouped: Record<string, typeof arabicAnswerRows> = {};
      for (const row of arabicAnswerRows) {
        const cid = row.child_id;
        if (!arabicGrouped[cid]) arabicGrouped[cid] = [];
        arabicGrouped[cid].push(row);
      }

      const result: Record<string, SupabaseChildData> = {};
      // Process all children that appear in either dataset
      const allChildIds = new Set([
        ...Object.keys(grouped),
        ...Object.keys(arabicGrouped),
      ]);
      for (const cid of allChildIds) {
        result[cid] = buildChildData(
          grouped[cid] ?? [],
          arabicGrouped[cid] ?? [],
        );
      }

      setData(result);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Auto-sync on focus/online event listeners
    const handleFocus = () => {
      refresh();
    };
    const handleOnline = () => {
      refresh();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}


