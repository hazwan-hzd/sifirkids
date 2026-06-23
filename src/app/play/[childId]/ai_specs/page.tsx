"use client";

import { use, useCallback, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { CHILD_IDS, COLOR_CLASSES, POINTS } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { useChild } from "@/lib/store";
import {
  PageShell,
  Loading,
  PointsBadge,
  BackButton,
  Button,
  Card,
  Confetti,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  AI_SPECS_QUESTIONS,
  type BusinessQuestion,
} from "@/lib/ai-specs-questions";

const ACCENT = "sky" as const;
const MODULE_ID = "ai_specs" as const;
const MODULE_LABEL = "AI Models & Frameworks";
const MODULE_EMOJI = "🤖";
const QUIZ_SIZE = 10;

/* ── helpers ─────────────────────────────────────────────────────── */

function getTopics(
  questions: BusinessQuestion[],
): { topic: string; count: number }[] {
  const map = new Map<string, number>();
  for (const q of questions) {
    map.set(q.topic, (map.get(q.topic) || 0) + 1);
  }
  return Array.from(map.entries()).map(([topic, count]) => ({ topic, count }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── types ───────────────────────────────────────────────────────── */

type Screen = "topics" | "quiz" | "results";

interface AnswerRecord {
  questionId: string;
  given: string;
  correct: boolean;
  timeMs: number;
}

/* ── page component ──────────────────────────────────────────────── */

export default function AiSpecsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz } = useChild(id);
  const [screen, setScreen] = useState<Screen>("topics");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BusinessQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [resultPoints, setResultPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  const c = COLOR_CLASSES[ACCENT];
  const topics = getTopics(AI_SPECS_QUESTIONS);

  /* ── quiz lifecycle ────────────────────────────────────────────── */

  const startQuiz = useCallback((topic: string) => {
    const pool = AI_SPECS_QUESTIONS.filter((q) => q.topic === topic);
    const selected = shuffle(pool).slice(0, QUIZ_SIZE);
    if (selected.length === 0) return;
    setActiveTopic(topic);
    setQuestions(selected);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    questionStartRef.current = Date.now();
    quizStartRef.current = Date.now();
    setScreen("quiz");
  }, []);

  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showExplanation) return;
    const q = questions[currentIdx];
    const isCorrect = selectedAnswer === q.answer;
    const timeMs = Date.now() - questionStartRef.current;
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, given: selectedAnswer, correct: isCorrect, timeMs },
    ]);
    setShowExplanation(true);
  }, [selectedAnswer, showExplanation, questions, currentIdx]);

  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartRef.current = Date.now();
    } else {
      /* quiz complete */
      const correctCount = answers.filter((a) => a.correct).length;
      const totalDurationSec = Math.round(
        (Date.now() - quizStartRef.current) / 1000,
      );
      let bestStreak = 0;
      let curr = 0;
      for (const a of answers) {
        if (a.correct) {
          curr++;
          if (curr > bestStreak) bestStreak = curr;
        } else {
          curr = 0;
        }
      }

      const outcome = recordQuiz({
        module: MODULE_ID,
        topic: activeTopic || "mixed",
        total: questions.length,
        correct: correctCount,
        durationSec: totalDurationSec,
        bestStreak,
      });

      setResultPoints(outcome.pointsEarned);
      setShowConfetti(correctCount === questions.length);
      setScreen("results");
    }
  }, [currentIdx, questions, answers, activeTopic, recordQuiz]);

  /* ── loading gate ──────────────────────────────────────────────── */

  if (!hydrated)
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );

  /* ── shared header ─────────────────────────────────────────────── */

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton
        href={screen === "topics" ? `/play/${id}` : undefined}
      />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={c.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ===== TOPIC PICKER ===== */

  if (screen === "topics") {
    return (
      <PageShell>
        {header}
        <h1
          className={`mb-2 text-center font-display text-3xl font-bold ${c.text}`}
        >
          {MODULE_EMOJI} {MODULE_LABEL}
        </h1>
        <p className="mb-6 text-center font-display text-lg text-ink/70">
          Pick a topic to start the quiz
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((t) => (
            <Card
              key={t.topic}
              onClick={() => startQuiz(t.topic)}
              className="flex cursor-pointer flex-col justify-between border border-ink/5 bg-white p-5 text-left transition-transform active:scale-98"
            >
              <h3 className="font-display text-xl font-bold text-ink">
                {t.topic}
              </h3>
              <span className="mt-2 font-display text-xs font-semibold text-ink/50">
                {t.count} Questions Available
              </span>
            </Card>
          ))}
          {/* Mixed mode */}
          <Card
            onClick={() => {
              const selected = shuffle([...AI_SPECS_QUESTIONS]).slice(
                0,
                QUIZ_SIZE,
              );
              setActiveTopic("Mixed");
              setQuestions(selected);
              setCurrentIdx(0);
              setAnswers([]);
              setSelectedAnswer(null);
              setShowExplanation(false);
              questionStartRef.current = Date.now();
              quizStartRef.current = Date.now();
              setScreen("quiz");
            }}
            className={`flex cursor-pointer flex-col justify-between border-2 ${c.border} ${c.bgSoft} p-5 text-left transition-transform active:scale-98`}
          >
            <h3 className={`font-display text-xl font-bold ${c.text}`}>
              🔀 Mixed (All Topics)
            </h3>
            <span className="mt-2 font-display text-xs font-semibold text-ink/50">
              {AI_SPECS_QUESTIONS.length} Questions Total
            </span>
          </Card>
        </div>
      </PageShell>
    );
  }

  /* ===== ACTIVE QUIZ ===== */

  if (screen === "quiz") {
    const q = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const progress = Math.round((currentIdx / questions.length) * 100);

    return (
      <PageShell>
        <Confetti show={showConfetti} />

        {/* progress bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Exit quiz? Progress will not be saved."))
                setScreen("topics");
            }}
            className="text-ink/60"
          >
            ❌ Exit
          </Button>
          <div className="flex-1 px-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full bg-${ACCENT}-500 transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="font-display font-bold text-ink/70">
            {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* question card */}
        <Card className="mb-6 border border-ink/5 bg-white p-6 shadow-sm">
          <span
            className={`mb-3 inline-block rounded-full ${c.bgSoft} px-3 py-1 font-display text-xs font-bold ${c.text}`}
          >
            {q.topic}
          </span>
          <h2 className="font-display text-xl font-bold leading-relaxed text-ink">
            {q.question}
          </h2>
        </Card>

        {/* options */}
        <div className="mb-6 grid gap-3">
          {q.options.map((opt) => {
            const isSelected = selectedAnswer === opt;
            const isCorrectOpt = opt === q.answer;
            let btnStyle = "bg-white border-ink/10 text-ink hover:bg-ink/5";
            if (isSelected)
              btnStyle = `${c.bgSoft} ${c.border} ${c.text} font-bold ring-2 ${c.ring}`;
            if (showExplanation) {
              if (isCorrectOpt)
                btnStyle =
                  "bg-emerald-100 border-emerald-500 text-emerald-700 font-bold ring-2 ring-emerald-300";
              else if (isSelected)
                btnStyle =
                  "bg-rose-100 border-rose-500 text-rose-700 font-bold ring-2 ring-rose-300";
              else btnStyle = "bg-white border-ink/10 text-ink/40";
            }
            return (
              <button
                key={opt}
                disabled={showExplanation}
                onClick={() => setSelectedAnswer(opt)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-4 text-left text-lg transition-all",
                  btnStyle,
                )}
              >
                <span>{opt}</span>
                {showExplanation && isCorrectOpt && <span>✅</span>}
                {showExplanation && isSelected && !isCorrectOpt && (
                  <span>❌</span>
                )}
              </button>
            );
          })}
        </div>

        {/* action button */}
        <div className="mb-6">
          {!showExplanation ? (
            <Button
              className={`w-full bg-${ACCENT}-500 hover:bg-${ACCENT}-600 rounded-2xl py-4 font-display text-lg font-bold text-white`}
              disabled={!selectedAnswer}
              onClick={submitAnswer}
            >
              Check Answer
            </Button>
          ) : (
            <Button
              className="w-full rounded-2xl bg-ink py-4 font-display text-lg font-bold text-white hover:bg-ink/90"
              onClick={nextQuestion}
            >
              {isLast ? "Finish Quiz" : "Next Question ➡️"}
            </Button>
          )}
        </div>

        {/* explanation */}
        {showExplanation && (
          <Card className="animate-slide border border-sky-100 bg-sky-50 p-5 text-left">
            <h4 className="mb-1 font-display font-bold text-sky-800">
              💡 Explanation
            </h4>
            <p className="text-sm leading-relaxed text-sky-950">
              {q.explanation}
            </p>
          </Card>
        )}
      </PageShell>
    );
  }

  /* ===== RESULTS ===== */

  const correctCount = answers.filter((a) => a.correct).length;
  const isPerfect = correctCount === questions.length;
  const scorePct = Math.round((correctCount / questions.length) * 100);

  return (
    <PageShell>
      <Confetti show={showConfetti} />
      {header}
      <div className="mx-auto max-w-md py-8 text-center">
        <span className="mb-4 block text-7xl">
          {isPerfect ? "🏆" : "🎉"}
        </span>
        <h1 className="mb-2 font-display text-4xl font-extrabold text-ink">
          {isPerfect ? "Perfect Score!" : "Quiz Complete!"}
        </h1>
        <p className="mb-6 font-display text-lg text-ink/70">
          Topic:{" "}
          <span className={`font-bold ${c.text}`}>{activeTopic}</span>
        </p>
        <Card className="mb-6 rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-ink/5">
              <span className="block font-display text-xs font-semibold uppercase text-ink/50">
                Score
              </span>
              <span
                className={`mt-1 block font-display text-4xl font-extrabold ${c.text}`}
              >
                {correctCount}/{questions.length}
              </span>
            </div>
            <div>
              <span className="block font-display text-xs font-semibold uppercase text-ink/50">
                Points Earned
              </span>
              <span className="mt-1 block font-display text-4xl font-extrabold text-emerald-600">
                +{resultPoints}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-ink/5 pt-4">
            <span className="block text-sm text-ink/70">
              Accuracy:{" "}
              <span className="font-bold text-ink">{scorePct}%</span>
            </span>
          </div>
        </Card>
        <Button
          onClick={() => setScreen("topics")}
          className={`w-full bg-${ACCENT}-500 hover:bg-${ACCENT}-600 rounded-2xl py-4 font-display text-lg font-bold text-white`}
        >
          Back to Topics
        </Button>
      </div>
    </PageShell>
  );
}
