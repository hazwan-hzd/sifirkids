import { supabase } from "./supabase";
import type { ChildId } from "./types";

/* ------------------------------------------------------------------ */
/* Bahasa Melayu module -- Supabase client functions                   */
/* Mirrors science.ts. Adds a `level` axis so each child gets         */
/* age-appropriate questions:                                          */
/*   Ilyas   -> "t1"  (KSSR Bahasa Melayu Tahun 1)                    */
/*   Hafeeza -> "t4"  (KSSR Bahasa Melayu Tahun 4)                    */
/*   Dhiya   -> "f3"  (KSSM Bahasa Melayu Tingkatan 3 / PT3)          */
/* ------------------------------------------------------------------ */

export type BMLevel = "t1" | "t4" | "f3";

/** Map a child to their schooling level. Drives which questions load. */
const CHILD_LEVEL: Record<ChildId, BMLevel> = {
  ilyas: "t1",
  hafeeza: "t4",
  dhiya: "f3",
  papa: "f3",
  mommy: "f3",
};

export function levelForChild(childId: ChildId): BMLevel {
  return CHILD_LEVEL[childId];
}

export const LEVEL_LABEL: Record<BMLevel, string> = {
  t1: "Tahun 1",
  t4: "Tahun 4",
  f3: "Tingkatan 3",
};

export interface BMQuestion {
  id: string;
  /** schooling level this question belongs to */
  level: BMLevel;
  /** topic group numbered within a level */
  topic: number;
  topic_title: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  /** kbat = Kemahiran Berfikir Aras Tinggi (higher-order) */
  difficulty: "easy" | "standard" | "kbat";
  tags: string[] | null;
  // Custom properties for Pemahaman
  passage_title?: string;
  passage_text?: string;
  raw_question_text?: string;
  answer_config?: any;
}

export interface BMVocabGap {
  id: string;
  child_id: string;
  question_id: string | null;
  word: string;
  topic: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface BMQuizResult {
  id: string;
  child_id: string;
  level: BMLevel;
  topic: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number | null;
  vocab_gaps_logged: number;
  created_at: string;
}

/** Topic metadata derived from questions in DB, scoped to a level. */
export interface TopicInfo {
  topic: number;
  topic_title: string;
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

/** Get IDs of questions already answered by this child for a topic. */
export async function fetchSeenQuestionIds(
  childId: string,
  topic: number,
): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("bm_answer_log")
    .select("question_id, result_id!inner(child_id, topic)")
    .eq("result_id.child_id", childId)
    .eq("result_id.topic", topic);
  if (error) {
    console.error("Error fetching seen BM questions:", error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { question_id: string }) => r.question_id));
}

/**
 * Fetch questions for a level + topic with smart randomization.
 * - Always scoped to the child's level (age-appropriate)
 * - Prioritizes unseen questions
 * - "quick" mode returns QUICK_QUIZ_COUNT, "full" returns all
 */
