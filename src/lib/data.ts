import type { ChildId, ColorKey, Grade, Profile } from "./types";

/** The three children. Order = display order on the home screen. */
export const PROFILES: Profile[] = [
  { id: "hafeeza", name: "Hafeeza", avatar: "🦋", color: "coral" },
  { id: "dhiya", name: "Dhiya", avatar: "🌟", color: "teal" },
  { id: "ilyas", name: "Ilyas", avatar: "🚀", color: "sky" },
];

/** Which school level each child is in. Subject modules key their content off this. */
export const CHILD_GRADE: Record<ChildId, Grade> = {
  ilyas: "std1", // Darjah 1 (KSSR)
  hafeeza: "std4", // Darjah 4 (KSSR)
  dhiya: "form3", // Tingkatan 3 (KSSM)
};

/** Human label for a grade, in Bahasa Melayu. */
export const GRADE_LABEL: Record<Grade, string> = {
  std1: "Darjah 1",
  std4: "Darjah 4",
  form3: "Tingkatan 3",
};

export function getProfile(id: ChildId): Profile {
  const p = PROFILES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown child: ${id}`);
  return p;
}

export const CHILD_IDS: ChildId[] = PROFILES.map((p) => p.id);

/** Multiplication tables covered: 2x through 12x. */
export const TABLES: number[] = Array.from({ length: 11 }, (_, i) => i + 2); // 2..12

/* ------------------------------------------------------------------ */
/* Arabic Alif Ba Ta — 28 letters, grouped into learning sets         */
/* ------------------------------------------------------------------ */

export interface ArabicLetter {
  /** stable id used as the progress key */
  id: string;
  /** isolated-form glyph */
  glyph: string;
  /** common name */
  name: string;
  /** simple transliteration of the sound */
  sound: string;
  /** which learning set (1..4) */
  set: number;
}

export const ARABIC_LETTERS: ArabicLetter[] = [
  { id: "alif", glyph: "ا", name: "Alif", sound: "a", set: 1 },
  { id: "ba", glyph: "ب", name: "Ba", sound: "b", set: 1 },
  { id: "ta", glyph: "ت", name: "Ta", sound: "t", set: 1 },
  { id: "tha", glyph: "ث", name: "Tha", sound: "th", set: 1 },
  { id: "jim", glyph: "ج", name: "Jim", sound: "j", set: 1 },
  { id: "ha", glyph: "ح", name: "Ḥa", sound: "ḥ", set: 1 },
  { id: "kha", glyph: "خ", name: "Kha", sound: "kh", set: 1 },

  { id: "dal", glyph: "د", name: "Dal", sound: "d", set: 2 },
  { id: "dhal", glyph: "ذ", name: "Dhal", sound: "dh", set: 2 },
  { id: "ra", glyph: "ر", name: "Ra", sound: "r", set: 2 },
  { id: "zay", glyph: "ز", name: "Zay", sound: "z", set: 2 },
  { id: "sin", glyph: "س", name: "Sin", sound: "s", set: 2 },
  { id: "shin", glyph: "ش", name: "Shin", sound: "sh", set: 2 },
  { id: "sad", glyph: "ص", name: "Ṣad", sound: "ṣ", set: 2 },

  { id: "dad", glyph: "ض", name: "Ḍad", sound: "ḍ", set: 3 },
  { id: "tah", glyph: "ط", name: "Ṭa", sound: "ṭ", set: 3 },
  { id: "zah", glyph: "ظ", name: "Ẓa", sound: "ẓ", set: 3 },
  { id: "ain", glyph: "ع", name: "ʿAin", sound: "ʿa", set: 3 },
  { id: "ghain", glyph: "غ", name: "Ghain", sound: "gh", set: 3 },
  { id: "fa", glyph: "ف", name: "Fa", sound: "f", set: 3 },
  { id: "qaf", glyph: "ق", name: "Qaf", sound: "q", set: 3 },

  { id: "kaf", glyph: "ك", name: "Kaf", sound: "k", set: 4 },
  { id: "lam", glyph: "ل", name: "Lam", sound: "l", set: 4 },
  { id: "mim", glyph: "م", name: "Mim", sound: "m", set: 4 },
  { id: "nun", glyph: "ن", name: "Nun", sound: "n", set: 4 },
  { id: "hah", glyph: "ه", name: "Ha", sound: "h", set: 4 },
  { id: "waw", glyph: "و", name: "Waw", sound: "w", set: 4 },
  { id: "ya", glyph: "ي", name: "Ya", sound: "y", set: 4 },
];

export const ARABIC_SETS: number[] = [1, 2, 3, 4];

export function lettersInSet(set: number): ArabicLetter[] {
  return ARABIC_LETTERS.filter((l) => l.set === set);
}

export function getLetter(id: string): ArabicLetter | undefined {
  return ARABIC_LETTERS.find((l) => l.id === id);
}

/* ------------------------------------------------------------------ */
/* Points + mastery + rewards economy                                 */
/* ------------------------------------------------------------------ */

export const POINTS = {
  perCorrect: 10,
  /** added per question when the whole quiz is perfect */
  perfectBonusPerQuestion: 5,
  /** added once per quiz for keeping a long streak */
  streakBonus: 20,
  /** streak length that unlocks streakBonus */
  streakBonusAt: 5,
  /** bonus for keeping the daily streak alive */
  dailyStreakBonus: 15,
};

/** Mastery: at least this many attempts AND accuracy at/above threshold. */
export const MASTERY = {
  minAttempts: 10,
  accuracy: 0.9,
};

export const DEFAULT_DAILY_GOAL = 2; // quizzes per day

export interface Reward {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

/** Reward shop. Parent approves claims from the dashboard. */
export const REWARDS: Reward[] = [
  { id: "sticker", name: "Sticker", icon: "✨", cost: 50 },
  { id: "icecream", name: "Ice Cream", icon: "🍦", cost: 150 },
  { id: "screen30", name: "30 min Screen Time", icon: "📺", cost: 200 },
  { id: "pickdinner", name: "Pick Dinner", icon: "🍕", cost: 300 },
  { id: "movienight", name: "Movie Night", icon: "🎬", cost: 400 },
  { id: "stayuplate", name: "Stay Up Late", icon: "🌙", cost: 500 },
  { id: "toy", name: "New Toy", icon: "🧸", cost: 1000 },
  { id: "outing", name: "Day Outing", icon: "🎡", cost: 2000 },
];

export function getReward(id: string): Reward | undefined {
  return REWARDS.find((r) => r.id === id);
}

/** Palette tokens per color family — used so components avoid hardcoding hex. */
export const COLOR_CLASSES: Record<
  ColorKey,
  { bg: string; bgSoft: string; text: string; ring: string; border: string; solid: string }
> = {
  coral: {
    bg: "bg-coral-500",
    bgSoft: "bg-coral-100",
    text: "text-coral-600",
    ring: "ring-coral-400",
    border: "border-coral-400",
    solid: "#ff5a47",
  },
  teal: {
    bg: "bg-teal-500",
    bgSoft: "bg-teal-100",
    text: "text-teal-600",
    ring: "ring-teal-400",
    border: "border-teal-400",
    solid: "#14c2a0",
  },
  sky: {
    bg: "bg-sky-500",
    bgSoft: "bg-sky-100",
    text: "text-sky-600",
    ring: "ring-sky-400",
    border: "border-sky-400",
    solid: "#1f9bff",
  },
  grape: {
    bg: "bg-grape-500",
    bgSoft: "bg-grape-100",
    text: "text-grape-600",
    ring: "ring-grape-400",
    border: "border-grape-400",
    solid: "#8b4dff",
  },
  sunny: {
    bg: "bg-sunny-500",
    bgSoft: "bg-sunny-100",
    text: "text-sunny-600",
    ring: "ring-sunny-400",
    border: "border-sunny-400",
    solid: "#ffba00",
  },
};
