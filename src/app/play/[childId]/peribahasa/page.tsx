"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CHILD_IDS, COLOR_CLASSES } from "@/lib/data";
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
import { cn, pct } from "@/lib/utils";
import {
  fetchPeribahasaTingkatan,
  fetchPeribahasaQuestions,
  fetchPeribahasaResults,
  logPeribahasaResult,
  logPeribahasaAnswers,
  type PeribahasaQuestion,
  type TingkatanInfo,
  type PeribahasaQuizResult,
} from "@/lib/peribahasa";

const ACCENT = "grape" as const;
const QUESTIONS_PER_QUIZ = 10;

const TINGKATAN_EMOJIS: Record<number, string> = {
  1: "📖",
  2: "📚",
  3: "📜",
};

const TINGKATAN_LABELS: Record<number, string> = {
  1: "Tingkatan 1",
  2: "Tingkatan 2",
  3: "Tingkatan 3",
};

type Screen = "picker" | "quiz" | "results";

interface AnswerRecord {
  question_id: string;
  given_answer: string;
  is_correct: boolean;
  response_time_ms: number;
}

/** Parse options — handles both string[] and JSON-encoded string. */
function parseOptions(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // Each element could itself be a JSON string (Supabase stores JSONB as string sometimes)
    if (raw.length === 1 && raw[0].startsWith("[")) {
      try {
        return JSON.parse(raw[0]) as string[];
      } catch {
        return raw;
      }
    }
    return raw;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // not JSON, return as single option
    }
    return [raw];
  }
  return [];
}

