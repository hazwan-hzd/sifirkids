"use client";

/*
  SifirKids store. Single localStorage-backed AppState with a React context.
  Feature modules should NOT touch localStorage directly — they call the
  action helpers exposed by useApp() / useChild() so the points economy,
  mastery, streaks and metrics stay consistent.
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppState,
  ChildData,
  ChildId,
  ModuleId,
  Profile,
  QuizMode,
  QuizSession,
  TopicStat,
} from "./types";
import { emptyTopicStat } from "./types";
import {
  DEFAULT_DAILY_GOAL,
  MASTERY,
  POINTS,
  PROFILES,
  getReward,
} from "./data";
import { dayKey, daysBetween, uid } from "./utils";
import { logQuizToSupabase } from "./supabase";

const STORAGE_KEY = "sifirkids:v1";
const MAX_SESSIONS = 200; // cap per child to keep storage small

/* ----------------------------- defaults ----------------------------- */

function defaultChild(profile: Profile): ChildData {
  return {
    profile,
    multiplication: {},
    arabic: {},
    rewards: { points: 0, totalEarned: 0, claims: [] },
    daily: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      dailyGoal: DEFAULT_DAILY_GOAL,
      history: {},
    },
    metrics: { totalOpens: 0, lastOpen: null, totalTimeSec: 0 },
    sessions: [],
  };
}

function defaultState(): AppState {
  const children = {} as Record<ChildId, ChildData>;
  for (const p of PROFILES) children[p.id] = defaultChild(p);
  return { version: 1, children, parentPin: "1234", reminderTime: "18:00" };
}

/** Merge persisted state onto defaults so new fields never crash old saves. */
function reconcile(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<AppState>;
  const merged = { ...base, ...saved, children: { ...base.children } };
  if (saved.children) {
    for (const p of PROFILES) {
      const sc = saved.children[p.id];
      if (sc) {
        merged.children[p.id] = {
          ...defaultChild(p),
          ...sc,
          profile: p, // profile is source-of-truth from code
          rewards: { ...defaultChild(p).rewards, ...sc.rewards },
          daily: { ...defaultChild(p).daily, ...sc.daily },
          metrics: { ...defaultChild(p).metrics, ...sc.metrics },
          multiplication: { ...sc.multiplication },
          arabic: { ...sc.arabic },
          sessions: sc.sessions ?? [],
        };
      }
    }
  }
  return merged;
}

/* ------------------------------- points ------------------------------ */

export interface QuizResultInput {
  module: ModuleId;
  /** display topic: "7" for the 7x table, or "set-1" for an Arabic set */
  topic: string;
  /** quiz mode: random or standard */
  quizMode?: QuizMode;
  total: number;
  correct: number;
  durationSec: number;
  /** longest correct run in this quiz */
  bestStreak: number;
  /** individual answer records for Supabase logging */
  answers?: Array<{
    question: string;
    correctAnswer: string;
    givenAnswer: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }>;
  /**
   * granular per-item updates keyed by progress key
   * (table number string for multiplication, letter id for arabic).
   * If omitted, the whole quiz is recorded against `topic`.
   */
  perKey?: Record<string, { attempts: number; correct: number; bestStreak?: number }>;
}

export interface QuizOutcome {
  pointsEarned: number;
  perfect: boolean;
  masteredNow: string[];
}

export function computePoints(
  correct: number,
  total: number,
  bestStreak: number,
): number {
  const perfect = total > 0 && correct === total;
  let pts = correct * POINTS.perCorrect;
  if (perfect) pts += total * POINTS.perfectBonusPerQuestion;
  if (bestStreak >= POINTS.streakBonusAt) pts += POINTS.streakBonus;
  return pts;
}

function applyTopicResult(
  prev: TopicStat | undefined,
  add: { attempts: number; correct: number; bestStreak?: number },
  todayIso: string,
): { stat: TopicStat; masteredNow: boolean } {
  const s = prev ? { ...prev } : emptyTopicStat();
  const wasMastered = s.mastered;
  s.attempts += add.attempts;
  s.correct += add.correct;
  s.bestStreak = Math.max(s.bestStreak, add.bestStreak ?? 0);
  s.lastPracticed = todayIso;
  s.mastered =
    s.attempts >= MASTERY.minAttempts && s.correct / s.attempts >= MASTERY.accuracy;
  return { stat: s, masteredNow: !wasMastered && s.mastered };
}

