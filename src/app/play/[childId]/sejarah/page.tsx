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
  fetchChapters,
  fetchQuestions,
  fetchQuizResults,
  logSejarahQuiz,
  logVocabGap,
  type SejarahQuestion,
  type ChapterInfo,
  type SejarahQuizResult,
  type QuizMode,
} from "@/lib/sejarah";

const ACCENT = "teal" as const; // Dhiya's color

const CHAPTER_EMOJIS: Record<number, string> = {
  1: "⚓",
  2: "🏝️",
  3: "🏛️",
  4: "👑",
  5: "🌴",
  6: "🚂",
  7: "⚔️",
  8: "🤝",
};

const CHAPTER_SHORT: Record<number, string> = {
  1: "Kedatangan Kuasa Barat",
  2: "Negeri-Negeri Selat",
  3: "NNMB",
  4: "NNMTB",
  5: "Sarawak & Sabah",
  6: "Kesan Ekonomi & Sosial",
  7: "Penentangan Tempatan",
  8: "Kebijaksanaan Raja Melayu",
};

type Screen = "chapters" | "quiz" | "results";

interface AnswerRecord {
  question_id: string;
  given_answer: string;
  is_correct: boolean;
  response_time_ms: number;
}

interface VocabEntry {
  word: string;
  question_id: string | null;
  context: string | null;
}

