// SifirKids data model. This is the shared contract for every feature module.
// All persisted state lives under one AppState root in localStorage.

export type ChildId = "hafeeza" | "dhiya" | "ilyas";

export type ModuleId = "multiplication" | "arabic" | "sejarah" | "peribahasa" | "science";

export type QuizMode = "random" | "standard";

/** A child profile. Colors map to the design-system palette names. */
export interface Profile {
  id: ChildId;
  name: string;
  /** emoji used as the avatar */
  avatar: string;
  /** palette family: "coral" | "teal" | "sky" | "grape" | "sunny" */
  color: ColorKey;
}

export type ColorKey = "coral" | "teal" | "sky" | "grape" | "sunny";

/** Stats for a single multiplication table (2..12) or a single Arabic letter. */
export interface TopicStat {
  attempts: number;
  correct: number;
  /** best run of consecutive correct answers */
  bestStreak: number;
  /** mastered once accuracy is high over enough attempts */
  mastered: boolean;
  /** ISO date string of last practice, or null */
  lastPracticed: string | null;
}

export function emptyTopicStat(): TopicStat {
  return { attempts: 0, correct: 0, bestStreak: 0, mastered: false, lastPracticed: null };
}

/** One completed quiz, used for history + analytics. */
export interface QuizSession {
  id: string;
  module: ModuleId;
  /** "7" for the 7x table, or a letter-set id like "set-1" */
  topic: string;
  /** quiz mode: random or standard (sequential) */
  quizMode?: QuizMode;
  total: number;
  correct: number;
  durationSec: number;
  pointsEarned: number;
  /** ISO datetime */
  date: string;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  name: string;
  icon: string;
  cost: number;
  /** ISO datetime */
  date: string;
  /** parent approval state */
  status: "pending" | "approved" | "denied";
}

export interface RewardsState {
  /** spendable balance */
  points: number;
  /** lifetime points earned */
  totalEarned: number;
  claims: RewardClaim[];
}

export interface DayRecord {
  /** YYYY-MM-DD */
  date: string;
  sessions: number;
  pointsEarned: number;
  questionsAnswered: number;
  opens: number;
}

export interface DailyTracker {
  currentStreak: number;
  longestStreak: number;
  /** YYYY-MM-DD of last day with activity */
  lastActiveDate: string | null;
  /** sessions per day target */
  dailyGoal: number;
  /** date(YYYY-MM-DD) -> record */
  history: Record<string, DayRecord>;
}

export interface Metrics {
  totalOpens: number;
  /** ISO datetime */
  lastOpen: string | null;
  totalTimeSec: number;
}

/** Everything tracked for one child. */
export interface ChildData {
  profile: Profile;
  /** key "2".."12" -> stat */
  multiplication: Record<string, TopicStat>;
  /** key letter.id -> stat */
  arabic: Record<string, TopicStat>;
  rewards: RewardsState;
  daily: DailyTracker;
  metrics: Metrics;
  /** newest last; capped to keep storage small */
  sessions: QuizSession[];
}

export interface AppState {
  version: number;
  children: Record<ChildId, ChildData>;
  /** parent dashboard gate */
  parentPin: string;
  /** reminder time HH:MM, local */
  reminderTime: string;
}
