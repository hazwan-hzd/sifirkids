import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Geografi module - Supabase client functions                         */
/* ------------------------------------------------------------------ */

export interface GeografiQuestion {
  id: string;
  chapter: number;
  chapter_title: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  difficulty: "easy" | "standard" | "kbat";
  tags: string[] | null;
}

export interface GeografiVocabGap {
  id: string;
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface GeografiQuizResult {
  id: string;
  child_id: string;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number | null;
  vocab_gaps_logged: number;
  created_at: string;
}

/** Chapter metadata derived from questions in DB. */
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
  // Join answer_log -> quiz_results to filter by child + chapter
  const { data, error } = await supabase
    .from("geografi_answer_log")
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
 * Fetch questions for a chapter with smart randomization.
 * - Prioritizes unseen questions (ones the child hasn't answered before)
 * - In "quick" mode: returns QUICK_QUIZ_COUNT questions
 * - In "full" mode: returns all questions
 */
export async function fetchQuestions(
  chapter: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<GeografiQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("geografi_questions")
    .select("*")
    .eq("chapter", chapter)
    .order("created_at");
  if (error) {
    console.error("Error fetching geografi questions:", error);
    return [];
  }
  const allQuestions = (data ?? []) as GeografiQuestion[];

  // Get previously seen IDs for smart prioritization
  const seenIds = childId
    ? await fetchSeenQuestionIds(childId, chapter)
    : new Set<string>();

  // Split into unseen and seen
  const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
  const seen = allQuestions.filter((q) => seenIds.has(q.id));

  // Shuffle both pools independently
  shuffle(unseen);
  shuffle(seen);

  // Prioritize unseen, then fill with seen
  const prioritized = [...unseen, ...seen];

  if (mode === "full") {
    return prioritized;
  }
  // Quick mode: take QUICK_QUIZ_COUNT
  return prioritized.slice(0, QUICK_QUIZ_COUNT);
}

/** Fetch chapter list with question counts. */
export async function fetchChapters(): Promise<ChapterInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("geografi_questions")
    .select("chapter, chapter_title");
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
): Promise<GeografiQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("geografi_quiz_results")
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
  return (data ?? []) as GeografiQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result directly. Throws on failure. */
export async function logGeografiResultDirect(result: {
  child_id: string;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  vocab_gaps_logged: number;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase
    .from("geografi_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error || !data) {
    throw error || new Error("Failed to log geografi result");
  }
  return data.id;
}

/** Log individual answers directly. Throws on failure. */
export async function logGeografiAnswersDirect(
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
  const { error } = await supabase.from("geografi_answer_log").insert(rows);
  if (error) {
    throw error;
  }
}

/** Log a completed quiz result and answers directly. Throws on failure. */
export async function logGeografiQuizDirect(
  result: {
    child_id: string;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    vocab_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  const resultId = await logGeografiResultDirect(result);
  await logGeografiAnswersDirect(resultId, answers);
}

/**
 * Log a completed geografi quiz. If offline or write fails, queues the result in localStorage.
 */
export async function logGeografiQuiz(
  result: {
    child_id: string;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    vocab_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  try {
    await logGeografiQuizDirect(result, answers);
  } catch (err) {
    console.error("Geografi logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "geografi",
        payload: { result, answers },
      });
    } catch (queueErr) {
      console.error("Failed to queue geografi sync item:", queueErr);
    }
  }
}

/** Save a vocabulary gap entry directly. Throws on failure. */
export async function logVocabGapDirect(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("geografi_vocab_gaps").insert(entry);
  if (error) {
    throw error;
  }
}

/** Save a vocabulary gap entry. Queues offline on failure. */
export async function logVocabGap(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  try {
    await logVocabGapDirect(entry);
  } catch (err) {
    console.error("Vocab gap logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "vocab_gap",
        payload: entry,
      });
    } catch (queueErr) {
      console.error("Failed to queue vocab gap sync item:", queueErr);
    }
  }
}

/** Fetch all vocab gaps for a child. */
export async function fetchVocabGaps(childId: string): Promise<GeografiVocabGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("geografi_vocab_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching vocab gaps:", error);
    return [];
  }
  return (data ?? []) as GeografiVocabGap[];
}

/** Toggle reviewed status on a vocab gap. */
export async function toggleVocabReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("geografi_vocab_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling vocab reviewed:", error);
  }
}
