"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  fetchTopics,
  fetchQuestions,
  fetchQuizResults,
  logBMQuiz,
  logVocabGap,
  levelForChild,
  LEVEL_LABEL,
  type BMQuestion,
  type TopicInfo,
  type BMQuizResult,
  type QuizMode,
} from "@/lib/bahasamelayu";

const ACCENT = "sunny" as const;

const TOPIC_EMOJIS: Record<number, string> = {
  1: "✏️",
  2: "✍️",
};

const TOPIC_SHORT: Record<number, string> = {
  1: "Tatabahasa",
  2: "Karangan",
};

const TOPIC_DESC: Record<number, string> = {
  1: "Morfologi, sintaksis, peribahasa, dan kesalahan bahasa.",
  2: "Membina ayat, menyusun perenggan, dan penulisan ulasan/karangan.",
};

type Screen = "topics" | "quiz" | "results";

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

export default function BahasaMelayuPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz, deductPoints } = useChild(id);
  const [screen, setScreen] = useState<Screen>("topics");
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [pastResults, setPastResults] = useState<BMQuizResult[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Quiz state
  const [activeTopic, setActiveTopic] = useState<number>(1);
  const [quizMode, setQuizMode] = useState<QuizMode>("quick");
  const [questions, setQuestions] = useState<BMQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [vocabGaps, setVocabGaps] = useState<VocabEntry[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [vocabInput, setVocabInput] = useState("");
  const [usedHint, setUsedHint] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const quizStartRef = useRef<number>(Date.now());

  // Results state
  const [resultPoints, setResultPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const level = levelForChild(id);

  // Load topics and history on mount
  useEffect(() => {
    if (!hydrated) return;
    setLoadingTopics(true);
    Promise.all([fetchTopics(level), fetchQuizResults(id)]).then(
      ([topList, results]) => {
        setTopics(topList);
        setPastResults(results);
        setLoadingTopics(false);
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

  // Start quiz for a topic
  const startQuiz = useCallback(async (topicNum: number) => {
    const qs = await fetchQuestions(level, topicNum, quizMode, id);
    if (qs.length === 0) return;
    setActiveTopic(topicNum);
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
  }, [quizMode, id, level]);

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
    logVocabGap({
      child_id: id,
      question_id: q.id,
      word,
      topic: activeTopic,
      context: q.question_text,
    });
    setVocabInput("");
  }, [vocabInput, questions, currentIdx, activeTopic, id]);

  // Move to next question or finish
  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setVocabInput("");
      setUsedHint(false);
      setShowHintConfirm(false);
      questionStartRef.current = Date.now();
    } else {
      // Quiz complete - calculate and save
      const correctCount = answers.filter((a) => a.is_correct).length;
      const totalDurationSec = Math.round((Date.now() - quizStartRef.current) / 1000);
      const pointsEarned = correctCount * POINTS.perCorrect + (correctCount === questions.length ? questions.length * POINTS.perfectBonusPerQuestion : 0);

      // Record to the SifirKids points economy
      recordQuiz({
        module: "bahasa_melayu",
        topic: `topik-${activeTopic}`,
        total: questions.length,
        correct: correctCount,
        durationSec: totalDurationSec,
        bestStreak: calcBestStreak(answers),
      });

      // Save to Supabase BM tables
      logBMQuiz(
        {
          child_id: id,
          level,
          topic: activeTopic,
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
  }, [currentIdx, questions, answers, activeTopic, vocabGaps, recordQuiz, id, level]);

  if (!hydrated || loadingTopics) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={screen === "topics" ? `/play/${id}` : undefined} />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={c.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ========================= TOPIC PICKER ========================= */
  if (screen === "topics") {
    return (
      <PageShell>
        {header}
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-sunny-600">
          Bahasa Melayu {LEVEL_LABEL[level]} 📝
        </h1>
        <p className="mb-6 text-center font-display text-lg text-ink/70">
          Pilih subtopik untuk memulakan kuiz
        </p>

        {/* Quick/Full Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-ink/5">
            <button
              onClick={() => setQuizMode("quick")}
              className={cn(
                "px-4 py-2 font-display text-sm font-semibold rounded-xl transition-all",
                quizMode === "quick"
                  ? "bg-sunny-500 text-white shadow-sm"
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
                  ? "bg-sunny-500 text-white shadow-sm"
                  : "text-ink/65 hover:text-ink"
              )}
            >
              Semua Soalan
            </button>
          </div>
        </div>

        {/* Grid list of topics */}
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((t) => {
            const shortName = TOPIC_SHORT[t.topic] || t.topic_title;
            const desc = TOPIC_DESC[t.topic] || "Latihan kuiz interaktif.";
            const emoji = TOPIC_EMOJIS[t.topic] || "📝";
            const levelResults = pastResults.filter((r) => r.topic === t.topic);
            const highResult = levelResults.reduce(
              (acc, r) => (r.correct_answers > acc ? r.correct_answers : acc),
              0
            );

            return (
              <Card
                key={t.topic}
                onClick={() => startQuiz(t.topic)}
                className="flex flex-col justify-between border border-ink/5 bg-white p-5 text-left transition-transform active:scale-98"
              >
                <div>
                  <span className="mb-3 block text-5xl">{emoji}</span>
                  <h3 className="font-display text-xl font-bold text-ink">
                    {shortName}
                  </h3>
                  <p className="mt-2 text-sm text-ink/75 leading-relaxed">{desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                  <span className="font-display text-xs font-semibold text-ink/50">
                    {t.questionCount} Soalan Tersedia
                  </span>
                  {levelResults.length > 0 && (
                    <span className="font-display text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Skor Terbaik: {highResult}/{t.questionCount > 10 && quizMode === "quick" ? 10 : t.questionCount}
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
                setScreen("topics");
              }
            }}
            className="text-ink/60"
          >
            ❌ Keluar
          </Button>
          <div className="flex-1 px-4">
            <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-sunny-500 transition-all duration-300"
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
            <span className="rounded-full bg-sunny-100 px-3 py-1 font-display text-xs font-bold text-sunny-700 capitalize">
              {q.difficulty}
            </span>
            {q.tags?.map((t) => (
              <span key={t} className="rounded-full bg-ink/5 px-3 py-1 font-display text-xs text-ink/60">
                #{t}
              </span>
            ))}
          </div>
          <h2 className="font-display text-xl font-bold text-ink leading-relaxed">
            {q.question_text}
          </h2>
        </Card>

        {/* Question Inputs */}
        <div className="grid gap-3 mb-6">
          {/* MCQ / True-False Mode */}
          {q.question_type !== "fill_blank" && q.options && (
            q.options.map((opt) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt.toLowerCase() === q.correct_answer.toLowerCase();

              let btnStyle = "bg-white border-ink/10 text-ink hover:bg-ink/5";
              if (isSelected) {
                btnStyle = "bg-sunny-100 border-sunny-500 text-sunny-700 font-bold ring-2 ring-sunny-300";
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
            })
          )}

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
                  "w-full p-4 rounded-2xl border text-lg focus:outline-none focus:ring-2 focus:ring-sunny-500",
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
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-sunny-200 bg-sunny-50 text-sunny-700 hover:bg-sunny-100 font-display text-sm font-semibold transition-all shadow-sm"
                >
                  💡 Give me a Hint (-1000 mata)
                </button>
              ) : (
                <div className="rounded-xl border border-sunny-300 bg-sunny-50 p-4 animate-slide">
                  <p className="text-sm font-semibold text-sunny-800 mb-3 text-center">
                    Gunakan 1000 mata ganjaran untuk melihat pembayang?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        deductPoints(1000);
                        setUsedHint(true);
                        setShowHintConfirm(false);
                      }}
                      className="bg-sunny-500 hover:bg-sunny-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
                    >
                      Ya, Tunjukkan Hint
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
              <div className="rounded-xl border border-sunny-400 bg-sunny-50/50 p-4 text-left animate-slide">
                <h4 className="font-display font-bold text-sunny-800 mb-2 flex items-center gap-1.5">
                  💡 Give me a Hint
                </h4>
                <p className="text-sm text-sunny-950 font-medium leading-relaxed whitespace-pre-line">
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
              className="w-full bg-sunny-500 hover:bg-sunny-600 text-white py-4 rounded-2xl font-display text-lg font-bold shadow-sm"
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

        {/* Explanation & Vocab Section */}
        {showExplanation && (
          <div className="space-y-4 animate-slide">
            <Card className="bg-sky-50 border border-sky-100 p-5 text-left">
              <h4 className="font-display font-bold text-sky-800 mb-1">💡 Penjelasan</h4>
              <p className="text-sm text-sky-950 leading-relaxed">
                {q.explanation || "Tiada penjelasan lanjut untuk soalan ini."}
              </p>
            </Card>

            {/* Vocab gap logger card */}
            <Card className="bg-sunny-50 border border-sunny-100 p-5 text-left">
              <h4 className="font-display font-bold text-sunny-800 mb-1">✍️ Kamus Saya (Ada perkataan sukar?)</h4>
              <p className="text-xs text-sunny-950/80 mb-3">
                Masukkan perkataan bahasa Melayu yang anda kurang fahami dalam soalan ini untuk direkodkan dalam laporan ibu bapa.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vocabInput}
                  onChange={(e) => setVocabInput(e.target.value)}
                  placeholder="Contoh: marhaen, pancaindera"
                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-sunny-200 focus:outline-none focus:ring-2 focus:ring-sunny-500"
                />
                <Button
                  onClick={saveVocabGap}
                  disabled={!vocabInput.trim()}
                  className="bg-sunny-600 hover:bg-sunny-700 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Simpan
                </Button>
              </div>
              {vocabGaps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {vocabGaps.map((v) => (
                    <span key={v.word} className="bg-sunny-200/50 text-sunny-800 text-xs px-2.5 py-1 rounded-lg font-semibold">
                      🔖 {v.word}
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
          Anda telah menyelesaikan subtopik <span className="font-bold text-sunny-600">{TOPIC_SHORT[activeTopic]}</span>.
        </p>

        {/* Score Card */}
        <Card className="bg-white p-6 shadow-sm border border-ink/5 rounded-3xl mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-ink/5">
              <span className="block text-xs font-display font-semibold text-ink/50 uppercase">Skor</span>
              <span className="block text-4xl font-display font-extrabold text-sunny-600 mt-1">
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

        {/* Vocab gaps logging count indicator */}
        {vocabGaps.length > 0 && (
          <div className="p-4 bg-sunny-50 border border-sunny-100 rounded-2xl text-left text-sm text-sunny-800 mb-6">
            <span className="font-bold block mb-1">📝 Kamus Baharu Disimpan ({vocabGaps.length})</span>
            Perkataan yang anda simpan akan dipaparkan dalam dashboard Ibu Bapa untuk disemak bersama.
          </div>
        )}

        <Button
          onClick={() => setScreen("topics")}
          className="w-full bg-sunny-500 hover:bg-sunny-600 text-white py-4 rounded-2xl font-display text-lg font-bold shadow-sm"
        >
          Kembali ke Subtopik
        </Button>
      </div>
    </PageShell>
  );
}
