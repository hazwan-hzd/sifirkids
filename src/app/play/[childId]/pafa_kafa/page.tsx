"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
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
  fetchChapters,
  fetchQuestions,
  fetchQuizResults,
  logPafaKafaQuiz,
  logTermGap,
  levelForChild,
  LEVEL_LABEL,
  type PafaKafaQuestion,
  type ChapterInfo,
  type PafaKafaQuizResult,
  type QuizMode,
} from "@/lib/pafakafa";

const ACCENT = "grape" as const;

const CHAPTER_EMOJIS: Record<number, string> = {
  1: "💬",
  2: "🕋",
  3: "💧",
  4: "💦",
  5: "🚿",
  6: "🧎",
  7: "👥",
  8: "🌙",
  9: "🤝",
  10: "🐪",
};

const CHAPTER_SHORT: Record<number, string> = {
  1: "Syahadah",
  2: "Rukun Islam & Iman",
  3: "Bersuci & Istinjak",
  4: "Wuduk & Tayamum",
  5: "Mandi Wajib",
  6: "Solat & Toma'ninah",
  7: "Solat Berjemaah",
  8: "Puasa Ramadan",
  9: "Adab & Akhlak",
  10: "Sirah Nabawiyah",
};

const CHAPTER_DESC: Record<number, string> = {
  1: "Dua Kalimah Syahadah, pengakuan iman, dan maknanya.",
  2: "Rukun Islam dan Rukun Iman sebagai asas ketauhidan Muslim.",
  3: "Hukum bersuci, najis, dan tata cara istinjak menggunakan air/benda kesat.",
  4: "Rukun, syarat, sunat wuduk serta amalan tayamum ketika tiada air.",
  5: "Sebab mandian wajib, rukun, sunat, dan kaedah mandi yang sah.",
  6: "Rukun solat fardu lima waktu, syarat sah, syarat wajib, dan toma'ninah.",
  7: "Keutamaan solat berjemaah, hukum, serta kedudukan makmum masbuk/muafik.",
  8: "Kewajipan berpuasa di bulan Ramadan, syarat wajib, syarat sah, rukun, dan perkara membatalkan puasa.",
  9: "Nilai murni, adab harian dengan keluarga, guru, rakan, serta adab masjid.",
  10: "Sejarah hidup Rasulullah SAW, kelahiran, kerasulan, hijrah, dan perjuangan menyebarkan Islam.",
};

type Screen = "chapters" | "quiz" | "results";

interface AnswerRecord {
  question_id: string;
  given_answer: string;
  is_correct: boolean;
  response_time_ms: number;
}

interface TermEntry {
  term: string;
  question_id: string | null;
  context: string | null;
}

