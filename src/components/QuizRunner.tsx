"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COLOR_CLASSES, GRADE_LABEL } from "@/lib/data";
import type { ChildId, Grade } from "@/lib/types";
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
  fetchResults,
  logResult,
  logAnswers,
  asModuleId,
  type SubjectDef,
  type ModuleQuestion,
  type ModuleQuizResult,
  type ChapterInfo,
  type QuizMode,
} from "@/lib/modules";

const CHAPTER_EMOJIS = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "🧪", "🌟", "🏆"];

type Screen = "chapters" | "quiz" | "results";

interface AnswerRecord {
  question_id: string;
  given_answer: string;
  is_correct: boolean;
  response_time_ms: number;
}

export default function QuizRunner({
  childId,
  subject,
  grade,
}: {
  childId: ChildId;
  subject: SubjectDef;
  grade: Grade;
}) {
  const { child, hydrated, recordQuiz } = useChild(childId);
  const accent = subject.color;
  const c = COLOR_CLASSES[accent];

  const [screen, setScreen] = useState<Screen>("chapters");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [pastResults, setPastResults] = useState<ModuleQuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [activeChapter, setActiveChapter] = useState(1);
  const [activeTitle, setActiveTitle] = useState("");
  const [quizMode, setQuizMode] = useState<QuizMode>("quick");
  const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  // Results
  const [resultPoints, setResultPoints] = useState(0);
  const [resultDuration, setResultDuration] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    Promise.all([
      fetchChapters(subject.key, grade),
      fetchResults(childId, subject.key, grade),
    ]).then(([ch, results]) => {
      setChapters(ch);
      setPastResults(results);
      setLoading(false);
    });
  }, [hydrated, subject.key, grade, childId]);

  const startQuiz = useCallback(
    async (chapter: number, title: string) => {
      const qs = await fetchQuestions(subject.key, grade, chapter, quizMode, childId);
      if (qs.length === 0) return;
      setActiveChapter(chapter);
      setActiveTitle(title);
      setQuestions(qs);
      setCurrentIdx(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartRef.current = Date.now();
      quizStartRef.current = Date.now();
      setScreen("quiz");
    },
    [subject.key, grade, quizMode, childId],
  );

  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showExplanation) return;
    const q = questions[currentIdx];
    const isCorrect =
      selectedAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
    setAnswers((prev) => [
      ...prev,
      {
        question_id: q.id,
        given_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: Date.now() - questionStartRef.current,
      },
    ]);
    setShowExplanation(true);
  }, [selectedAnswer, showExplanation, questions, currentIdx]);

  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      questionStartRef.current = Date.now();
      return;
    }
    // Finish
    const correctCount = answers.filter((a) => a.is_correct).length;
    const durationSec = Math.round((Date.now() - quizStartRef.current) / 1000);
    const bestStreak = calcBestStreak(answers);

    const outcome = recordQuiz({
      module: asModuleId(subject.key),
      topic: `${grade}-bab-${activeChapter}`,
      total: questions.length,
      correct: correctCount,
      durationSec,
      bestStreak,
      answers: answers.map((a) => {
        const q = questions.find((qq) => qq.id === a.question_id);
        return {
          question: q?.question_text ?? "",
          correctAnswer: q?.correct_answer ?? "",
          givenAnswer: a.given_answer,
          isCorrect: a.is_correct,
          responseTimeMs: a.response_time_ms,
        };
      }),
    });

    logResult({
      child_id: childId,
      module: subject.key,
      grade,
      chapter: activeChapter,
      total_questions: questions.length,
      correct_answers: correctCount,
      duration_sec: durationSec,
      points_earned: outcome.pointsEarned,
    }).then((resultId) => {
      if (resultId) logAnswers(resultId, answers);
    });

    setResultPoints(outcome.pointsEarned);
    setResultDuration(durationSec);
    setShowConfetti(correctCount === questions.length);
    setScreen("results");
  }, [
    currentIdx,
    questions,
    answers,
    activeChapter,
    grade,
    subject.key,
    childId,
    recordQuiz,
  ]);

  if (!hydrated || loading) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={screen === "chapters" ? `/play/${childId}` : undefined} />
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
        <h1 className={cn("mb-1 text-center font-display text-3xl font-bold", c.text)}>
          {subject.emoji} {subject.title}
        </h1>
        <p className="mb-4 text-center font-display text-lg text-ink/70">
          {GRADE_LABEL[grade]} — pilih topik untuk kuiz
        </p>

        {/* Quiz mode toggle */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <button
            onClick={() => setQuizMode("quick")}
            className={cn(
              "tap rounded-full px-4 py-2 font-display text-sm font-bold transition-all",
              quizMode === "quick"
                ? cn(c.bg, "scale-105 text-white shadow-lg")
                : "bg-white/70 text-ink/60",
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
                ? cn(c.bg, "scale-105 text-white shadow-lg")
                : "bg-white/70 text-ink/60",
            )}
          >
            📝 Semua Soalan
          </button>
        </div>

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
                Jalankan skrip seed untuk {subject.title} ({GRADE_LABEL[grade]}).
              </p>
            </Card>
          ) : (
            chapters.map((ch, i) => {
              const results = pastResults.filter((r) => r.chapter === ch.chapter);
              const best =
                results.length > 0
                  ? results.reduce((b, r) =>
                      r.correct_answers / r.total_questions >
                      b.correct_answers / b.total_questions
                        ? r
                        : b,
                    )
                  : null;
              const bestPct = best
                ? pct(best.correct_answers, best.total_questions)
                : null;
              const attempted = results.length > 0;

              return (
                <button
                  key={ch.chapter}
                  onClick={() => startQuiz(ch.chapter, ch.chapter_title)}
                  className={cn(
                    "btn-pop tap animate-rise flex items-center gap-4 rounded-[var(--radius-blob)] p-5 text-left shadow-[var(--shadow-pop)]",
                    attempted ? c.bgSoft : "bg-white/85",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white",
                      c.bg,
                    )}
                  >
                    {CHAPTER_EMOJIS[(ch.chapter - 1) % CHAPTER_EMOJIS.length]}
                  </span>
                  <div className="flex-1">
                    <div className={cn("font-display text-sm font-bold", c.text)}>
                      Topik {ch.chapter}
                    </div>
                    <div className="font-display text-base font-bold text-ink">
                      {ch.chapter_title}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-ink/50">
                      {ch.questionCount} soalan
                      {bestPct !== null && (
                        <span className={cn("ml-2", c.text)}>Terbaik: {bestPct}%</span>
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
    const answered = showExplanation;
    const lastAnswer = answers[answers.length - 1];
    const wasCorrect = answered && lastAnswer?.is_correct;

    return (
      <PageShell>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Keluar dari kuiz?")) setScreen("chapters");
            }}
            className="btn-pop tap inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-[var(--shadow-pop)]"
            aria-label="Quit quiz"
          >
            ✕
          </button>
          <div className="font-display text-sm font-bold text-ink/60">
            Soalan {currentIdx + 1}/{questions.length}
            <span className="ml-1 text-xs opacity-60">
              {quizMode === "quick" ? "⚡" : "📝"}
            </span>
          </div>
          <div className="w-12" />
        </div>

        <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", c.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>

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
            {q.difficulty === "easy" ? "Mudah" : q.difficulty === "kbat" ? "KBAT" : "Standard"}
          </span>
        </div>

        <Card className="mb-4">
          <p className="font-display text-xl font-bold leading-snug text-ink">
            {q.question_text}
          </p>
        </Card>

        <div className="mb-4 flex flex-col gap-2">
          {q.question_type === "mcq" &&
            q.options?.map((opt, i) => {
              const letter = opt.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrectOpt = letter === q.correct_answer;
              const showResult = answered;
              return (
                <button
                  key={i}
                  onClick={() => !answered && setSelectedAnswer(letter)}
                  disabled={answered}
                  className={cn(
                    "tap flex items-center gap-3 rounded-2xl px-5 py-4 text-left font-display text-base font-semibold transition-all",
                    showResult && isCorrectOpt
                      ? "bg-leaf-400 text-white ring-2 ring-leaf-500"
                      : showResult && isSelected && !isCorrectOpt
                        ? "bg-coral-500 text-white ring-2 ring-coral-600"
                        : isSelected
                          ? cn(c.bg, "text-white")
                          : "bg-white/85 text-ink",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-bold">
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
                const showResult = answered;
                return (
                  <button
                    key={opt}
                    onClick={() => !answered && setSelectedAnswer(opt)}
                    disabled={answered}
                    className={cn(
                      "tap btn-pop flex flex-col items-center gap-2 rounded-[var(--radius-blob)] py-6 font-display text-xl font-bold",
                      showResult && isCorrectOpt
                        ? "bg-leaf-400 text-white"
                        : showResult && isSelected && !isCorrectOpt
                          ? "bg-coral-500 text-white"
                          : isSelected
                            ? cn(c.bg, "text-white")
                            : "bg-white/85 text-ink",
                    )}
                  >
                    <span className="text-3xl">{opt === "Betul" ? "✅" : "❌"}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.question_type === "fill_blank" && (
            <input
              type="text"
              value={selectedAnswer ?? ""}
              onChange={(e) => !answered && setSelectedAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              disabled={answered}
              placeholder="Taipkan jawapan..."
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-3 font-display text-lg font-semibold outline-none",
                answered
                  ? lastAnswer?.is_correct
                    ? "border-leaf-400 bg-leaf-400/10"
                    : "border-coral-500 bg-coral-500/10"
                  : cn(c.border, "bg-white"),
              )}
            />
          )}
        </div>

        {answered && q.explanation && (
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

        {!answered ? (
          <Button
            color={accent}
            size="xl"
            onClick={submitAnswer}
            disabled={!selectedAnswer}
            className="w-full"
          >
            Semak Jawapan ✓
          </Button>
        ) : (
          <Button color={accent} size="xl" onClick={nextQuestion} className="w-full">
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
    const durationSec = resultDuration;

    return (
      <PageShell>
        <Confetti show={showConfetti} />
        {header}
        <Card className="flex animate-pop flex-col items-center gap-4 py-8 text-center">
          <span className="text-6xl">
            {perfect ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}
          </span>
          <h1 className={cn("font-display text-3xl font-bold", c.text)}>
            {perfect ? "Sempurna!" : accuracy >= 70 ? "Bagus!" : "Teruskan usaha!"}
          </h1>
          <p className="font-display text-base text-ink/60">
            {subject.title}: {activeTitle}
          </p>

          <div className="font-display text-6xl font-bold text-ink">
            {correctCount}
            <span className="text-3xl text-ink/50"> / {questions.length}</span>
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            <div className={cn("rounded-2xl p-3", c.bgSoft)}>
              <div className={cn("font-display text-2xl font-bold", c.text)}>{accuracy}%</div>
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
                {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, "0")}
              </div>
              <div className="text-xs font-semibold text-ink/60">Masa</div>
            </div>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            <Button
              color={accent}
              size="xl"
              onClick={() => startQuiz(activeChapter, activeTitle)}
            >
              Cuba Lagi 🔁
            </Button>
            <Button
              color={accent}
              variant="soft"
              size="lg"
              onClick={() => {
                fetchResults(childId, subject.key, grade).then(setPastResults);
                setScreen("chapters");
              }}
            >
              Pilih Topik Lain
            </Button>
            <Link
              href={`/play/${childId}`}
              role="button"
              className={cn(
                "btn-pop tap inline-flex min-h-[44px] items-center justify-center rounded-full bg-transparent px-5 py-3 font-display text-lg font-semibold",
                c.text,
              )}
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
        <Button color={accent} size="lg" onClick={() => setScreen("chapters")}>
          Kembali
        </Button>
      </Card>
    </PageShell>
  );
}

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