/* ------------------------------ context ------------------------------ */

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  recordOpen: (childId: ChildId) => void;
  recordQuiz: (childId: ChildId, input: QuizResultInput) => QuizOutcome;
  addTime: (childId: ChildId, seconds: number) => void;
  claimReward: (childId: ChildId, rewardId: string) => boolean;
  resolveClaim: (childId: ChildId, claimId: string, approve: boolean) => void;
  setParentPin: (pin: string) => void;
  setReminderTime: (time: string) => void;
  setDailyGoal: (childId: ChildId, goal: number) => void;
  resetChild: (childId: ChildId) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(reconcile(JSON.parse(raw)));
    } catch {
      /* corrupt save — keep defaults */
    }
    setHydrated(true);
  }, []);

  // persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state, hydrated]);

  /** Immutably update one child. */
  const updateChild = useCallback(
    (childId: ChildId, fn: (c: ChildData) => ChildData) => {
      setState((s) => ({
        ...s,
        children: { ...s.children, [childId]: fn(s.children[childId]) },
      }));
    },
    [],
  );

  const touchDay = useCallback((c: ChildData, didSession: boolean): ChildData => {
    const today = dayKey();
    const daily = { ...c.daily, history: { ...c.daily.history } };
    const rec = daily.history[today] ?? {
      date: today,
      sessions: 0,
      pointsEarned: 0,
      questionsAnswered: 0,
      opens: 0,
    };
    daily.history[today] = { ...rec };

    // streak: only advances on a session, not a mere open
    if (didSession && daily.lastActiveDate !== today) {
      if (daily.lastActiveDate && daysBetween(daily.lastActiveDate, today) === 1) {
        daily.currentStreak += 1;
      } else {
        daily.currentStreak = 1;
      }
      daily.lastActiveDate = today;
      daily.longestStreak = Math.max(daily.longestStreak, daily.currentStreak);
    }
    return { ...c, daily };
  }, []);

  const recordOpen = useCallback(
    (childId: ChildId) => {
      updateChild(childId, (c) => {
        const today = dayKey();
        const next = touchDay(c, false);
        const rec = next.daily.history[today];
        next.daily.history[today] = { ...rec, opens: rec.opens + 1 };
        next.metrics = {
          ...c.metrics,
          totalOpens: c.metrics.totalOpens + 1,
          lastOpen: new Date().toISOString(),
        };
        return next;
      });
    },
    [updateChild, touchDay],
  );

  const recordQuizLocal = useCallback(
    (childId: ChildId, input: QuizResultInput): QuizOutcome => {
      const basePoints = computePoints(input.correct, input.total, input.bestStreak);
      const perfect = input.total > 0 && input.correct === input.total;
      const masteredNow: string[] = [];
      const today = dayKey();
      const nowIso = new Date().toISOString();
      // best-effort read for the returned value; the reducer recomputes authoritatively
      const firstSessionTodayHint =
        (state.children[childId].daily.history[today]?.sessions ?? 0) === 0;
      const returnedPoints = basePoints + (firstSessionTodayHint ? POINTS.dailyStreakBonus : 0);

      updateChild(childId, (c) => {
        let next = touchDay(c, true);

        // per-item progress
        const bucketKey = input.module === "multiplication" ? "multiplication" : "arabic";
        const bucket = { ...next[bucketKey] };
        const updates =
          input.perKey ??
          ({ [input.topic]: { attempts: input.total, correct: input.correct, bestStreak: input.bestStreak } } as NonNullable<
            QuizResultInput["perKey"]
          >);
        for (const [key, add] of Object.entries(updates)) {
          const { stat, masteredNow: m } = applyTopicResult(bucket[key], add, nowIso);
          bucket[key] = stat;
          if (m) masteredNow.push(key);
        }

        // daily streak bonus once per day
        const firstSessionToday = (next.daily.history[today]?.sessions ?? 0) === 0;
        const totalPts = basePoints + (firstSessionToday ? POINTS.dailyStreakBonus : 0);

        // day record
        const daily = { ...next.daily, history: { ...next.daily.history } };
        const rec = daily.history[today];
        daily.history[today] = {
          ...rec,
          sessions: rec.sessions + 1,
          pointsEarned: rec.pointsEarned + totalPts,
          questionsAnswered: rec.questionsAnswered + input.total,
        };

        // session log (capped)
        const session: QuizSession = {
          id: uid(),
          module: input.module,
          topic: input.topic,
          quizMode: input.quizMode,
          total: input.total,
          correct: input.correct,
          durationSec: input.durationSec,
          pointsEarned: totalPts,
          date: nowIso,
        };
        const sessions = [...next.sessions, session].slice(-MAX_SESSIONS);

        next = {
          ...next,
          [bucketKey]: bucket,
          daily,
          sessions,
          rewards: {
            ...next.rewards,
            points: next.rewards.points + totalPts,
            totalEarned: next.rewards.totalEarned + totalPts,
          },
          metrics: { ...next.metrics, totalTimeSec: next.metrics.totalTimeSec + input.durationSec },
        };
        return next;
      });

      return { pointsEarned: returnedPoints, perfect, masteredNow };
    },
    [updateChild, touchDay, state],
  );

  // Fire-and-forget Supabase logging after quiz recording
  const recordQuiz = useCallback(
    (childId: ChildId, input: QuizResultInput): QuizOutcome => {
      const outcome = recordQuizLocal(childId, input);

      // Async Supabase log (non-blocking)
      logQuizToSupabase(
        {
          child_id: childId,
          module: input.module,
          topic: input.topic,
          quiz_mode: input.quizMode ?? null,
          total_questions: input.total,
          correct_answers: input.correct,
          duration_sec: input.durationSec,
          best_streak: input.bestStreak,
          points_earned: outcome.pointsEarned,
        },
        input.answers ?? [],
      );

      return outcome;
    },
    [recordQuizLocal],
  );

  const addTime = useCallback(
    (childId: ChildId, seconds: number) => {
      if (seconds <= 0) return;
      updateChild(childId, (c) => ({
        ...c,
        metrics: { ...c.metrics, totalTimeSec: c.metrics.totalTimeSec + seconds },
      }));
    },
    [updateChild],
  );

  const claimReward = useCallback(
    (childId: ChildId, rewardId: string): boolean => {
      const reward = getReward(rewardId);
      if (!reward) return false;
      let ok = false;
      updateChild(childId, (c) => {
        if (c.rewards.points < reward.cost) return c;
        ok = true;
        return {
          ...c,
          rewards: {
            ...c.rewards,
            points: c.rewards.points - reward.cost,
            claims: [
              ...c.rewards.claims,
              {
                id: uid(),
                rewardId: reward.id,
                name: reward.name,
                icon: reward.icon,
                cost: reward.cost,
                date: new Date().toISOString(),
                status: "pending",
              },
            ],
          },
        };
      });
      return ok;
    },
    [updateChild],
  );

  const resolveClaim = useCallback(
    (childId: ChildId, claimId: string, approve: boolean) => {
      updateChild(childId, (c) => {
        const claim = c.rewards.claims.find((cl) => cl.id === claimId);
        if (!claim || claim.status !== "pending") return c;
        // denied claims refund the points
        const refund = approve ? 0 : claim.cost;
        return {
          ...c,
          rewards: {
            ...c.rewards,
            points: c.rewards.points + refund,
            claims: c.rewards.claims.map((cl) =>
              cl.id === claimId ? { ...cl, status: approve ? "approved" : "denied" } : cl,
            ),
          },
        };
      });
    },
    [updateChild],
  );

  const setParentPin = useCallback((pin: string) => {
    setState((s) => ({ ...s, parentPin: pin }));
  }, []);

  const setReminderTime = useCallback((time: string) => {
    setState((s) => ({ ...s, reminderTime: time }));
  }, []);

  const setDailyGoal = useCallback(
    (childId: ChildId, goal: number) => {
      updateChild(childId, (c) => ({ ...c, daily: { ...c.daily, dailyGoal: goal } }));
    },
    [updateChild],
  );

  const resetChild = useCallback(
    (childId: ChildId) => {
      updateChild(childId, (c) => defaultChild(c.profile));
    },
    [updateChild],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      recordOpen,
      recordQuiz,
      addTime,
      claimReward,
      resolveClaim,
      setParentPin,
      setReminderTime,
      setDailyGoal,
      resetChild,
    }),
    [
      state,
      hydrated,
      recordOpen,
      recordQuiz,
      addTime,
      claimReward,
      resolveClaim,
      setParentPin,
      setReminderTime,
      setDailyGoal,
      resetChild,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** Scoped helper for a single child. */
export function useChild(childId: ChildId) {
  const app = useApp();
  const child = app.state.children[childId];
  return {
    child,
    hydrated: app.hydrated,
    recordOpen: () => app.recordOpen(childId),
    recordQuiz: (input: QuizResultInput) => app.recordQuiz(childId, input),
    addTime: (s: number) => app.addTime(childId, s),
    claimReward: (rewardId: string) => app.claimReward(childId, rewardId),
    setDailyGoal: (g: number) => app.setDailyGoal(childId, g),
  };
}

/** Track elapsed seconds for the active child (call in a play screen). */
export function useSessionTimer() {
  const start = useRef<number>(Date.now());
  const reset = useCallback(() => {
    start.current = Date.now();
  }, []);
  const elapsed = useCallback(() => Math.round((Date.now() - start.current) / 1000), []);
  return { reset, elapsed };
}
