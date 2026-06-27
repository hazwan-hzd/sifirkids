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
  Card,
  ChildAvatar,
  ChildData,
  ChildId,
  ModuleId,
  Profile,
  QuizMode,
  QuizSession,
  TopicStat,
  TradeRequest,
} from "./types";
import { emptyTopicStat } from "./types";
import {
  DEFAULT_DAILY_GOAL,
  MASTERY,
  POINTS,
  TABLE_MULTIPLIERS,
  PROFILES,
  ALL_PROFILES,
  getReward,
  CARDS,
  PACKS,
} from "./data";
import { dayKey, daysBetween, uid } from "./utils";
import { supabase, logQuizToSupabase } from "./supabase";
import { useSupabaseData, type SupabaseChildData } from "./supabase-read";

const STORAGE_KEY = "sifirkids:v1";
const MAX_SESSIONS = 200; // cap per child to keep storage small
const ALT_ART_PULL_WEIGHT = 0.2;

// ---------------------------------------------------------------------------
// Points Ledger (Supabase single source of truth)
// ---------------------------------------------------------------------------
export type LedgerType = "quiz_earn" | "pack_spend" | "claim_spend" | "claim_refund" | "manual_credit";

/** Write a ledger row directly. Throws errors. */
export async function writeLedgerDirect(
  childId: string,
  type: LedgerType,
  amount: number,
  referenceId?: string,
  note?: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase
    .from("points_ledger")
    .insert({ child_id: childId, type, amount, reference_id: referenceId, note });
  if (error) throw error;
}

/** Write a ledger row. Positive amount = credit, negative = debit. If offline, queue it. */
export async function writeLedger(
  childId: string,
  type: LedgerType,
  amount: number,
  referenceId?: string,
  note?: string,
): Promise<void> {
  try {
    await writeLedgerDirect(childId, type, amount, referenceId, note);
  } catch (err) {
    console.error("Ledger write failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "ledger",
        payload: {
          child_id: childId,
          type,
          amount,
          reference_id: referenceId,
          note,
        },
      });
    } catch (queueErr) {
      console.error("Failed to queue ledger item offline:", queueErr);
    }
  }
}

/** Fetch current balance from the ledger. Returns 0 if offline/error. */
async function fetchLedgerBalance(childId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("points_ledger")
    .select("amount")
    .eq("child_id", childId);
  if (error || !data) return 0;
  return Math.max(0, data.reduce((sum, r) => sum + r.amount, 0));
}

/** Fetch balances for all kids in one call. */
async function fetchAllLedgerBalances(): Promise<Record<string, number>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("points_ledger")
    .select("child_id, amount");
  if (error || !data) return {};
  const balances: Record<string, number> = {};
  for (const r of data) {
    balances[r.child_id] = (balances[r.child_id] ?? 0) + r.amount;
  }
  // Clamp all to 0
  for (const k of Object.keys(balances)) {
    balances[k] = Math.max(0, balances[k]);
  }
  return balances;
}

function isAltArtCard(card: Card): boolean {
  return /\balt\b/i.test(card.id.replace(/[-_]+/g, " "));
}

function drawWeightedCard(pool: Card[]): Card {
  const totalWeight = pool.reduce((sum, card) => sum + (isAltArtCard(card) ? ALT_ART_PULL_WEIGHT : 1), 0);
  let roll = Math.random() * totalWeight;

  for (const card of pool) {
    roll -= isAltArtCard(card) ? ALT_ART_PULL_WEIGHT : 1;
    if (roll <= 0) return card;
  }

  return pool[pool.length - 1];
}

/* ----------------------------- defaults ----------------------------- */

export function defaultAvatar(): ChildAvatar {
  return {
    skin: "peach",
    hairStyle: "spiky",
    hairColor: "#ffba00", // sunny
    eyes: "happy",
    top: "tshirt",
    topColor: "#ff5a47", // coral
    dress: "none",
    dressColor: "#ff5a47",
    bottom: "pants",
    bottomColor: "#1f9bff", // sky
    accessory: "none",
    accessoryColor: "#ffba00",
    background: "gradient",
    unlockedItems: ["skin-peach", "hair-spiky", "eyes-happy", "top-tshirt", "bottom-pants", "bg-gradient"],
  };
}

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
    avatar: defaultAvatar(),
    tcg: {
      collection: {},
      activeBuddyId: null,
      activeDeck: [],
      openedPacksCount: 0,
      spentPoints: 0,
    },
  };
}

