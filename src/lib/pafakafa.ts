import { supabase } from "./supabase";
import type { ChildId } from "./types";

/* ------------------------------------------------------------------ *
 * PAFA/KAFA (Fardu Ain) module — Supabase client functions
 * Drives age-appropriate questions for the 3 children:
 *   ilyas   -> 't1'  (Tahun 1 level - simple/concrete)
 *   hafeeza -> 't4'  (Tahun 4 level - intermediate/process)
 *   dhiya   -> 'f3'  (Tingkatan 3 level - advanced/reasoning)
 * ------------------------------------------------------------------ */

export type PafaKafaLevel = "t1" | "t4" | "f3";

/** Map a child to their schooling level. Drives which questions load. */
const CHILD_LEVEL: Record<ChildId, PafaKafaLevel> = {
  ilyas: "t1",
  hafeeza: "t4",
  dhiya: "f3",
  papa: "f3",
};

export function levelForChild(childId: ChildId): PafaKafaLevel {
  return CHILD_LEVEL[childId];
}

export const LEVEL_LABEL: Record<PafaKafaLevel, string> = {
  t1: "Tahun 1",
  t4: "Tahun 4",
  f3: "Tingkatan 3",
};

export interface PafaKafaQuestion {
  id: string;
  /** schooling level this question belongs to */
  level: PafaKafaLevel;
  /** topic group numbered within a level (1..10) */
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

export interface PafaKafaTermGap {
  id: string;
  child_id: string;
  question_id: string | null;
  term: string;
  chapter: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface PafaKafaQuizResult {
  id: string;
  child_id: string;
  level: PafaKafaLevel;
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
    .from("pafakafa_answer_log")
    .select("question_id, result_id!inner(child_id, chapter)")
    .eq("result_id.child_id", childId)
    .eq("result_id.chapter", chapter);
  if (error) {
    console.error("Error fetching seen PAFA/KAFA questions:", error);
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
  level: PafaKafaLevel,
  chapter: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<PafaKafaQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("pafakafa_questions")
    .select("*")
    .eq("level", level)
    .eq("chapter", chapter)
    .order("created_at");
  if (error) {
    console.error("Error fetching PAFA/KAFA questions:", error);
    return [];
  }
  const allQuestions = (data ?? []) as PafaKafaQuestion[];

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
export async function fetchChapters(level: PafaKafaLevel): Promise<ChapterInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("pafakafa_questions")
    .select("chapter, chapter_title")
    .eq("level", level);
  if (error) {
    console.error("Error fetching PAFA/KAFA chapters:", error);
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
): Promise<PafaKafaQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("pafakafa_quiz_results")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (chapter !== undefined) {
    query = query.eq("chapter", chapter);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching PAFA/KAFA quiz results:", error);
    return [];
  }
  return (data ?? []) as PafaKafaQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result directly. Throws on failure. */
export async function logPafaKafaResultDirect(result: {
  child_id: string;
  level: PafaKafaLevel;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  term_gaps_logged: number;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase
    .from("pafakafa_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error || !data) {
    throw error || new Error("Failed to log PAFA/KAFA result");
  }
  return data.id;
}

/** Log individual answers directly. Throws on failure. */
export async function logPafaKafaAnswersDirect(
  resultId: string,
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  if (answers.length === 0) return;
  const rows = answers.map((a) => ({ ...a, result_id: resultId }));
  const { error } = await supabase.from("pafakafa_answer_log").insert(rows);
  if (error) {
    throw error;
  }
}

/** Log a completed quiz result and answers directly. Throws on failure. */
export async function logPafaKafaQuizDirect(
  result: {
    child_id: string;
    level: PafaKafaLevel;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    term_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  const resultId = await logPafaKafaResultDirect(result);
  await logPafaKafaAnswersDirect(resultId, answers);
}

/**
 * Log a completed PAFA/KAFA quiz. If offline or write fails, queues the result in localStorage.
 */
export async function logPafaKafaQuiz(
  result: {
    child_id: string;
    level: PafaKafaLevel;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    term_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  try {
    await logPafaKafaQuizDirect(result, answers);
  } catch (err) {
    console.error("PAFA/KAFA logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "pafa_kafa" as any, // Cast since we'll add this to QueueItem union shortly
        payload: { result, answers } as any,
      });
    } catch (queueErr) {
      console.error("Failed to queue PAFA/KAFA sync item:", queueErr);
    }
  }
}

/** Save a vocabulary / term gap entry directly. Throws on failure. */
export async function logTermGapDirect(entry: {
  child_id: string;
  question_id: string | null;
  term: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("pafakafa_term_gaps").insert(entry);
  if (error) {
    throw error;
  }
}

/** Save a term gap entry. Queues offline on failure. */
export async function logTermGap(entry: {
  child_id: string;
  question_id: string | null;
  term: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  try {
    await logTermGapDirect(entry);
  } catch (err) {
    console.error("PAFA/KAFA term gap logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "pafakafa_term_gap" as any,
        payload: entry as any,
      });
    } catch (queueErr) {
      console.error("Failed to queue PAFA/KAFA term gap sync item:", queueErr);
    }
  }
}

/** Fetch all term gaps for a child. */
export async function fetchTermGaps(childId: string): Promise<PafaKafaTermGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("pafakafa_term_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching PAFA/KAFA term gaps:", error);
    return [];
  }
  return (data ?? []) as PafaKafaTermGap[];
}

/** Toggle reviewed status on a term gap. */
export async function toggleTermReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("pafakafa_term_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling PAFA/KAFA term reviewed:", error);
  }
}