export async function fetchQuestions(
  level: BMLevel,
  topic: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<BMQuestion[]> {
  if (topic === 3) {
    try {
      const { getLocalPemahamanQuestions, PEMAHAMAN_PASSAGES } = await import("./pemahaman-engine");
      const allQuestions = getLocalPemahamanQuestions(level);

      const passageIds = PEMAHAMAN_PASSAGES.map(p => p.id);
      shuffle(passageIds);

      const selectedPassages = mode === "quick" ? passageIds.slice(0, 2) : passageIds;

      const filteredQuestions: BMQuestion[] = [];
      for (const pid of selectedPassages) {
        const pQs = allQuestions.filter(q => q.tags?.includes(pid));
        pQs.sort((a, b) => a.id.localeCompare(b.id));
        filteredQuestions.push(...pQs);
      }
      return filteredQuestions;
    } catch (e) {
      console.error("Error loading Pemahaman questions:", e);
      return [];
    }
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bm_questions")
    .select("*")
    .eq("level", level)
    .eq("topic", topic)
    .order("created_at");
  if (error) {
    console.error("Error fetching BM questions:", error);
    return [];
  }
  const allQuestions = (data ?? []) as BMQuestion[];

  const seenIds = childId
    ? await fetchSeenQuestionIds(childId, topic)
    : new Set<string>();

  const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
  const seen = allQuestions.filter((q) => seenIds.has(q.id));

  shuffle(unseen);
  shuffle(seen);

  const prioritized = [...unseen, ...seen];

  if (mode === "full") return prioritized;
  return prioritized.slice(0, QUICK_QUIZ_COUNT);
}

/** Fetch topic list (with counts) for a single level. */
export async function fetchTopics(level: BMLevel): Promise<TopicInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bm_questions")
    .select("topic, topic_title")
    .eq("level", level);
  if (error) {
    console.error("Error fetching BM topics:", error);
    return [];
  }
  const rows = (data ?? []) as Array<{ topic: number; topic_title: string }>;
  const map = new Map<number, { title: string; count: number }>();
  for (const r of rows) {
    const existing = map.get(r.topic);
    if (existing) {
      existing.count++;
    } else {
      map.set(r.topic, { title: r.topic_title, count: 1 });
    }
  }
  const topicsList = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([t, { title, count }]) => ({
      topic: t,
      topic_title: title,
      questionCount: count,
    }));

  if (level === "f3") {
    // Append topic 3 Pemahaman
    topicsList.push({
      topic: 3,
      topic_title: "Pemahaman",
      questionCount: 50,
    });
  }

  return topicsList;
}

/** Fetch past quiz results for a child. */
export async function fetchQuizResults(
  childId: string,
  topic?: number,
): Promise<BMQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("bm_quiz_results")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (topic !== undefined) {
    query = query.eq("topic", topic);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching BM quiz results:", error);
    return [];
  }
  return (data ?? []) as BMQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result directly. Throws on failure. */
export async function logBMResultDirect(result: {
  child_id: string;
  level: BMLevel;
  topic: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  vocab_gaps_logged: number;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase
    .from("bm_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error || !data) {
    throw error || new Error("Failed to log BM result");
  }
  return data.id;
}

/** Log individual answers directly. Throws on failure. */
export async function logBMAnswersDirect(
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
  const { error } = await supabase.from("bm_answer_log").insert(rows);
  if (error) {
    throw error;
  }
}

/** Log a completed quiz result and answers directly. Throws on failure. */
export async function logBMQuizDirect(
  result: {
    child_id: string;
    level: BMLevel;
    topic: number;
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
  const resultId = await logBMResultDirect(result);
  await logBMAnswersDirect(resultId, answers);
}

/**
 * Log a completed BM quiz. If offline or write fails, queues the result
 * in localStorage via sync-queue.
 */
export async function logBMQuiz(
  result: {
    child_id: string;
    level: BMLevel;
    topic: number;
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
    await logBMQuizDirect(result, answers);
  } catch (err) {
    console.error("BM logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "bahasa_melayu",
        payload: { result, answers },
      });
    } catch (queueErr) {
      console.error("Failed to queue BM sync item:", queueErr);
    }
  }
}

/** Save a vocabulary gap entry directly. Throws on failure. */
export async function logVocabGapDirect(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  topic: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("bm_vocab_gaps").insert(entry);
  if (error) {
    throw error;
  }
}

/** Save a vocabulary gap entry. Queues offline on failure. */
export async function logVocabGap(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  topic: number | null;
  context: string | null;
}): Promise<void> {
  try {
    await logVocabGapDirect(entry);
  } catch (err) {
    console.error("BM vocab gap logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "bm_vocab_gap",
        payload: entry,
      });
    } catch (queueErr) {
      console.error("Failed to queue BM vocab gap sync item:", queueErr);
    }
  }
}

/** Fetch all vocab gaps for a child. */
export async function fetchVocabGaps(childId: string): Promise<BMVocabGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bm_vocab_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching BM vocab gaps:", error);
    return [];
  }
  return (data ?? []) as BMVocabGap[];
}

/** Toggle reviewed status on a vocab gap. */
export async function toggleVocabReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("bm_vocab_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling BM vocab reviewed:", error);
  }
}