function defaultState(): AppState {
  const children = {} as Record<ChildId, ChildData>;
  for (const p of ALL_PROFILES) children[p.id] = defaultChild(p);
  return { version: 2, children, parentPin: "3675", reminderTime: "18:00", pendingTrades: [] };
}

function reconcileChildPoints(c: ChildData): ChildData {
  // Fix known bad session values from legacy bugs
  const sessions = c.sessions.map((s) => {
    if (s.id === "66f23b02-bbf1-43d1-ad9a-50e84c8692a8" && s.pointsEarned === 18500) {
      return { ...s, pointsEarned: 185 };
    }
    if (s.id === "f8cb8254-63a5-4728-a209-e497a4099943" && s.pointsEarned === 10000) {
      return { ...s, pointsEarned: 100 };
    }
    if (s.id === "feeb5e29-1394-4715-9337-b5698ab6e538" && s.pointsEarned === 11000) {
      return { ...s, pointsEarned: 110 };
    }
    return s;
  });

  // Local fallback: compute points from sessions (overwritten by ledger on sync)
  const totalEarned = sessions.reduce((sum, s) => sum + s.pointsEarned, 0);
  const claimsCost = c.rewards.claims
    .filter((cl) => cl.status === "approved" || cl.status === "pending")
    .reduce((sum, cl) => sum + cl.cost, 0);
  const spentPoints = c.tcg?.spentPoints ?? 0;
  const points = Math.max(0, totalEarned - claimsCost - spentPoints);

  // Remove cards with no artwork from collection
  let tcg = c.tcg
    ? { ...c.tcg, spentPoints: c.tcg.spentPoints ?? 0 }
    : { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0, spentPoints: 0 };

  if (tcg.collection?.["promo-gojo-03"]) {
    const col = { ...tcg.collection };
    delete col["promo-gojo-03"];
    tcg = { ...tcg, collection: col };
  }

  return {
    ...c,
    sessions,
    rewards: {
      ...c.rewards,
      points,
      totalEarned,
    },
    tcg,
  };
}

