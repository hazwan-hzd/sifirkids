"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ColorKey, QuizMode } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/data";
import { useSessionTimer } from "@/lib/store";
import { cn, randInt, shuffle } from "@/lib/utils";
import { Card, ProgressBar } from "@/components/ui";

const RANDOM_QUESTION_COUNT = 10;

export interface AnswerRecord {
  question: string;
  correctAnswer: string;
  givenAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface QuizCompletion {
  total: number;
  correct: number;
  durationSec: number;
  bestStreak: number;
  quizMode: QuizMode;
  answers: AnswerRecord[];
  perKey: Record<string, { attempts: number; correct: number; bestStreak: number }>;
}

interface Question {
  /** table used for this question */
  t: number;
  /** the other factor */
  a: number;
  answer: number;
  options: number[];
}

/** Build 4 shuffled options: the correct product plus 3 plausible distractors. */
function makeOptions(a: number, t: number, answer: number): number[] {
  const cands = new Set<number>();
  const candidates = [
    answer + t,
    answer - t,
    answer + 1,
    answer - 1,
    answer + 2,
    answer - 2,
    (a + 1) * t,
    a > 1 ? (a - 1) * t : 0,
    answer + t + 1,
    answer - t - 1,
  ];
  for (const v of candidates) {
    if (v > 0 && v !== answer) cands.add(v);
  }
  const distractors = shuffle([...cands]).slice(0, 3);
  // pad if we somehow came up short (tiny products)
  let extra = 3;
  while (distractors.length < 3) {
    const v = answer + extra;
    if (v > 0 && v !== answer && !distractors.includes(v)) distractors.push(v);
    extra += 1;
  }
  return shuffle([answer, ...distractors]);
}

function buildQuestions(table: number | "mixed", mode: QuizMode): Question[] {
  if (mode === "standard" && typeof table === "number") {
    // Sequential: x1, x2, x3... x12
    return Array.from({ length: 12 }, (_, i) => {
      const a = i + 1;
      const answer = a * table;
      return { t: table, a, answer, options: makeOptions(a, table, answer) };
    });
  }
  // Random mode (original behavior)
  return Array.from({ length: RANDOM_QUESTION_COUNT }, () => {
    const t = table === "mixed" ? randInt(2, 12) : table;
    const a = randInt(1, 12);
    const answer = a * t;
    return { t, a, answer, options: makeOptions(a, t, answer) };
  });
}

export default function Quiz({
  table,
  color,
  mode = "random",
  onComplete,
  onQuit,
}: {
  table: number | "mixed";
  color: ColorKey;
  mode?: QuizMode;
  onComplete: (r: QuizCompletion) => void;
  onQuit: () => void;
}) {
  const c = COLOR_CLASSES[color];
  const questions = useMemo(() => buildQuestions(table, mode), [table, mode]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [streak, setStreak] = useState(0);

  const correctRef = useRef(0);
  const bestStreakRef = useRef(0);
  const curStreakRef = useRef(0);
  const perKeyRef = useRef<
    Record<string, { attempts: number; correct: number; curStreak: number; bestStreak: number }>
  >({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer = useSessionTimer();

  // Per-question timing
  const questionStartRef = useRef<number>(Date.now());
  const answersRef = useRef<AnswerRecord[]>([]);

  useEffect(() => {
    timer.reset();
    questionStartRef.current = Date.now();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[qIndex];

  function finish() {
    const perKey: QuizCompletion["perKey"] = {};
    for (const [key, v] of Object.entries(perKeyRef.current)) {
      perKey[key] = { attempts: v.attempts, correct: v.correct, bestStreak: v.bestStreak };
    }
    onComplete({
      total: questions.length,
      correct: correctRef.current,
      durationSec: timer.elapsed(),
      bestStreak: bestStreakRef.current,
      quizMode: mode,
      answers: answersRef.current,
      perKey,
    });
  }

  function advance() {
    if (qIndex + 1 >= questions.length) {
      finish();
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
      questionStartRef.current = Date.now();
    }
  }

  function handleAnswer(value: number) {
    if (locked) return;
    setLocked(true);
    setSelected(value);

    const responseTimeMs = Date.now() - questionStartRef.current;
    const isCorrect = value === q.answer;

    // Record answer for Supabase
    answersRef.current.push({
      question: `${q.a} x ${q.t}`,
      correctAnswer: String(q.answer),
      givenAnswer: String(value),
      isCorrect,
      responseTimeMs,
    });

    const key = String(q.t);
    const pk =
      perKeyRef.current[key] ?? { attempts: 0, correct: 0, curStreak: 0, bestStreak: 0 };
    pk.attempts += 1;
    if (isCorrect) {
      pk.correct += 1;
      pk.curStreak += 1;
      pk.bestStreak = Math.max(pk.bestStreak, pk.curStreak);
      correctRef.current += 1;
      curStreakRef.current += 1;
      bestStreakRef.current = Math.max(bestStreakRef.current, curStreakRef.current);
      setStreak(curStreakRef.current);
    } else {
      pk.curStreak = 0;
      curStreakRef.current = 0;
      setStreak(0);
    }
    perKeyRef.current[key] = pk;

    timeoutRef.current = setTimeout(advance, isCorrect ? 700 : 1300);
  }

  const progress = (qIndex / questions.length) * 100;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          onClick={onQuit}
          className="tap btn-pop inline-flex h-12 items-center gap-1 rounded-full bg-white/80 px-4 font-display font-semibold text-ink/70 shadow-[var(--shadow-pop)]"
        >
          ✕ Quit
        </button>
        <span className="font-display text-lg font-bold text-ink/70">
          {qIndex + 1} / {questions.length}
        </span>
        <span
          className={cn(
            "inline-flex h-12 items-center gap-1 rounded-full px-4 font-display font-bold",
            streak >= 2 ? "bg-sunny-400 text-ink" : "bg-white/70 text-ink/50",
          )}
        >
          🔥 {streak}
        </span>
      </div>

      <ProgressBar value={progress} color={color} className="mb-6" />

      <Card className="mb-6 flex flex-col items-center gap-2 py-10">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-ink/50">
          What is
        </span>
        <span className={cn("font-display text-6xl font-bold sm:text-7xl", c.text)}>
          {q.a} × {q.t}
        </span>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = selected === opt;
          let stateCls = cn("bg-white", c.text);
          if (locked) {
            if (isAnswer) stateCls = "bg-leaf-500 text-white animate-pop";
            else if (isPicked) stateCls = "bg-coral-500 text-white";
            else stateCls = "bg-white/60 text-ink/40";
          }
          return (
            <button
              key={opt}
              disabled={locked}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "btn-pop tap flex min-h-[88px] items-center justify-center rounded-[var(--radius-blob)] font-display text-4xl font-bold shadow-[var(--shadow-pop)] disabled:active:translate-y-0",
                stateCls,
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {locked && selected !== q.answer && (
        <p className="mt-6 text-center font-display text-xl font-bold text-coral-600 animate-pop">
          {q.a} × {q.t} = {q.answer}
        </p>
      )}
    </div>
  );
}
