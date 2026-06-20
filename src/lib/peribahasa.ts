import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Peribahasa module — Supabase client functions                      */
/* ------------------------------------------------------------------ */

export interface PeribahasaQuestion {
  id: string;
  tingkatan: number;
  tema: string | null;
  peribahasa: string;
  maksud: string;
  question_type: "situasi_to_peribahasa" | "peribahasa_to_maksud" | "fill_blank";
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: "easy" | "standard" | "kbat";
}

export interface PeribahasaQuizResult {
  id: string;
  child_id: string;
  tingkatan: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number;
  created_at: string;
}

export interface TingkatanInfo {
  tingkatan: number;
  questionCount: number;
}

/* ----------------------------- Queries ----------------------------- */

/** Fetch all questions for a specific tingkatan, shuffled. */
export async function fetchPeribahasaQuestions(
  tingkatan: number,
): Promise<PeribahasaQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("peribahasa_questions")
    .select("*")
    .eq("tingkatan", tingkatan)
    .order("created_at");
  if (error) {
    console.error("Error fetching peribahasa questions:", error);
    return [];
  }
  const questions = (data ?? []) as PeribahasaQuestion[];
  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
}

/** Fetch tingkatan list with question counts. */
export async function fetchPeribahasaTingkatan(): Promise<TingkatanInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("peribahasa_questions")
    .select("tingkatan");
  if (error) {
    console.error("Error fetching tingkatan:", error);
    return [];
  }
  const rows = (data ?? []) as Array<{ tingkatan: number }>;
  const map = new Map<number, number>();
  for (const r of rows) {
    map.set(r.tingkatan, (map.get(r.tingkatan) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([t, count]) => ({ tingkatan: t, questionCount: count }));
}

/** Fetch past quiz results for a child. */
export async function fetchPeribahasaResults(
  childId: string,
  tingkatan?: number,
): Promise<PeribahasaQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("peribahasa_quiz_results")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (tingkatan !== undefined) {
    query = query.eq("tingkatan", tingkatan);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching peribahasa results:", error);
    return [];
  }
  return (data ?? []) as PeribahasaQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result. Returns the result ID. */
export async function logPeribahasaResult(result: {
  child_id: string;
  tingkatan: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("peribahasa_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error) {
    console.error("Error logging peribahasa result:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Log individual answers for a quiz. */
export async function logPeribahasaAnswers(
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
  const { error } = await supabase.from("peribahasa_answer_log").insert(rows);
  if (error) {
    console.error("Error logging peribahasa answers:", error);
  }
}