/** Merge persisted state onto defaults so new fields never crash old saves. */
function reconcile(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<AppState>;
  const merged = { ...base, ...saved, children: { ...base.children }, pendingTrades: saved.pendingTrades ?? [] };
  const rawVersion = saved.version ?? 1;

  if (saved.children) {
    for (const p of ALL_PROFILES) {
      const sc = saved.children[p.id];
      if (sc) {
        merged.children[p.id] = reconcileChildPoints({
          ...defaultChild(p),
          ...sc,
          profile: p, // profile is source-of-truth from code
          rewards: { ...defaultChild(p).rewards, ...sc.rewards },
          daily: { ...defaultChild(p).daily, ...sc.daily },
          metrics: { ...defaultChild(p).metrics, ...sc.metrics },
          multiplication: { ...sc.multiplication },
          arabic: { ...sc.arabic },
          sessions: sc.sessions ?? [],
          avatar: sc.avatar ?? defaultAvatar(),
          tcg: rawVersion < 2 ? defaultChild(p).tcg : (sc.tcg ?? defaultChild(p).tcg),
        });
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
  /** Override computed points with a fixed value (used for battle rewards) */
  bonusPoints?: number;
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
  /** Table difficulty multiplier applied (1 = base, 2 = double, 3 = triple) */
  multiplier: number;
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
  minAttempts: number = MASTERY.minAttempts,
): { stat: TopicStat; masteredNow: boolean } {
  const s = prev ? { ...prev } : emptyTopicStat();
  const wasMastered = s.mastered;
  s.attempts += add.attempts;
  s.correct += add.correct;
  s.bestStreak = Math.max(s.bestStreak, add.bestStreak ?? 0);
  s.lastPracticed = todayIso;
  s.mastered =
    s.attempts >= minAttempts && s.correct / s.attempts >= MASTERY.accuracy;
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
  deductPoints: (childId: ChildId, amount: number) => void;
  resolveClaim: (childId: ChildId, claimId: string, approve: boolean) => void;
  setParentPin: (pin: string) => void;
  setReminderTime: (time: string) => void;
  setDailyGoal: (childId: ChildId, goal: number) => void;
  resetChild: (childId: ChildId) => void;
  saveAvatar: (childId: ChildId, look: ChildAvatar) => void;
  unlockAvatarItem: (childId: ChildId, itemId: string, cost: number) => boolean;
  buyBoosterPack: (childId: ChildId, packId: string, runId?: string) => Card[] | null;
  setTcgBuddy: (childId: ChildId, cardId: string | null) => void;
  setTcgDeck: (childId: ChildId, cardIds: string[]) => void;
  createTradeRequest: (fromChildId: ChildId, toChildId: ChildId, offeredCardId: string, requestedCardId: string) => void;
  resolveTradeRequest: (tradeId: string, approve: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // load once on mount & set up synchronization listeners
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(reconcile(JSON.parse(raw)));
    } catch {
      /* corrupt save — keep defaults */
    }
    setHydrated(true);

    // Initial queue flush
    import("./sync-queue").then(({ flushSyncQueue }) => {
      flushSyncQueue();
    }).catch(err => console.error("Failed to load sync queue:", err));

    // Listeners for network online and storage changes
    const handleOnline = () => {
      import("./sync-queue").then(({ flushSyncQueue }) => {
        flushSyncQueue();
      });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(reconcile(JSON.parse(e.newValue)));
        } catch {
          // ignore corrupt changes
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);


  // Supabase cloud sync: merge remote data into state after hydration
  // Re-runs whenever sbData reference changes (on focus/online refetch)
  const lastSbData = useRef<Record<string, SupabaseChildData> | null>(null);
  const { data: sbData } = useSupabaseData();

  useEffect(() => {
    if (!hydrated || !sbData || sbData === lastSbData.current) return;
    lastSbData.current = sbData;

    setState((prev) => {
      const next = { ...prev, children: { ...prev.children } };
      for (const p of ALL_PROFILES) {
        const remote = sbData[p.id];
        if (!remote || remote.sessions.length === 0) continue;
        const local = next.children[p.id];

        // Merge sessions by UUID deduplication (not winner-takes-all)
        const sessionMap = new Map<string, (typeof local.sessions)[0]>();
        for (const s of local.sessions) sessionMap.set(s.id, s);
        for (const s of remote.sessions) sessionMap.set(s.id, s);
        const sessions = Array.from(sessionMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        // Merge topic stats (take higher attempts)
        // For Arabic: remote keys are aggregate topics ("set-1", "all") but local keys
        // are per-letter IDs ("alif", "ba", etc.). We must not let remote aggregate keys
        // overwrite local per-letter keys, so skip remote Arabic aggregate keys.
        const isArabicAggregateKey = (k: string) =>
          k === "all" || k.startsWith("set-");

        const mergeBucket = (
          lb: Record<string, TopicStat>,
          rb: Record<string, TopicStat>,
          isArabic: boolean,
        ) => {
          const m = { ...lb };
          for (const [k, rs] of Object.entries(rb)) {
            // Skip aggregate keys for Arabic — they'd clobber per-letter progress
            if (isArabic && isArabicAggregateKey(k)) continue;
            if (!m[k] || rs.attempts > m[k].attempts) m[k] = rs;
          }
          return m;
        };

        // Merge daily history
        const mergedHistory = { ...local.daily.history };
        for (const [day, rec] of Object.entries(remote.daily.history)) {
          if (!mergedHistory[day] || rec.sessions > mergedHistory[day].sessions) {
            mergedHistory[day] = rec;
          }
        }

        next.children[p.id] = reconcileChildPoints({
          ...local,
          sessions,
          multiplication: mergeBucket(local.multiplication, remote.multiplication, false),
          arabic: mergeBucket(local.arabic, remote.arabic, true),
          daily: {
            ...local.daily,
            history: mergedHistory,
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
        });
      }
      return next;
    });
  }, [hydrated, sbData]);

  // Supabase settings sync: fetch PIN + reminder time + child profiles from cloud
  const settingsSyncDone = useRef(false);
  useEffect(() => {
    if (!hydrated || settingsSyncDone.current) return;
    settingsSyncDone.current = true;
    if (!supabase) return;
    
    // Fetch Settings
    supabase
      .from("app_settings")
      .select("parent_pin, reminder_time")
      .eq("id", "default")
      .single()
      .then(({ data: row }) => {
        if (row) {
          setState((s) => ({
            ...s,
            parentPin: row.parent_pin ?? s.parentPin,
            reminderTime: row.reminder_time ?? s.reminderTime,
          }));
        }
      });

    // Fetch Child Profiles (Avatar + TCG collection + Claims)
    supabase
      .from("child_profiles")
      .select("id, avatar, tcg, claims")
      .then(({ data }) => {
        if (data) {
          setState((prev) => {
            const next = { ...prev, children: { ...prev.children } };
            for (const row of data) {
              const cid = row.id as ChildId;
              if (next.children[cid]) {
                const localTcg = next.children[cid].tcg;
                const cloudTcg = row.tcg as typeof localTcg | null;

                // Merge TCG: take MAX spentPoints, union collections
                const mergedTcg = {
                  ...(localTcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0, spentPoints: 0 }),
                  spentPoints: Math.max(cloudTcg?.spentPoints ?? 0, localTcg?.spentPoints ?? 0),
                  openedPacksCount: Math.max(cloudTcg?.openedPacksCount ?? 0, localTcg?.openedPacksCount ?? 0),
                  collection: { ...(localTcg?.collection ?? {}), ...(cloudTcg?.collection ?? {}) },
                };

                // Merge claims by ID (union of local + cloud)
                const localClaims = next.children[cid].rewards.claims ?? [];
                const cloudClaims = (row.claims as typeof localClaims) ?? [];
                const claimMap = new Map<string, (typeof localClaims)[0]>();
                for (const cl of localClaims) claimMap.set(cl.id, cl);
                for (const cl of cloudClaims) claimMap.set(cl.id, cl); // cloud wins on conflict
                const mergedClaims = Array.from(claimMap.values());

                next.children[cid] = reconcileChildPoints({
                  ...next.children[cid],
                  avatar: row.avatar ?? next.children[cid].avatar,
                  tcg: mergedTcg,
                  rewards: {
                    ...next.children[cid].rewards,
                    claims: mergedClaims,
                  },
                });
              }
            }
            return next;
          });
        }
      });
  }, [hydrated]);

  // Points Ledger sync: fetch authoritative balances from Supabase
  const ledgerSyncDone = useRef(false);
  useEffect(() => {
    if (!hydrated || ledgerSyncDone.current) return;
    ledgerSyncDone.current = true;

    fetchAllLedgerBalances().then((balances) => {
      if (Object.keys(balances).length === 0) return; // offline or error
      setState((prev) => {
        const next = { ...prev, children: { ...prev.children } };
        for (const [childId, balance] of Object.entries(balances)) {
          if (next.children[childId as ChildId]) {
            next.children[childId as ChildId] = {
              ...next.children[childId as ChildId],
              rewards: {
                ...next.children[childId as ChildId].rewards,
                points: balance,
              },
            };
          }
        }
        return next;
      });
    });
  }, [hydrated]);

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
      let basePoints: number;
      let tableMultiplier = 1;
      if (input.bonusPoints != null) {
        // Fixed reward override (used for battle wins, etc.)
        basePoints = input.bonusPoints;
      } else {
        basePoints = computePoints(input.correct, input.total, input.bestStreak);
        if (input.module === "bahasa_melayu" || input.module === "pafa_kafa") {
          tableMultiplier = 2;
          basePoints *= 2;
        }
        // Harder multiplication tables earn multiplied points
        if (input.module === "multiplication" && input.topic !== "mixed") {
          const tableNum = parseInt(input.topic, 10);
          tableMultiplier = TABLE_MULTIPLIERS[tableNum] ?? 1;
          basePoints *= tableMultiplier;
        }
      }
      const perfect = input.total > 0 && input.correct === input.total;
      const masteredNow: string[] = [];
      const today = dayKey();
      const nowIso = new Date().toISOString();
      // best-effort read for the returned value; the reducer recomputes authoritatively
      const firstSessionTodayHint =
        (state.children[childId].daily.history[today]?.sessions ?? 0) === 0;
      const returnedPoints = basePoints + (firstSessionTodayHint ? POINTS.dailyStreakBonus : 0);
      const sessionId = uid();

      updateChild(childId, (c) => {
        let next = touchDay(c, true);

        // per-item progress (only for multiplication and arabic - sejarah has its own tables)
        if (input.module === "multiplication" || input.module === "arabic") {
          const bucketKey = input.module;
          const bucket = { ...next[bucketKey] };
          const updates =
            input.perKey ??
            ({ [input.topic]: { attempts: input.total, correct: input.correct, bestStreak: input.bestStreak } } as NonNullable<
              QuizResultInput["perKey"]
            >);
          const isArabic = input.module === "arabic";
          const minAttempts = isArabic ? 3 : MASTERY.minAttempts;
          for (const [key, add] of Object.entries(updates)) {
            const { stat, masteredNow: m } = applyTopicResult(bucket[key], add, nowIso, minAttempts);
            bucket[key] = stat;
            if (m) masteredNow.push(key);
          }
          next = { ...next, [bucketKey]: bucket };
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
          id: sessionId,
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

        const tcg = next.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
        const newCollection = { ...tcg.collection };
        if (masteredNow.length > 0) {
          const promoPool = CARDS.filter((card) => card.set === "promo");
          if (promoPool.length > 0) {
            for (let i = 0; i < masteredNow.length; i++) {
              const randomPromo = promoPool[Math.floor(Math.random() * promoPool.length)];
              newCollection[randomPromo.id] = (newCollection[randomPromo.id] ?? 0) + 1;
            }
          }
        }

        next = {
          ...next,
          daily,
          sessions,
          rewards: {
            ...next.rewards,
            points: next.rewards.points + totalPts,
            totalEarned: next.rewards.totalEarned + totalPts,
          },
          metrics: { ...next.metrics, totalTimeSec: next.metrics.totalTimeSec + input.durationSec },
          tcg: {
            ...tcg,
            collection: newCollection,
          },
        };
        return next;
      });

      return { pointsEarned: returnedPoints, perfect, masteredNow, multiplier: tableMultiplier };
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

      // Points ledger: record earnings
      if (outcome.pointsEarned > 0) {
        writeLedger(childId, "quiz_earn", outcome.pointsEarned, uid(), input.module + ":" + input.topic);
      }

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

  // Helper: persist claims to Supabase (fire-and-forget)
  const persistClaims = useCallback((childId: ChildId, claims: ChildData["rewards"]["claims"]) => {
    if (supabase) {
      supabase
        .from("child_profiles")
        .upsert({ id: childId, claims, updated_at: new Date().toISOString() })
        .then();
    }
  }, []);

  const claimReward = useCallback(
    (childId: ChildId, rewardId: string): boolean => {
      const reward = getReward(rewardId);
      if (!reward) return false;
      let ok = false;
      const claimId = uid();
      updateChild(childId, (c) => {
        if (c.rewards.points < reward.cost) return c;
        ok = true;
        const newClaims = [
          ...c.rewards.claims,
          {
            id: claimId,
            rewardId: reward.id,
            name: reward.name,
            icon: reward.icon,
            cost: reward.cost,
            date: new Date().toISOString(),
            status: "pending" as const,
          },
        ];
        // Persist claims to Supabase
        persistClaims(childId, newClaims);
        return {
          ...c,
          rewards: {
            ...c.rewards,
            points: c.rewards.points - reward.cost,
            claims: newClaims,
          },
        };
      });
      // Points ledger: record claim spend
      if (ok) {
        writeLedger(childId, "claim_spend", -reward.cost, claimId, reward.name);
      }
      return ok;
    },
    [updateChild, persistClaims],
  );

  const deductPoints = useCallback(
    (childId: ChildId, amount: number) => {
      updateChild(childId, (c) => ({
        ...c,
        rewards: {
          ...c.rewards,
          points: Math.max(0, c.rewards.points - amount),
        },
      }));
    },
    [updateChild],
  );

  const saveAvatar = useCallback(
    (childId: ChildId, look: ChildAvatar) => {
      updateChild(childId, (c) => ({
        ...c,
        avatar: look,
      }));
      // Sync to Supabase
      if (supabase) {
        supabase
          .from("child_profiles")
          .upsert({ id: childId, avatar: look, updated_at: new Date().toISOString() })
          .then();
      }
    },
    [updateChild],
  );

  const unlockAvatarItem = useCallback(
    (childId: ChildId, itemId: string, cost: number): boolean => {
      let ok = false;
      updateChild(childId, (c) => {
        const points = c.rewards.points;
        const currentAvatar = c.avatar ?? defaultAvatar();
        if (points < cost || currentAvatar.unlockedItems.includes(itemId)) {
          return c;
        }
        ok = true;
        const updatedAvatar = {
          ...currentAvatar,
          unlockedItems: [...currentAvatar.unlockedItems, itemId],
        };
        // Sync to Supabase
        if (supabase) {
          supabase
            .from("child_profiles")
            .upsert({ id: childId, avatar: updatedAvatar, updated_at: new Date().toISOString() })
            .then();
        }
        return {
          ...c,
          rewards: {
            ...c.rewards,
            points: points - cost,
          },
          avatar: updatedAvatar,
        };
      });
      // Points ledger: record avatar unlock spend
      if (ok) {
        writeLedger(childId, "claim_spend", -cost, itemId, "Avatar: " + itemId);
      }
      return ok;
    },
    [updateChild],
  );

  const resolveClaim = useCallback(
    (childId: ChildId, claimId: string, approve: boolean) => {
      let claimCost = 0;
      let claimName = "";
      updateChild(childId, (c) => {
        const claim = c.rewards.claims.find((cl) => cl.id === claimId);
        if (!claim || claim.status !== "pending") return c;
        claimCost = claim.cost;
        claimName = claim.name;
        // denied claims refund the points
        const refund = approve ? 0 : claim.cost;
        const updatedClaims = c.rewards.claims.map((cl) =>
          cl.id === claimId ? { ...cl, status: (approve ? "approved" : "denied") as "approved" | "denied" } : cl,
        );
        // Persist claims to Supabase
        persistClaims(childId, updatedClaims);
        return {
          ...c,
          rewards: {
            ...c.rewards,
            points: c.rewards.points + refund,
            claims: updatedClaims,
          },
        };
      });
      // Points ledger: refund if denied
      if (!approve && claimCost > 0) {
        writeLedger(childId, "claim_refund", claimCost, claimId, "Denied: " + claimName);
      }
    },
    [updateChild, persistClaims],
  );

  const setParentPin = useCallback((pin: string) => {
    setState((s) => ({ ...s, parentPin: pin }));
    // Sync to Supabase
    if (supabase) {
      supabase
        .from("app_settings")
        .update({ parent_pin: pin, updated_at: new Date().toISOString() })
        .eq("id", "default")
        .then();
    }
  }, []);

  const setReminderTime = useCallback((time: string) => {
    setState((s) => ({ ...s, reminderTime: time }));
    // Sync to Supabase
    if (supabase) {
      supabase
        .from("app_settings")
        .update({ reminder_time: time, updated_at: new Date().toISOString() })
        .eq("id", "default")
        .then();
    }
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

  /** Run release order - cumulative pool: each run includes all cards from this run and earlier. */
  const RUN_RELEASE_ORDER: string[] = ["SK-01", "SK-02", "SK-03"];

  const buyBoosterPack = useCallback(
    (childId: ChildId, packId: string, runId?: string): Card[] | null => {
      const pack = PACKS.find((p) => p.id === packId);
      if (!pack) return null;

      let pulledCards: Card[] = [];

      updateChild(childId, (c) => {
        if (c.rewards.points < pack.cost) return c;

        // Only pull from cards that have artwork (imageUrl set) and match run release rules
        const candidates = CARDS.filter((card) => {
          const hasImage = !!card.imageUrl;
          if (!hasImage) return false;

          const cardRelease = card.releasedIn ?? "SK-01";

          // When buying from a run: pull from the FULL cumulative card pool
          // Pack type only controls rarity weights, not which sets can appear
          if (runId) {
            const skMatch = runId.match(/SK(\d+)/);
            const runSk = skMatch ? `SK-${skMatch[1]}` : "";
            const runIndex = RUN_RELEASE_ORDER.indexOf(runSk);
            const cardIndex = RUN_RELEASE_ORDER.indexOf(cardRelease);
            // Exclude cards from newer runs
            if (runIndex >= 0 && cardIndex > runIndex) {
              return false;
            }
            return true; // all sets allowed within the run's pool
          }

          // Legacy fallback (no run): use pack's allowedSets filter
          return pack.allowedSets.includes(card.set);
        });
        if (candidates.length === 0) return c;

        // Pull random cards based on weights
        // Each pack's allowedSets acts as a set affinity boost:
        // 70% chance to pull from the pack's themed sets, 30% from the rest of the pool
        const SET_AFFINITY = 0.7;

        const themedCards = candidates.filter((card) => pack.allowedSets.includes(card.set));
        const otherCards = candidates.filter((card) => !pack.allowedSets.includes(card.set));

        const drawCard = (): Card => {
          const rand = Math.random() * 100;
          const w = pack.rarityWeights;

          let targetRarity: Card["rarity"] = "common";
          if (rand < w.secret_gold) {
            targetRarity = "secret_gold";
          } else if (rand < w.secret_gold + w.ultra_rare) {
            targetRarity = "ultra_rare";
          } else if (rand < w.secret_gold + w.ultra_rare + w.rare) {
            targetRarity = "rare";
          } else if (rand < w.secret_gold + w.ultra_rare + w.rare + w.uncommon) {
            targetRarity = "uncommon";
          } else {
            targetRarity = "common";
          }

          // Set affinity: prefer the pack's themed cards
          const useThemed = themedCards.length > 0 && Math.random() < SET_AFFINITY;
          const affinityPool = useThemed ? themedCards : (otherCards.length > 0 ? otherCards : candidates);

          let pool = affinityPool.filter((card) => card.rarity === targetRarity);
          // If themed pool has no cards of this rarity, fall back to full candidates
          if (pool.length === 0) {
            pool = candidates.filter((card) => card.rarity === targetRarity);
          }
          // If still nothing, fall back to common
          if (pool.length === 0) {
            pool = candidates.filter((card) => card.rarity === "common");
          }
          if (pool.length === 0) {
            pool = candidates; // absolute fallback
          }
          return drawWeightedCard(pool);
        };

        pulledCards = Array.from({ length: pack.cardCount }, () => drawCard());

        const tcg = c.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0, spentPoints: 0 };
        const newCollection = { ...tcg.collection };
        for (const card of pulledCards) {
          newCollection[card.id] = (newCollection[card.id] ?? 0) + 1;
        }

        const nextTcg = {
          ...tcg,
          collection: newCollection,
          openedPacksCount: tcg.openedPacksCount + 1,
          spentPoints: (tcg.spentPoints ?? 0) + pack.cost,
        };

        // Sync to Supabase
        if (supabase) {
          supabase
            .from("child_profiles")
            .upsert({ id: childId, tcg: nextTcg, updated_at: new Date().toISOString() })
            .then();
        }

        // Log pull to run tracking (fire-and-forget)
        if (runId && pulledCards.length > 0) {
          import("./tcg-runs").then(({ logPullAndDecrement }) => {
            logPullAndDecrement(runId, packId, childId, pulledCards).catch(
              (err) => console.error("Failed to log pull:", err)
            );
          });
        }

        return reconcileChildPoints({
          ...c,
          tcg: nextTcg,
        });
      });

      // Points ledger: record pack purchase
      if (pulledCards.length > 0) {
        writeLedger(childId, "pack_spend", -pack.cost, packId + ":" + (runId ?? "legacy"), pack.name);
      }

      return pulledCards.length > 0 ? pulledCards : null;
    },
    [updateChild],
  );

  const setTcgBuddy = useCallback(
    (childId: ChildId, cardId: string | null) => {
      updateChild(childId, (c) => {
        const tcg = c.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
        const nextTcg = {
          ...tcg,
          activeBuddyId: cardId,
        };
        // Sync to Supabase
        if (supabase) {
          supabase
            .from("child_profiles")
            .upsert({ id: childId, tcg: nextTcg, updated_at: new Date().toISOString() })
            .then();
        }
        return {
          ...c,
          tcg: nextTcg,
        };
      });
    },
    [updateChild],
  );

  const setTcgDeck = useCallback(
    (childId: ChildId, cardIds: string[]) => {
      updateChild(childId, (c) => {
        const tcg = c.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
        const nextTcg = {
          ...tcg,
          activeDeck: cardIds.slice(0, 5), // limit to max 5 cards
        };
        // Sync to Supabase
        if (supabase) {
          supabase
            .from("child_profiles")
            .upsert({ id: childId, tcg: nextTcg, updated_at: new Date().toISOString() })
            .then();
        }
        return {
          ...c,
          tcg: nextTcg,
        };
      });
    },
    [updateChild],
  );

  const createTradeRequest = useCallback(
    (fromChildId: ChildId, toChildId: ChildId, offeredCardId: string, requestedCardId: string) => {
      const trade: TradeRequest = {
        id: uid(),
        fromChildId,
        toChildId,
        offeredCardId,
        requestedCardId,
        status: "pending",
        date: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        pendingTrades: [...(prev.pendingTrades ?? []), trade],
      }));
    },
    [],
  );

  const resolveTradeRequest = useCallback(
    (tradeId: string, approve: boolean) => {
      setState((prev) => {
        const trades = prev.pendingTrades ?? [];
        const trade = trades.find((t) => t.id === tradeId);
        if (!trade || trade.status !== "pending") return prev;

        const nextTrades = trades.map((t) =>
          t.id === tradeId ? { ...t, status: (approve ? "approved" : "denied") as "approved" | "denied" } : t
        );

        if (!approve) {
          return { ...prev, pendingTrades: nextTrades };
        }

        // Apply card exchange if approved
        const nextChildren = { ...prev.children };
        const sender = nextChildren[trade.fromChildId as ChildId];
        const receiver = nextChildren[trade.toChildId as ChildId];

        if (sender && receiver) {
          const senderTcg = sender.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
          const receiverTcg = receiver.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };

          // check if sender has offered card and receiver has requested card
          const senderHasOffer = (senderTcg.collection[trade.offeredCardId] ?? 0) > 0;
          const receiverHasReq = (receiverTcg.collection[trade.requestedCardId] ?? 0) > 0;

          if (senderHasOffer && receiverHasReq) {
            const nextSenderColl = { ...senderTcg.collection };
            const nextReceiverColl = { ...receiverTcg.collection };

            // deduct cards
            nextSenderColl[trade.offeredCardId] = Math.max(0, (nextSenderColl[trade.offeredCardId] ?? 1) - 1);
            nextReceiverColl[trade.requestedCardId] = Math.max(0, (nextReceiverColl[trade.requestedCardId] ?? 1) - 1);

            // add cards
            nextSenderColl[trade.requestedCardId] = (nextSenderColl[trade.requestedCardId] ?? 0) + 1;
            nextReceiverColl[trade.offeredCardId] = (nextReceiverColl[trade.offeredCardId] ?? 0) + 1;

            const nextSenderTcg = { ...senderTcg, collection: nextSenderColl };
            const nextReceiverTcg = { ...receiverTcg, collection: nextReceiverColl };

            // Sync to Supabase
            if (supabase) {
              supabase
                .from("child_profiles")
                .upsert({ id: trade.fromChildId, tcg: nextSenderTcg, updated_at: new Date().toISOString() })
                .then();
              supabase
                .from("child_profiles")
                .upsert({ id: trade.toChildId, tcg: nextReceiverTcg, updated_at: new Date().toISOString() })
                .then();
            }

            nextChildren[trade.fromChildId as ChildId] = {
              ...sender,
              tcg: nextSenderTcg,
            };
            nextChildren[trade.toChildId as ChildId] = {
              ...receiver,
              tcg: nextReceiverTcg,
            };
          }
        }

        return {
          ...prev,
          children: nextChildren,
          pendingTrades: nextTrades,
        };
      });
    },
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      recordOpen,
      recordQuiz,
      addTime,
      claimReward,
      deductPoints,
      resolveClaim,
      setParentPin,
      setReminderTime,
      setDailyGoal,
      resetChild,
      saveAvatar,
      unlockAvatarItem,
      buyBoosterPack,
      setTcgBuddy,
      setTcgDeck,
      createTradeRequest,
      resolveTradeRequest,
    }),
    [
      state,
      hydrated,
      recordOpen,
      recordQuiz,
      addTime,
      claimReward,
      deductPoints,
      resolveClaim,
      setParentPin,
      setReminderTime,
      setDailyGoal,
      resetChild,
      saveAvatar,
      unlockAvatarItem,
      buyBoosterPack,
      setTcgBuddy,
      setTcgDeck,
      createTradeRequest,
      resolveTradeRequest,
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
    deductPoints: (amount: number) => app.deductPoints(childId, amount),
    setDailyGoal: (g: number) => app.setDailyGoal(childId, g),
    saveAvatar: (look: ChildAvatar) => app.saveAvatar(childId, look),
    unlockAvatarItem: (itemId: string, cost: number) => app.unlockAvatarItem(childId, itemId, cost),
    buyBoosterPack: (packId: string, runId?: string) => app.buyBoosterPack(childId, packId, runId),
    setTcgBuddy: (cardId: string | null) => app.setTcgBuddy(childId, cardId),
    setTcgDeck: (cardIds: string[]) => app.setTcgDeck(childId, cardIds),
    createTradeRequest: (toChildId: ChildId, offeredCardId: string, requestedCardId: string) =>
      app.createTradeRequest(childId, toChildId, offeredCardId, requestedCardId),
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
