import { supabase } from "./supabase";
import type { ChildId } from "./types";

/* ------------------------------------------------------------------ */
/* Sains module — Supabase client functions                           */
/* Mirrors sejarah.ts. Adds a `level` axis so each child gets          */
/* age-appropriate questions:                                          */
/*   Ilyas  -> "t1"  (KSSR Sains Tahun 1)                              */
/*   Hafeeza-> "t4"  (KSSR Sains Tahun 4)                              */
/*   Dhiya  -> "f3"  (KSSM Sains Tingkatan 3 / PT3)                    */
/* ------------------------------------------------------------------ */

export type ScienceLevel = "t1" | "t4" | "f3";

/** Map a child to their schooling level. Drives which questions load. */
const CHILD_LEVEL: Record<ChildId, ScienceLevel> = {
  ilyas: "t1",
  hafeeza: "t4",
  dhiya: "f3",
};

export function levelForChild(childId: ChildId): ScienceLevel {
  return CHILD_LEVEL[childId];
}

export const LEVEL_LABEL: Record<ScienceLevel, string> = {
  t1: "Tahun 1",
  t4: "Tahun 4",
  f3: "Tingkatan 3",
};

export interface ScienceQuestion {
  id: string;
  /** schooling level this question belongs to */
  level: ScienceLevel;
  /** KSSR/KSSM Sains topic group, numbered within a level */
  chapter: number;
  chapter_title: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  /** kbat = Kemahiran Berfikir Aras Tinggi (higher-order) */
  difficulty: "easy" | "standard" | "kbat";
  tags: string[] | null;
}

export interface ScienceTermGap {
  id: string;
  child_id: string;
  question_id: string | null;
  term: string;
  chapter: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface ScienceQuizResult {
  id: string;
  child_id: string;
  level: ScienceLevel;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number | null;
  term_gaps_logged: number;
  created_at: string;
}

/** Chapter metadata derived from questions in DB, scoped to a level. */
export interface ChapterInfo {
  chapter: number;
  chapter_title: string;
  questionCount: number;
}

export type QuizMode = "quick" | "full";
const QUICK_QUIZ_COUNT = 10;

/* ----------------------------- Queries ----------------------------- */

/** Fisher-Yates shuffle helper. Mutates in place & returns the array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get IDs of questions already answered by this child for a chapter. */
export async function fetchSeenQuestionIds(
  childId: string,
  chapter: number,
): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("science_answer_log")
    .select("question_id, result_id!inner(child_id, chapter)")
    .eq("result_id.child_id", childId)
    .eq("result_id.chapter", chapter);
  if (error) {
    console.error("Error fetching seen questions:", error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { question_id: string }) => r.question_id));
}

/**
 * Fetch questions for a level + chapter with smart randomization.
 * - Always scoped to the child's level (age-appropriate)
 * - Prioritizes unseen questions
 * - "quick" mode returns QUICK_QUIZ_COUNT, "full" returns all
 */
export async function fetchQuestions(
  level: ScienceLevel,
  chapter: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<ScienceQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("science_questions")
    .select("*")
    .eq("level", level)
    .eq("chapter", chapter)
    .order("created_at");
  if (error) {
    console.error("Error fetching science questions:", error);
    return [];
  }
  const allQuestions = (data ?? []) as ScienceQuestion[];

  const seenIds = childId
    ? await fetchSeenQuestionIds(childId, chapter)
    : new Set<string>();

  const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
  const seen = allQuestions.filter((q) => seenIds.has(q.id));

  shuffle(unseen);
  shuffle(seen);

  const prioritized = [...unseen, ...seen];

  if (mode === "full") return prioritized;
  return prioritized.slice(0, QUICK_QUIZ_COUNT);
}

/** Fetch chapter list (with counts) for a single level. */
export async function fetchChapters(level: ScienceLevel): Promise<ChapterInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("science_questions")
    .select("chapter, chapter_title")
    .eq("level", level);
  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
  const rows = (data ?? []) as Array<{ chapter: number; chapter_title: string }>;
  const map = new Map<number, { title: string; count: number }>();
  for (const r of rows) {
    const existing = map.get(r.chapter);
    if (existing) {
      existing.count++;
    } else {
      map.set(r.chapter, { title: r.chapter_title, count: 1 });
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([ch, { title, count }]) => ({
      chapter: ch,
      chapter_title: title,
      questionCount: count,
    }));
}

/** Fetch past quiz results for a child. */
export async function fetchQuizResults(
  childId: string,
  chapter?: number,
): Promise<ScienceQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("science_quiz_results")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (chapter !== undefined) {
    query = query.eq("chapter", chapter);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching quiz results:", error);
    return [];
  }
  return (data ?? []) as ScienceQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result. Returns the result ID. */
export async function logScienceResult(result: {
  child_id: string;
  level: ScienceLevel;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  term_gaps_logged: number;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("science_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error) {
    console.error("Error logging science result:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Log individual answers for a quiz. */
export async function logScienceAnswers(
  resultId: string,
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  if (!supabase || answers.length === 0) return;
  const rows = answers.map((a) => ({ ...a, result_id: resultId }));
  const { error } = await supabase.from("science_answer_log").insert(rows);
  if (error) {
    console.error("Error logging science answers:", error);
  }
}

/** Save a science-term gap entry (term the child did not know). */
export async function logTermGap(entry: {
  child_id: string;
  question_id: string | null;
  term: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("science_term_gaps").insert(entry);
  if (error) {
    console.error("Error logging term gap:", error);
  }
}

/** Fetch all term gaps for a child. */
export async function fetchTermGaps(childId: string): Promise<ScienceTermGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("science_term_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching term gaps:", error);
    return [];
  }
  return (data ?? []) as ScienceTermGap[];
}

/** Toggle reviewed status on a term gap. */
export async function toggleTermReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("science_term_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling term reviewed:", error);
  }
}
