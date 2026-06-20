import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Sejarah module — Supabase client functions                         */
/* ------------------------------------------------------------------ */

export interface SejarahQuestion {
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

export interface SejarahVocabGap {
  id: string;
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface SejarahQuizResult {
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
    .from("sejarah_answer_log")
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
): Promise<SejarahQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sejarah_questions")
    .select("*")
    .eq("chapter", chapter)
    .order("created_at");
  if (error) {
    console.error("Error fetching sejarah questions:", error);
    return [];
  }
  const allQuestions = (data ?? []) as SejarahQuestion[];

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
    .from("sejarah_questions")
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
): Promise<SejarahQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("sejarah_quiz_results")
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
  return (data ?? []) as SejarahQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result. Returns the result ID. */
export async function logSejarahResult(result: {
  child_id: string;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  vocab_gaps_logged: number;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sejarah_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error) {
    console.error("Error logging sejarah result:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Log individual answers for a quiz. */
export async function logSejarahAnswers(
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
  const { error } = await supabase.from("sejarah_answer_log").insert(rows);
  if (error) {
    console.error("Error logging sejarah answers:", error);
  }
}

/** Save a vocabulary gap entry. */
export async function logVocabGap(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("sejarah_vocab_gaps").insert(entry);
  if (error) {
    console.error("Error logging vocab gap:", error);
  }
}

/** Fetch all vocab gaps for a child. */
export async function fetchVocabGaps(childId: string): Promise<SejarahVocabGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sejarah_vocab_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching vocab gaps:", error);
    return [];
  }
  return (data ?? []) as SejarahVocabGap[];
}

/** Toggle reviewed status on a vocab gap. */
export async function toggleVocabReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("sejarah_vocab_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling vocab reviewed:", error);
  }
}