export default function PeribahasaPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  // Peribahasa is available to ALL children
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz } = useChild(id);
  const [screen, setScreen] = useState<Screen>("picker");
  const [tingkatanList, setTingkatanList] = useState<TingkatanInfo[]>([]);
  const [pastResults, setPastResults] = useState<PeribahasaQuizResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Quiz state
  const [activeTingkatan, setActiveTingkatan] = useState<number>(1);
  const [questions, setQuestions] = useState<PeribahasaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  // Results state
  const [resultPoints, setResultPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load tingkatan info on mount
  useEffect(() => {
    if (!hydrated) return;
    setLoadingData(true);
    Promise.all([fetchPeribahasaTingkatan(), fetchPeribahasaResults(id)]).then(
      ([tList, results]) => {
        setTingkatanList(tList);
        setPastResults(results);
        setLoadingData(false);
      },
    );
  }, [hydrated, id]);

  const c = COLOR_CLASSES[ACCENT];

  // Start quiz for a tingkatan
  const startQuiz = useCallback(
    async (tingkatan: number) => {
      const allQs = await fetchPeribahasaQuestions(tingkatan);
      if (allQs.length === 0) return;
      // Take random subset (already shuffled by the lib)
      const qs = allQs.slice(0, QUESTIONS_PER_QUIZ);
      setActiveTingkatan(tingkatan);
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartRef.current = Date.now();
      quizStartRef.current = Date.now();
      setScreen("quiz");
    },
    [],
  );

  // Submit answer for current question
  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showExplanation) return;
    const q = questions[currentIdx];
    const opts = parseOptions(q.options);
    const selectedIdx = selectedAnswer.charCodeAt(0) - 65;
    const selectedOptText = opts[selectedIdx] || "";
    const isCorrect =
      selectedOptText.trim().toLowerCase() ===
      q.correct_answer.trim().toLowerCase();
    const responseTimeMs = Date.now() - questionStartRef.current;

    setAnswers((prev) => [
      ...prev,
      {
        question_id: q.id,
        given_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs,
      },
    ]);
    setShowExplanation(true);
  }, [selectedAnswer, showExplanation, questions, currentIdx]);

  // Move to next question or finish
  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartRef.current = Date.now();
    } else {
      // Quiz complete — calculate and save
      const correctCount = answers.filter((a) => a.is_correct).length;
      const totalDurationSec = Math.round(
        (Date.now() - quizStartRef.current) / 1000,
      );
      const pointsEarned =
        correctCount * 10 +
        (correctCount === questions.length ? questions.length * 5 : 0);

      // Record to the SifirKids points economy
      recordQuiz({
        module: "peribahasa",
        topic: `tingkatan-${activeTingkatan}`,
        total: questions.length,
        correct: correctCount,
        durationSec: totalDurationSec,
        bestStreak: calcBestStreak(answers),
      });

      // Save to Supabase peribahasa tables
      logPeribahasaResult({
        child_id: id,
        tingkatan: activeTingkatan,
        total_questions: questions.length,
        correct_answers: correctCount,
        duration_sec: totalDurationSec,
        points_earned: pointsEarned,
      }).then((resultId) => {
        if (resultId) {
          logPeribahasaAnswers(resultId, answers);
        }
      });

      setResultPoints(pointsEarned);
      setShowConfetti(correctCount === questions.length);
      setScreen("results");
    }
  }, [currentIdx, questions, answers, activeTingkatan, recordQuiz, id]);

  if (!hydrated || loadingData) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={screen === "picker" ? `/play/${id}` : undefined} />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={c.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ======================== TINGKATAN PICKER ======================== */
  if (screen === "picker") {
    return (
      <PageShell>
        {header}
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-grape-600">
          Peribahasa 📖
        </h1>
        <p className="mb-6 text-center font-display text-lg text-ink/70">
          Pilih tingkatan untuk kuiz
        </p>

        <div className="flex flex-col gap-3">
          {tingkatanList.length === 0 ? (
            <Card className="py-10 text-center">
              <p className="font-display text-xl text-ink/50">
                Soalan belum dimuat naik lagi...
              </p>
              <p className="mt-2 text-sm text-ink/40">
                Questions are being loaded into the database
              </p>
            </Card>
          ) : (
            tingkatanList.map((t, i) => {
              const tingkatanResults = pastResults.filter(
                (r) => r.tingkatan === t.tingkatan,
              );
              const bestResult =
                tingkatanResults.length > 0
                  ? tingkatanResults.reduce((best, r) =>
                      r.correct_answers / r.total_questions >
                      best.correct_answers / best.total_questions
                        ? r
                        : best,
                    )
                  : null;
              const bestPct = bestResult
                ? pct(bestResult.correct_answers, bestResult.total_questions)
                : null;
              const attempted = tingkatanResults.length > 0;

              return (
                <button
                  key={t.tingkatan}
                  onClick={() => startQuiz(t.tingkatan)}
                  className={cn(
                    "btn-pop tap animate-rise flex items-center gap-4 rounded-[var(--radius-blob)] p-5 text-left shadow-[var(--shadow-pop)]",
                    attempted ? "bg-grape-100" : "bg-white/85",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grape-500 text-2xl text-white">
                    {TINGKATAN_EMOJIS[t.tingkatan] ?? "📖"}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-sm font-bold text-grape-600">
                      T{t.tingkatan}
                    </div>
                    <div className="font-display text-base font-bold text-ink">
                      {TINGKATAN_LABELS[t.tingkatan] ??
                        `Tingkatan ${t.tingkatan}`}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-ink/50">
                      {t.questionCount} soalan
                      {bestPct !== null && (
                        <span className="ml-2 text-grape-600">
                          Terbaik: {bestPct}%
                        </span>
                      )}
                    </div>
                  </div>
                  {attempted && (
                    <span className="text-2xl">
                      {bestPct !== null && bestPct >= 80 ? "⭐" : "✓"}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PageShell>
    );
  }

  /* =============================== QUIZ ============================== */
  if (screen === "quiz" && questions.length > 0) {
    const q = questions[currentIdx];
    const progress = pct(currentIdx + 1, questions.length);
    const alreadyAnswered = showExplanation;
    const lastAnswer = answers[answers.length - 1];
    const wasCorrect = alreadyAnswered && lastAnswer?.is_correct;
    const opts = parseOptions(q.options);

    return (
      <PageShell>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Keluar dari kuiz?")) setScreen("picker");
            }}
            className="tap inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-[var(--shadow-pop)] btn-pop"
            aria-label="Quit quiz"
          >
            ✕
          </button>
          <div className="font-display text-sm font-bold text-ink/60">
            T{activeTingkatan} • Soalan {currentIdx + 1}/{questions.length}
          </div>
          <div className="w-12" />
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-grape-500 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Difficulty badge */}
        <div className="mb-3 flex justify-center">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold uppercase",
              q.difficulty === "easy"
                ? "bg-leaf-400 text-white"
                : q.difficulty === "kbat"
                  ? "bg-coral-500 text-white"
                  : "bg-sunny-400 text-ink",
            )}
          >
            {q.difficulty === "easy"
              ? "Mudah"
              : q.difficulty === "kbat"
                ? "KBAT"
                : "Standard"}
          </span>
        </div>

        {/* Question card */}
        <Card className="mb-4">
          <p className="font-display text-xl font-bold leading-snug text-ink">
            {q.question_text}
          </p>
          {/* Show the peribahasa below the question for context only after answering */}
          {alreadyAnswered && q.peribahasa && q.question_type !== "fill_blank" && (
            <p className="mt-2 text-sm italic text-grape-600">
              &ldquo;{q.peribahasa}&rdquo;
            </p>
          )}
        </Card>

        {/* Answer options — MCQ */}
        <div className="mb-4 flex flex-col gap-2">
          {opts.map((opt, i) => {
            const letter = String.fromCharCode(65 + i); // A, B, C, D
            const isSelected = selectedAnswer === letter;
            const isCorrectOpt =
              letter === q.correct_answer ||
              opt.trim().toLowerCase() ===
                q.correct_answer.trim().toLowerCase();
            const showResult = alreadyAnswered;

            return (
              <button
                key={i}
                onClick={() => !alreadyAnswered && setSelectedAnswer(letter)}
                disabled={alreadyAnswered}
                className={cn(
                  "tap flex items-center gap-3 rounded-2xl px-5 py-4 text-left font-display text-base font-semibold transition-all",
                  showResult && isCorrectOpt
                    ? "bg-leaf-400 text-white ring-2 ring-leaf-500"
                    : showResult && isSelected && !isCorrectOpt
                      ? "bg-coral-500 text-white ring-2 ring-coral-600"
                      : isSelected
                        ? "bg-grape-500 text-white ring-2 ring-grape-400"
                        : "bg-white/85 text-ink hover:bg-grape-100",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    showResult && isCorrectOpt
                      ? "bg-white/30 text-white"
                      : showResult && isSelected && !isCorrectOpt
                        ? "bg-white/30 text-white"
                        : isSelected
                          ? "bg-white/30 text-white"
                          : "bg-grape-100 text-grape-600",
                  )}
                >
                  {letter}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation after answering */}
        {alreadyAnswered && q.explanation && (
          <Card
            className={cn(
              "mb-4 animate-rise border-l-4",
              wasCorrect ? "border-leaf-400" : "border-coral-500",
            )}
          >
            <div className="mb-1 font-display text-sm font-bold text-ink/60">
              {wasCorrect ? "✅ Betul!" : `❌ Jawapan: ${q.correct_answer}`}
            </div>
            <p className="text-sm text-ink/80">{q.explanation}</p>
          </Card>
        )}

        {/* Maksud — always show after answering for learning */}
        {alreadyAnswered && q.maksud && (
          <Card className="mb-4 animate-rise bg-grape-50">
            <div className="mb-1 font-display text-sm font-bold text-grape-600">
              📖 Maksud Peribahasa
            </div>
            <p className="text-sm text-ink/80">{q.maksud}</p>
          </Card>
        )}

        {/* Submit / Next button */}
        {!alreadyAnswered ? (
          <Button
            color={ACCENT}
            size="xl"
            onClick={submitAnswer}
            disabled={!selectedAnswer}
            className="w-full"
          >
            Semak Jawapan ✓
          </Button>
        ) : (
          <Button
            color={ACCENT}
            size="xl"
            onClick={nextQuestion}
            className="w-full"
          >
            {currentIdx < questions.length - 1
              ? "Soalan Seterusnya →"
              : "Lihat Keputusan 🏆"}
          </Button>
        )}
      </PageShell>
    );
  }

  /* ============================= RESULTS ============================= */
  if (screen === "results") {
    const correctCount = answers.filter((a) => a.is_correct).length;
    const accuracy = pct(correctCount, questions.length);
    const perfect = correctCount === questions.length;
    const totalDurationSec = Math.round(
      (Date.now() - quizStartRef.current) / 1000,
    );

    return (
      <PageShell>
        <Confetti show={showConfetti} />
        {header}
        <Card className="flex flex-col items-center gap-4 py-8 text-center animate-pop">
          <span className="text-6xl">
            {perfect ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}
          </span>
          <h1 className="font-display text-3xl font-bold text-grape-600">
            {perfect
              ? "Sempurna!"
              : accuracy >= 70
                ? "Bagus!"
                : "Teruskan usaha!"}
          </h1>
          <p className="font-display text-base text-ink/60">
            {TINGKATAN_LABELS[activeTingkatan] ??
              `Tingkatan ${activeTingkatan}`}{" "}
            • Peribahasa
          </p>

          <div className="font-display text-6xl font-bold text-ink">
            {correctCount}
            <span className="text-3xl text-ink/50">
              {" "}
              / {questions.length}
            </span>
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            <div className="rounded-2xl bg-grape-100 p-3">
              <div className="font-display text-2xl font-bold text-grape-600">
                {accuracy}%
              </div>
              <div className="text-xs font-semibold text-ink/60">Ketepatan</div>
            </div>
            <div className="rounded-2xl bg-sunny-100 p-3">
              <div className="font-display text-2xl font-bold text-sunny-600">
                +{resultPoints}
              </div>
              <div className="text-xs font-semibold text-ink/60">Mata</div>
            </div>
            <div className="rounded-2xl bg-teal-100 p-3">
              <div className="font-display text-2xl font-bold text-teal-600">
                {Math.floor(totalDurationSec / 60)}:
                {String(totalDurationSec % 60).padStart(2, "0")}
              </div>
              <div className="text-xs font-semibold text-ink/60">Masa</div>
            </div>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            <Button
              color={ACCENT}
              size="xl"
              onClick={() => startQuiz(activeTingkatan)}
            >
              Cuba Lagi 🔁
            </Button>
            <Button
              color={ACCENT}
              variant="soft"
              size="lg"
              onClick={() => {
                // Refresh results
                fetchPeribahasaResults(id).then(setPastResults);
                setScreen("picker");
              }}
            >
              Pilih Tingkatan Lain
            </Button>
            <Link
              href={`/play/${id}`}
              role="button"
              className="btn-pop tap inline-flex min-h-[44px] items-center justify-center rounded-full bg-transparent px-5 py-3 font-display text-lg font-semibold text-grape-600"
            >
              🏠 Laman Utama
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  /* Fallback — should not reach here */
  return (
    <PageShell>
      {header}
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-xl text-ink/70">Memuat soalan...</p>
        <Button color={ACCENT} size="lg" onClick={() => setScreen("picker")}>
          Kembali
        </Button>
      </Card>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function calcBestStreak(answers: AnswerRecord[]): number {
  let best = 0;
  let current = 0;
  for (const a of answers) {
    if (a.is_correct) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}
