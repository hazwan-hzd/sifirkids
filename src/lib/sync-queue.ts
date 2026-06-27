import { supabase, logQuizToSupabaseDirect } from "./supabase";
import { logSejarahQuizDirect, logVocabGapDirect } from "./sejarah";
import { logPeribahasaQuizDirect } from "./peribahasa";
import { logBMQuizDirect, logVocabGapDirect as logBMVocabGapDirect } from "./bahasamelayu";
import { logPafaKafaQuizDirect, logTermGapDirect } from "./pafakafa";
import { logGeografiQuizDirect, logVocabGapDirect as logGeografiVocabGapDirect } from "./geografi";
import { writeLedgerDirect, type LedgerType } from "./store";

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
    }
  | {
      type: "bahasa_melayu";
      payload: {
        result: {
          child_id: string;
          level: string;
          topic: number;
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
      type: "bm_vocab_gap";
      payload: {
        child_id: string;
        question_id: string | null;
        word: string;
        topic: number | null;
        context: string | null;
      };
    }
  | {
      type: "pafa_kafa";
      payload: {
        result: {
          child_id: string;
          level: "t1" | "t4" | "f3";
          chapter: number;
          total_questions: number;
          correct_answers: number;
          duration_sec: number;
          points_earned: number;
          term_gaps_logged: number;
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
      type: "pafakafa_term_gap";
      payload: {
        child_id: string;
        question_id: string | null;
        term: string;
        chapter: number | null;
        context: string | null;
      };
    }
  | {
      type: "geografi";
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
      type: "geografi_vocab_gap";
      payload: {
        child_id: string;
        question_id: string | null;
        word: string;
        chapter: number | null;
        context: string | null;
      };
    }
  | {
      type: "ledger";
      payload: {
        child_id: string;
        type: LedgerType;
        amount: number;
        reference_id?: string;
        note?: string;
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
      } else if (item.type === "bahasa_melayu") {
        await logBMQuizDirect(item.payload.result as Parameters<typeof logBMQuizDirect>[0], item.payload.answers);
      } else if (item.type === "bm_vocab_gap") {
        await logBMVocabGapDirect(item.payload);
      } else if (item.type === "pafa_kafa") {
        await logPafaKafaQuizDirect(item.payload.result, item.payload.answers);
      } else if (item.type === "pafakafa_term_gap") {
        await logTermGapDirect(item.payload);
      } else if (item.type === "geografi") {
        await logGeografiQuizDirect(item.payload.result, item.payload.answers);
      } else if (item.type === "geografi_vocab_gap") {
        await logGeografiVocabGapDirect(item.payload);
      } else if (item.type === "ledger") {
        await writeLedgerDirect(
          item.payload.child_id,
          item.payload.type,
          item.payload.amount,
          item.payload.reference_id,
          item.payload.note,
        );
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
