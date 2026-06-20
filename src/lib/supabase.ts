import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface SupabaseQuizSession {
  child_id: string;
  module: string;
  topic: string;
  quiz_mode: string | null;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  best_streak: number;
  points_earned: number;
}

export interface SupabaseQuizAnswer {
  child_id: string;
  module: string;
  topic: string;
  quiz_mode: string | null;
  question: string;
  correct_answer: string;
  given_answer: string;
  is_correct: boolean;
  response_time_ms: number | null;
  session_id: string;
}

/**
 * Log a completed quiz session and its individual answers to Supabase.
 * Fire-and-forget - errors are silently ignored (localStorage is primary).
 */
export async function logQuizToSupabase(
  session: SupabaseQuizSession,
  answers: Array<{
    question: string;
    correctAnswer: string;
    givenAnswer: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }>,
): Promise<void> {
  if (!supabase) return;

  try {
    // Insert session
    const { data: sessionData, error: sessionError } = await supabase
      .from("quiz_sessions")
      .insert(session)
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      console.error("Supabase session insert error:", sessionError);
      return;
    }

    const sessionId = sessionData.id;

    // Insert answers
    if (answers.length > 0) {
      const answerRows: SupabaseQuizAnswer[] = answers.map((a) => ({
        child_id: session.child_id,
        module: session.module,
        topic: session.topic,
        quiz_mode: session.quiz_mode,
        question: a.question,
        correct_answer: a.correctAnswer,
        given_answer: a.givenAnswer,
        is_correct: a.isCorrect,
        response_time_ms: a.responseTimeMs,
        session_id: sessionId,
      }));

      const { error: answersError } = await supabase
        .from("quiz_answers")
        .insert(answerRows);

      if (answersError) {
        console.error("Supabase answers insert error:", answersError);
      }
    }
  } catch (err) {
    console.error("Supabase logging failed:", err);
  }
}
