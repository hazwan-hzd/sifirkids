import { supabase, logQuizToSupabaseDirect } from "./supabase";
import { logSejarahQuizDirect, logVocabGapDirect } from "./sejarah";
import { logPeribahasaQuizDirect } from "./peribahasa";

export type QueueItem =
  | {
      type: "quiz";
      payload: {
        child_id: string;
        module: string;
        topic: string;
        quiz_mode: string | null;
        total_questions: number;
        correct_answers: number;
        duration_sec: number;
        best_streak: number;
        points_earned: number;
        answers: Array<{
          question: string;
          correctAnswer: string;
          givenAnswer: string;
          isCorrect: boolean;
          responseTimeMs: number;
        }>;
      };
    }
  | {
      type: "sejarah";
      payload: {
        result: {
          child_id: string;
          chapter: number;
          total_questions: number;
          correct_answers: number;
          duration_sec: number;
          points_earned: number;
          vocab_gaps_logged: number;
        };
        answers: Array<{
          question_id: string;
          given_answer: string;
          is_correct: boolean;
          response_time_ms: number;
        }>;
      };
    }
  | {
      type: "peribahasa";
      payload: {
        result: {
          child_id: string;
          tingkatan: number;
          total_questions: number;
          correct_answers: number;
          duration_sec: number;
          points_earned: number;
        };
        answers: Array<{
          question_id: string;
          given_answer: string;
          is_correct: boolean;
          response_time_ms: number;
        }>;
      };
    }
  | {
      type: "vocab_gap";
      payload: {
        child_id: string;
        question_id: string | null;
        word: string;
        chapter: number | null;
        context: string | null;
      };
    };

const QUEUE_KEY = "sifirkids:sync_queue";

export function getSyncQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue: QueueItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // storage full / unavailable
  }
}

export function enqueueSyncItem(item: QueueItem) {
  const queue = getSyncQueue();
  queue.push(item);
  saveSyncQueue(queue);
}

let isFlushing = false;

export async function flushSyncQueue(): Promise<void> {
  if (!supabase || isFlushing || typeof window === "undefined" || !navigator.onLine) return;

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  isFlushing = true;
  console.log(`Starting sync queue flush: ${queue.length} items pending.`);

  const remaining: QueueItem[] = [];
  let failed = false;

  for (const item of queue) {
    if (failed) {
      remaining.push(item);
      continue;
    }

    try {
      if (item.type === "quiz") {
        const {
          child_id,
          module,
          topic,
          quiz_mode,
          total_questions,
          correct_answers,
          duration_sec,
          best_streak,
          points_earned,
          answers,
        } = item.payload;
        await logQuizToSupabaseDirect(
          {
            child_id,
            module,
            topic,
            quiz_mode,
            total_questions,
            correct_answers,
            duration_sec,
            best_streak,
            points_earned,
          },
          answers,
        );
      } else if (item.type === "sejarah") {
        await logSejarahQuizDirect(item.payload.result, item.payload.answers);
      } else if (item.type === "peribahasa") {
        await logPeribahasaQuizDirect(item.payload.result, item.payload.answers);
      } else if (item.type === "vocab_gap") {
        await logVocabGapDirect(item.payload);
      }
      console.log(`Synced item of type: ${item.type} successfully.`);
    } catch (err) {
      console.error(`Failed to sync item of type: ${item.type} from queue:`, err);
      failed = true;
      remaining.push(item);
    }
  }

  saveSyncQueue(remaining);
  isFlushing = false;
}