export default function PafaKafaPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz, deductPoints } = useChild(id);
  const [screen, setScreen] = useState<Screen>("chapters");
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [pastResults, setPastResults] = useState<PafaKafaQuizResult[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  // Quiz state
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [quizMode, setQuizMode] = useState<QuizMode>("quick");
  const [questions, setQuestions] = useState<PafaKafaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [termGaps, setTermGaps] = useState<TermEntry[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [usedHint, setUsedHint] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  // Results state
  const [resultPoints, setResultPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const level = levelForChild(id);

  // Load chapters and history on mount
  useEffect(() => {
    if (!hydrated) return;
    setLoadingChapters(true);
    Promise.all([fetchChapters(level), fetchQuizResults(id)]).then(
      ([chList, results]) => {
        setChapters(chList);
        setPastResults(results);
        setLoadingChapters(false);
      },
    );
  }, [hydrated, level, id]);

  const c = COLOR_CLASSES[ACCENT];

  // Helper to calculate best streak
  const calcBestStreak = (recs: AnswerRecord[]) => {
    let max = 0;
    let curr = 0;
    for (const r of recs) {
      if (r.is_correct) {
        curr++;
        if (curr > max) max = curr;
      } else {
        curr = 0;
      }
    }
    return max;
  };

  /** Fisher-Yates shuffle (returns new array). */
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Start quiz for a chapter
  const startQuiz = useCallback(async (chapterNum: number) => {
    const qs = await fetchQuestions(level, chapterNum, quizMode, id);
    if (qs.length === 0) return;
    setActiveChapter(chapterNum);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setTermGaps([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTermInput("");
    setUsedHint(false);
    setShowHintConfirm(false);
    questionStartRef.current = Date.now();
    quizStartRef.current = Date.now();
    // Shuffle options for first question
    const firstQ = qs[0];
    if (firstQ && firstQ.options && firstQ.options.length > 0 && firstQ.question_type !== "true_false") {
      setShuffledOptions(shuffleArray(firstQ.options));
    } else {
      setShuffledOptions([]);
    }
    setScreen("quiz");
  }, [quizMode, id, level]);

  // Submit answer for current question
  const submitAnswer = useCallback(() => {
    if (!selectedAnswer || showExplanation) return;
    const q = questions[currentIdx];
    // Normalize Benar/Salah ↔ true/false for true_false questions
    const normalize = (val: string) => {
      const lower = val.trim().toLowerCase();
      if (lower === "benar") return "true";
      if (lower === "salah") return "false";
      return lower;
    };
    const isCorrect = normalize(selectedAnswer) === normalize(q.correct_answer);
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

  // Save term gap for current question
  const saveTermGap = useCallback(() => {
    const term = termInput.trim();
    if (!term) return;
    const q = questions[currentIdx];
    const entry: TermEntry = {
      term,
      question_id: q.id,
      context: q.question_text,
    };
    setTermGaps((prev) => [...prev, entry]);
    logTermGap({
      child_id: id,
      question_id: q.id,
      term,
      chapter: activeChapter,
      context: q.question_text,
    });
    setTermInput("");
  }, [termInput, questions, currentIdx, activeChapter, id]);

  // Move to next question or finish
  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTermInput("");
      setUsedHint(false);
      setShowHintConfirm(false);
      questionStartRef.current = Date.now();
      // Shuffle options for next question
      const nextQ = questions[currentIdx + 1];
      if (nextQ && nextQ.options && nextQ.options.length > 0 && nextQ.question_type !== "true_false") {
        setShuffledOptions(shuffleArray(nextQ.options));
      } else {
        setShuffledOptions([]);
      }
    } else {
      // Quiz complete - calculate and save
      const correctCount = answers.filter((a) => a.is_correct).length;
      const totalDurationSec = Math.round((Date.now() - quizStartRef.current) / 1000);
      const bestStreak = calcBestStreak(answers);

      // Record to the SifirKids points economy
      const outcome = recordQuiz({
        module: "pafa_kafa",
        topic: `bab-${activeChapter}`,
        total: questions.length,
        correct: correctCount,
        durationSec: totalDurationSec,
        bestStreak: bestStreak,
      });

      const pointsEarned = outcome.pointsEarned;

      // Save to Supabase PAFA/KAFA tables
      logPafaKafaQuiz(
        {
          child_id: id,
          level,
          chapter: activeChapter,
          total_questions: questions.length,
          correct_answers: correctCount,
          duration_sec: totalDurationSec,
          points_earned: pointsEarned,
          term_gaps_logged: termGaps.length,
        },
        answers,
      );

      setResultPoints(pointsEarned);
      setShowConfetti(correctCount === questions.length);
      setScreen("results");
    }
  }, [currentIdx, questions, answers, activeChapter, termGaps, recordQuiz, id, level]);

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
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-grape-600">
          Fardu Ain (PAFA/KAFA) {LEVEL_LABEL[level]} 🕌
        </h1>
        <p className="mb-6 text-center font-display text-lg text-ink/70">
          Pilih bab untuk memulakan kuiz
        </p>

        {/* Quick/Full Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-ink/5">
            <button
              onClick={() => setQuizMode("quick")}
              className={cn(
                "px-4 py-2 font-display text-sm font-semibold rounded-xl transition-all",
                quizMode === "quick"
                  ? "bg-grape-500 text-white shadow-sm"
                  : "text-ink/65 hover:text-ink"
              )}
            >
              Mode Cepat (10 Soalan)
            </button>
            <button
              onClick={() => setQuizMode("full")}
              className={cn(
                "px-4 py-2 font-display text-sm font-semibold rounded-xl transition-all",
                quizMode === "full"
                  ? "bg-grape-500 text-white shadow-sm"
                  : "text-ink/65 hover:text-ink"
              )}
            >
              Semua Soalan
            </button>
          </div>
        </div>

        {/* Grid list of chapters */}
        <div className="grid gap-4 sm:grid-cols-2">
          {chapters.map((ch) => {
            const shortName = CHAPTER_SHORT[ch.chapter] || ch.chapter_title;
            const desc = CHAPTER_DESC[ch.chapter] || "Latihan kuiz interaktif.";
            const emoji = CHAPTER_EMOJIS[ch.chapter] || "🕌";
            const levelResults = pastResults.filter((r) => r.chapter === ch.chapter);
            const highResult = levelResults.reduce(
              (acc, r) => (r.correct_answers > acc ? r.correct_answers : acc),
              0
            );

            return (
              <Card
                key={ch.chapter}
                onClick={() => startQuiz(ch.chapter)}
                className="flex flex-col justify-between border border-ink/5 bg-white p-5 text-left transition-transform active:scale-98"
              >
                <div>
                  <span className="mb-3 block text-5xl">{emoji}</span>
                  <h3 className="font-display text-xl font-bold text-ink">
                    Bab {ch.chapter}: {shortName}
                  </h3>
                  <p className="mt-2 text-sm text-ink/75 leading-relaxed">{desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                  <span className="font-display text-xs font-semibold text-ink/50">
                    {ch.questionCount} Soalan Tersedia
                  </span>
                  {levelResults.length > 0 && (
                    <span className="font-display text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Skor Terbaik: {highResult}/{ch.questionCount > 10 && quizMode === "quick" ? 10 : ch.questionCount}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </PageShell>
    );
  }

  /* ========================= ACTIVE QUIZ SCREEN ========================= */
  if (screen === "quiz") {
    const q = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const progress = Math.round((currentIdx / questions.length) * 100);

    const checkAnswerDisabled = !selectedAnswer || showExplanation;

    return (
      <PageShell>
        {/* Confetti if all correct and finished */}
        <Confetti show={showConfetti} />

        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Adakah anda ingin keluar dari kuiz? Progres semasa tidak disimpan.")) {
                setScreen("chapters");
              }
            }}
            className="text-ink/60"
          >
            ❌ Keluar
          </Button>
          <div className="flex-1 px-4">
            <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-grape-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="font-display font-bold text-ink/70">
            {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* Question Text */}
        <Card className="mb-6 bg-white p-6 shadow-sm border border-ink/5">
          <div className="mb-3 flex gap-2">
            <span className="rounded-full bg-grape-100 px-3 py-1 font-display text-xs font-bold text-grape-700 capitalize">
              {q.difficulty}
            </span>
            {q.tags?.map((t) => (
              <span key={t} className="rounded-full bg-ink/5 px-3 py-1 font-display text-xs text-ink/60">
                #{t}
              </span>
            ))}
          </div>
          <h2 className="font-display text-xl font-bold text-ink leading-relaxed whitespace-pre-line">
            {q.question_text}
          </h2>
        </Card>

        {/* Question Inputs */}
        <div className="grid gap-3 mb-6">
          {/* MCQ / True-False Mode */}
          {q.question_type !== "fill_blank" && (() => {
            // For true_false with null options, provide fallback Benar/Salah
            const displayOptions = q.question_type === "true_false"
              ? ["Benar", "Salah"]
              : shuffledOptions.length > 0
              ? shuffledOptions
              : (q.options ?? []);
            // Map display text to the DB correct_answer value for comparison
            // DB stores "true"/"false" for true_false, but display shows "Benar"/"Salah"
            const normalizeAnswer = (val: string) => {
              const lower = val.trim().toLowerCase();
              if (lower === "benar" || lower === "true") return "true";
              if (lower === "salah" || lower === "false") return "false";
              return lower;
            };

            return displayOptions.map((opt) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = normalizeAnswer(opt) === normalizeAnswer(q.correct_answer);

              let btnStyle = "bg-white border-ink/10 text-ink hover:bg-ink/5";
              if (isSelected) {
                btnStyle = `${c.bgSoft} ${c.border} ${c.text} font-bold ring-2 ${c.ring}`;
              }
              if (showExplanation) {
                if (isCorrectOpt) {
                  btnStyle = "bg-emerald-100 border-emerald-500 text-emerald-700 font-bold ring-2 ring-emerald-300";
                } else if (isSelected) {
                  btnStyle = "bg-rose-100 border-rose-500 text-rose-700 font-bold ring-2 ring-rose-300";
                } else {
                  btnStyle = "bg-white border-ink/10 text-ink/40";
                }
              }

              return (
                <button
                  key={opt}
                  disabled={showExplanation}
                  onClick={() => setSelectedAnswer(opt)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border text-lg transition-all flex justify-between items-center",
                    btnStyle
                  )}
                >
                  <span>{opt}</span>
                  {showExplanation && isCorrectOpt && <span>✅</span>}
                  {showExplanation && isSelected && !isCorrectOpt && <span>❌</span>}
                </button>
              );
            });
          })()}

          {/* Fill-in-the-Blank Mode */}
          {q.question_type === "fill_blank" && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                disabled={showExplanation}
                value={selectedAnswer ?? ""}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Taip jawapan anda di sini..."
                className={cn(
                  "w-full p-4 rounded-2xl border text-lg focus:outline-none focus:ring-2 focus:ring-grape-500",
                  showExplanation
                    ? selectedAnswer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-rose-50 border-rose-500 text-rose-800"
                    : "bg-white border-ink/10 text-ink"
                )}
              />
              {showExplanation && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold">
                  Jawapan betul: <span className="font-mono text-base font-bold underline">{q.correct_answer}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Give me a Hint (Dhiya only) */}
        {id === "dhiya" && !showExplanation && (
          <div className="mb-4">
            {!usedHint ? (
              !showHintConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowHintConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-grape-200 bg-grape-50 text-grape-700 hover:bg-grape-100 font-display text-sm font-semibold transition-all shadow-sm"
                >
                  💡 Pembayang (-10 mata)
                </button>
              ) : (
                <div className="rounded-xl border border-grape-300 bg-grape-50 p-4 animate-slide">
                  <p className="text-sm font-semibold text-grape-800 mb-3 text-center">
                    Gunakan 10 mata ganjaran untuk melihat pembayang?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        deductPoints(10);
                        setUsedHint(true);
                        setShowHintConfirm(false);
                      }}
                      className="bg-grape-500 hover:bg-grape-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Ya, Tunjukkan Pembayang
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHintConfirm(false)}
                      className="bg-white border border-ink/10 hover:bg-ink/5 text-ink text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-grape-400 bg-grape-50/50 p-4 text-left animate-slide">
                <h4 className="font-display font-bold text-grape-800 mb-2 flex items-center gap-1.5">
                  💡 Pembayang
                </h4>
                <p className="text-sm text-grape-950 font-medium leading-relaxed whitespace-pre-line">
                  {q.explanation || "Tiada pembayang khusus untuk soalan ini. Fikirkan kata kunci dalam soalan."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit & Navigation Button */}
        <div className="mb-6 flex gap-3">
          {!showExplanation ? (
            <Button
              className="w-full bg-grape-500 hover:bg-grape-600 text-white py-4 rounded-2xl font-display text-lg font-bold shadow-sm"
              disabled={checkAnswerDisabled}
              onClick={submitAnswer}
            >
              Semak Jawapan
            </Button>
          ) : (
            <Button
              className="w-full bg-ink hover:bg-ink/90 text-white py-4 rounded-2xl font-display text-lg font-bold shadow-sm"
              onClick={nextQuestion}
            >
              {isLast ? "Selesai Kuiz" : "Soalan Seterusnya ➡️"}
            </Button>
          )}
        </div>

        {/* Explanation & Term Section */}
        {showExplanation && (
          <div className="space-y-4 animate-slide">
            <Card className="bg-sky-50 border border-sky-100 p-5 text-left">
              <h4 className="font-display font-bold text-sky-800 mb-1">💡 Penjelasan</h4>
              <p className="text-sm text-sky-950 leading-relaxed">
                {q.explanation || "Tiada penjelasan lanjut untuk soalan ini."}
              </p>
            </Card>

            {/* Term gap logger card */}
            <Card className="bg-grape-50 border border-grape-100 p-5 text-left">
              <h4 className="font-display font-bold text-grape-800 mb-1">✍️ Kamus Istilah (Ada perkataan sukar?)</h4>
              <p className="text-xs text-grape-950/80 mb-3">
                Masukkan istilah atau perkataan Arab yang anda kurang fahami dalam soalan ini untuk direkodkan dalam laporan ibu bapa.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Contoh: toma'ninah, istinjak"
                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-grape-200 focus:outline-none focus:ring-2 focus:ring-grape-500"
                />
                <Button
                  onClick={saveTermGap}
                  disabled={!termInput.trim()}
                  className="bg-grape-600 hover:bg-grape-700 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Simpan
                </Button>
              </div>
              {termGaps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {termGaps.map((t) => (
                    <span key={t.term} className="bg-grape-200/50 text-grape-800 text-xs px-2.5 py-1 rounded-lg font-semibold">
                      🔖 {t.term}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </PageShell>
    );
  }

  /* ========================= RESULTS SCREEN ========================= */
  const correctCount = answers.filter((a) => a.is_correct).length;
  const isPerfect = correctCount === questions.length;
  const scorePct = Math.round((correctCount / questions.length) * 100);

  return (
    <PageShell>
      <Confetti show={showConfetti} />
      {header}

      <div className="text-center max-w-md mx-auto py-8">
        <span className="text-7xl block mb-4">{isPerfect ? "🏆" : "🎉"}</span>
        <h1 className="font-display text-4xl font-extrabold text-ink mb-2">
          {isPerfect ? "Hebat, Sempurna!" : "Selesai Kuiz!"}
        </h1>
        <p className="font-display text-lg text-ink/70 mb-6">
          Anda telah menyelesaikan subtopik <span className="font-bold text-grape-600">{CHAPTER_SHORT[activeChapter]}</span>.
        </p>

        {/* Score Card */}
        <Card className="relative bg-white p-6 shadow-sm border border-ink/5 rounded-3xl mb-6 overflow-hidden">
          {/* Double Points Stamp */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 animate-pop">
            <div className="flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-sky-400 bg-gradient-to-br from-sky-400/95 to-indigo-500/95 text-white px-8 py-4 -rotate-12 shadow-2xl"
              style={{ animationDelay: "200ms" }}
            >
              <span className="font-display text-5xl font-black leading-none drop-shadow-lg">
                🔥 2x
              </span>
              <span className="font-display text-xl font-black tracking-wider uppercase drop-shadow-md">
                Double Points!
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-ink/5">
              <span className="block text-xs font-display font-semibold text-ink/50 uppercase">Skor</span>
              <span className="block text-4xl font-display font-extrabold text-grape-600 mt-1">
                {correctCount}/{questions.length}
              </span>
            </div>
            <div>
              <span className="block text-xs font-display font-semibold text-ink/50 uppercase">Mata Diperoleh</span>
              <span className="block text-4xl font-display font-extrabold text-emerald-600 mt-1">
                +{resultPoints}
              </span>
            </div>
          </div>
          <div className="mt-6 border-t border-ink/5 pt-4">
            <span className="block text-sm text-ink/70">
              Ketepatan Jawapan: <span className="font-bold text-ink">{scorePct}%</span>
            </span>
          </div>
        </Card>

        {/* Term gaps logging count indicator */}
        {termGaps.length > 0 && (
          <div className="p-4 bg-grape-50 border border-grape-100 rounded-2xl text-left text-sm text-grape-800 mb-6">
            <span className="font-bold block mb-1">📖 Kamus Istilah Disimpan ({termGaps.length})</span>
            Istilah yang anda simpan akan dipaparkan dalam dashboard Ibu Bapa untuk disemak bersama.
          </div>
        )}

        <Button
          onClick={() => setScreen("chapters")}
          className="w-full bg-grape-500 hover:bg-grape-600 text-white py-4 rounded-2xl font-display text-lg font-bold shadow-sm"
        >
          Kembali ke Senarai Bab
        </Button>
      </div>
    </PageShell>
  );
}