export default function SejarahPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  // Sejarah is Dhiya-only
  if (childId !== "dhiya") notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz } = useChild(id);
  const [screen, setScreen] = useState<Screen>("chapters");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [pastResults, setPastResults] = useState<SejarahQuizResult[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  // Quiz state
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [quizMode, setQuizMode] = useState<QuizMode>("quick");
  const [questions, setQuestions] = useState<SejarahQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [vocabGaps, setVocabGaps] = useState<VocabEntry[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [vocabInput, setVocabInput] = useState("");
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  // Results state
  const [resultPoints, setResultPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load chapters on mount
  useEffect(() => {
    if (!hydrated) return;
    setLoadingChapters(true);
    Promise.all([fetchChapters(), fetchQuizResults("dhiya")]).then(
      ([ch, results]) => {
        setChapters(ch);
        setPastResults(results);
        setLoadingChapters(false);
      },
    );
  }, [hydrated]);

  const c = COLOR_CLASSES[ACCENT];

  // Start quiz for a chapter
  const startQuiz = useCallback(async (chapter: number) => {
    const qs = await fetchQuestions(chapter, quizMode, id);
    if (qs.length === 0) return;
    setActiveChapter(chapter);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setVocabGaps([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setVocabInput("");
    questionStartRef.current = Date.now();
    quizStartRef.current = Date.now();
    setScreen("quiz");
  }, [quizMode, id]);

  // Submit answer for current question
  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showExplanation) return;
    const q = questions[currentIdx];
    const isCorrect =
      selectedAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
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

  // Save vocab gap for current question
  const saveVocabGap = useCallback(() => {
    const word = vocabInput.trim();
    if (!word) return;
    const q = questions[currentIdx];
    const entry: VocabEntry = {
      word,
      question_id: q.id,
      context: q.question_text,
    };
    setVocabGaps((prev) => [...prev, entry]);
    // Fire and forget to Supabase
    logVocabGap({
      child_id: "dhiya",
      question_id: q.id,
      word,
      chapter: activeChapter,
      context: q.question_text,
    });
    setVocabInput("");
  }, [vocabInput, questions, currentIdx, activeChapter]);

  // Move to next question or finish
  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setVocabInput("");
      questionStartRef.current = Date.now();
    } else {
      // Quiz complete - calculate and save
      const correctCount = answers.filter((a) => a.is_correct).length;
      const totalDurationSec = Math.round((Date.now() - quizStartRef.current) / 1000);
      const pointsEarned = correctCount * 10 + (correctCount === questions.length ? questions.length * 5 : 0);

      // Record to the SifirKids points economy
      recordQuiz({
        module: "sejarah",
        topic: `bab-${activeChapter}`,
        total: questions.length,
        correct: correctCount,
        durationSec: totalDurationSec,
        bestStreak: calcBestStreak(answers),
      });

      // Save to Supabase sejarah tables
      logSejarahQuiz(
        {
          child_id: "dhiya",
          chapter: activeChapter,
          total_questions: questions.length,
          correct_answers: correctCount,
          duration_sec: totalDurationSec,
          points_earned: pointsEarned,
          vocab_gaps_logged: vocabGaps.length,
        },
        answers,
      );

      setResultPoints(pointsEarned);
      setShowConfetti(correctCount === questions.length);
      setScreen("results");
    }
  }, [currentIdx, questions, answers, activeChapter, vocabGaps, recordQuiz]);

  if (!hydrated || loadingChapters) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={screen === "chapters" ? `/play/${id}` : undefined} />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={c.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ========================= CHAPTER PICKER ========================= */
  if (screen === "chapters") {
    return (
      <PageShell>
        {header}
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-teal-600">
          Sejarah Tingkatan 3 📜
        </h1>
        <p className="mb-4 text-center font-display text-lg text-ink/70">
          Pilih bab untuk kuiz
        </p>

        {/* Quiz Mode Toggle */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <button
            onClick={() => setQuizMode("quick")}
            className={cn(
              "tap rounded-full px-4 py-2 font-display text-sm font-bold transition-all",
              quizMode === "quick"
                ? "bg-teal-500 text-white shadow-lg scale-105"
                : "bg-white/70 text-ink/60 hover:bg-teal-50",
            )}
          >
            ⚡ Kuiz Pantas
            <span className="ml-1 text-xs opacity-80">(10 soalan)</span>
          </button>
          <button
            onClick={() => setQuizMode("full")}
            className={cn(
              "tap rounded-full px-4 py-2 font-display text-sm font-bold transition-all",
              quizMode === "full"
                ? "bg-teal-500 text-white shadow-lg scale-105"
                : "bg-white/70 text-ink/60 hover:bg-teal-50",
            )}
          >
            📝 Peperiksaan Penuh
            <span className="ml-1 text-xs opacity-80">(semua)</span>
          </button>
        </div>

        {/* Smart prioritization hint */}
        <p className="mb-4 text-center text-xs text-ink/40">
          ✨ Soalan yang belum pernah dijawab akan diutamakan
        </p>

        <div className="flex flex-col gap-3">
          {chapters.length === 0 ? (
            <Card className="py-10 text-center">
              <p className="font-display text-xl text-ink/50">
                Soalan belum dimuat naik lagi...
              </p>
              <p className="mt-2 text-sm text-ink/40">
                Questions are being loaded into the database
              </p>
            </Card>
          ) : (
            chapters.map((ch, i) => {
              const chapterResults = pastResults.filter(
                (r) => r.chapter === ch.chapter,
              );
              const bestResult = chapterResults.length > 0
                ? chapterResults.reduce((best, r) =>
                    r.correct_answers / r.total_questions >
                    best.correct_answers / best.total_questions
                      ? r
                      : best,
                  )
                : null;
              const bestPct = bestResult
                ? pct(bestResult.correct_answers, bestResult.total_questions)
                : null;
              const attempted = chapterResults.length > 0;

              return (
                <button
                  key={ch.chapter}
                  onClick={() => startQuiz(ch.chapter)}
                  className={cn(
                    "btn-pop tap animate-rise flex items-center gap-4 rounded-[var(--radius-blob)] p-5 text-left shadow-[var(--shadow-pop)]",
                    attempted ? "bg-teal-100" : "bg-white/85",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-2xl text-white">
                    {CHAPTER_EMOJIS[ch.chapter] ?? "📖"}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-sm font-bold text-teal-600">
                      Bab {ch.chapter}
                    </div>
                    <div className="font-display text-base font-bold text-ink">
                      {CHAPTER_SHORT[ch.chapter] ?? ch.chapter_title}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-ink/50">
                      {ch.questionCount} soalan
                      {bestPct !== null && (
                        <span className="ml-2 text-teal-600">
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

  /* ============================= QUIZ ============================== */
  if (screen === "quiz" && questions.length > 0) {
    const q = questions[currentIdx];
    const progress = pct(currentIdx + 1, questions.length);
    const alreadyAnswered = showExplanation;
    const lastAnswer = answers[answers.length - 1];
    const wasCorrect = alreadyAnswered && lastAnswer?.is_correct;

    return (
      <PageShell>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Keluar dari kuiz?")) setScreen("chapters");
            }}
            className="tap inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-[var(--shadow-pop)] btn-pop"
            aria-label="Quit quiz"
          >
            ✕
          </button>
          <div className="font-display text-sm font-bold text-ink/60">
            Bab {activeChapter} • Soalan {currentIdx + 1}/{questions.length}
            <span className="ml-1 text-xs opacity-60">
              {quizMode === "quick" ? "⚡" : "📝"}
            </span>
          </div>
          <div className="w-12" />
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-teal-500 transition-[width] duration-500 ease-out"
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
          {/* Image if present */}
          {q.image_url && (
            <div className="mb-4 overflow-hidden rounded-2xl">
              <img
                src={q.image_url}
                alt="Soalan bergambar"
                className="w-full object-contain"
                style={{ maxHeight: 240 }}
              />
            </div>
          )}

          <p className="font-display text-xl font-bold leading-snug text-ink">
            {q.question_text}
          </p>
        </Card>

        {/* Answer options */}
        <div className="mb-4 flex flex-col gap-2">
          {q.question_type === "mcq" &&
            q.options?.map((opt, i) => {
              const letter = opt.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrectOpt = letter === q.correct_answer;
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
                          ? "bg-teal-500 text-white ring-2 ring-teal-400"
                          : "bg-white/85 text-ink hover:bg-teal-100",
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
                            : "bg-teal-100 text-teal-600",
                    )}
                  >
                    {letter}
                  </span>
                  <span>{opt.slice(3)}</span>
                </button>
              );
            })}

          {q.question_type === "true_false" && (
            <div className="grid grid-cols-2 gap-3">
              {["Betul", "Salah"].map((opt) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = opt === q.correct_answer;
                const showResult = alreadyAnswered;

                return (
                  <button
                    key={opt}
                    onClick={() => !alreadyAnswered && setSelectedAnswer(opt)}
                    disabled={alreadyAnswered}
                    className={cn(
                      "tap btn-pop flex flex-col items-center gap-2 rounded-[var(--radius-blob)] py-6 font-display text-xl font-bold",
                      showResult && isCorrectOpt
                        ? "bg-leaf-400 text-white"
                        : showResult && isSelected && !isCorrectOpt
                          ? "bg-coral-500 text-white"
                          : isSelected
                            ? "bg-teal-500 text-white"
                            : "bg-white/85 text-ink hover:bg-teal-100",
                    )}
                  >
                    <span className="text-3xl">
                      {opt === "Betul" ? "✅" : "❌"}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.question_type === "fill_blank" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedAnswer ?? ""}
                onChange={(e) =>
                  !alreadyAnswered && setSelectedAnswer(e.target.value)
                }
                disabled={alreadyAnswered}
                placeholder="Taipkan jawapan..."
                className={cn(
                  "flex-1 rounded-2xl border-2 px-4 py-3 font-display text-lg font-semibold outline-none",
                  alreadyAnswered
                    ? lastAnswer?.is_correct
                      ? "border-leaf-400 bg-leaf-400/10"
                      : "border-coral-500 bg-coral-500/10"
                    : "border-teal-400 bg-white focus:ring-2 focus:ring-teal-400",
                )}
              />
            </div>
          )}
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

        {/* Perkataan Tak Paham input */}
        <Card className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="font-display text-sm font-bold text-ink/60">
              Perkataan yang tak paham?
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={vocabInput}
              onChange={(e) => setVocabInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveVocabGap()}
              placeholder="Tulis perkataan di sini..."
              className="flex-1 rounded-xl border-2 border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-ink outline-none placeholder:text-ink/30 focus:border-teal-400"
            />
            <button
              onClick={saveVocabGap}
              disabled={!vocabInput.trim()}
              className="tap rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Simpan
            </button>
          </div>
          {vocabGaps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {vocabGaps.map((v, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700"
                >
                  {v.word}
                </span>
              ))}
            </div>
          )}
        </Card>

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

  /* =========================== RESULTS ============================= */
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
          <h1 className="font-display text-3xl font-bold text-teal-600">
            {perfect
              ? "Sempurna!"
              : accuracy >= 70
                ? "Bagus!"
                : "Teruskan usaha!"}
          </h1>
          <p className="font-display text-base text-ink/60">
            Bab {activeChapter}: {CHAPTER_SHORT[activeChapter]}
          </p>

          <div className="font-display text-6xl font-bold text-ink">
            {correctCount}
            <span className="text-3xl text-ink/50">
              {" "}
              / {questions.length}
            </span>
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            <div className="rounded-2xl bg-teal-100 p-3">
              <div className="font-display text-2xl font-bold text-teal-600">
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
            <div className="rounded-2xl bg-grape-100 p-3">
              <div className="font-display text-2xl font-bold text-grape-600">
                {Math.floor(totalDurationSec / 60)}:{String(totalDurationSec % 60).padStart(2, "0")}
              </div>
              <div className="text-xs font-semibold text-ink/60">Masa</div>
            </div>
          </div>

          {/* Vocab gaps logged */}
          {vocabGaps.length > 0 && (
            <div className="w-full rounded-2xl bg-teal-50 p-4 text-left">
              <div className="mb-2 font-display text-sm font-bold text-teal-600">
                📝 Perkataan yang ditanda ({vocabGaps.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {vocabGaps.map((v, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-teal-200 px-2 py-1 text-xs font-semibold text-teal-800"
                  >
                    {v.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex w-full flex-col gap-3">
            <Button
              color={ACCENT}
              size="xl"
              onClick={() => startQuiz(activeChapter)}
            >
              Cuba Lagi 🔁
            </Button>
            <Button
              color={ACCENT}
              variant="soft"
              size="lg"
              onClick={() => {
                // Refresh results
                fetchQuizResults("dhiya").then(setPastResults);
                setScreen("chapters");
              }}
            >
              Pilih Bab Lain
            </Button>
            <Link
              href={`/play/${id}`}
              role="button"
              className="btn-pop tap inline-flex min-h-[44px] items-center justify-center rounded-full bg-transparent px-5 py-3 font-display text-lg font-semibold text-teal-600"
            >
              🏠 Laman Utama
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {header}
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-xl text-ink/70">Memuat soalan...</p>
        <Button color={ACCENT} size="lg" onClick={() => setScreen("chapters")}>
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
