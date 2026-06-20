"use client";

import { use, useRef, useState } from "react";
import { notFound } from "next/navigation";
import {
  ARABIC_SETS,
  ARABIC_LETTERS,
  CHILD_IDS,
  COLOR_CLASSES,
  getLetter,
  lettersInSet,
  type ArabicLetter,
} from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { useChild, useSessionTimer, type QuizOutcome, type QuizResultInput } from "@/lib/store";
import {
  PageShell,
  Loading,
  PointsBadge,
  BackButton,
  Button,
  Card,
  ProgressBar,
  Confetti,
} from "@/components/ui";
import { cn, pct, shuffle } from "@/lib/utils";

const ACCENT = "teal" as const;
const C = COLOR_CLASSES[ACCENT];
const QUESTION_COUNT = 10;
const SET_SIZE = 7;

type Screen = "picker" | "learn" | "test" | "results";

/** "all" tests pull from every letter; numbered tests from one set. */
type SetChoice = number | "all";

type QStyle = "glyphToName" | "nameToGlyph";

interface Question {
  style: QStyle;
  letter: ArabicLetter;
  options: ArabicLetter[];
}

interface LetterTally {
  attempts: number;
  correct: number;
  bestStreak: number;
  /** internal: running streak while building bestStreak */
  run: number;
}

/* ------------------------- question generation ------------------------ */

function buildQuestions(pool: ArabicLetter[]): Question[] {
  // Cycle through a reshuffled pool until we have enough prompts.
  const order: ArabicLetter[] = [];
  while (order.length < QUESTION_COUNT) order.push(...shuffle(pool));
  const chosen = order.slice(0, QUESTION_COUNT);

  return chosen.map((letter) => {
    const style: QStyle = Math.random() < 0.5 ? "glyphToName" : "nameToGlyph";
    // Distractors prefer same pool; fall back to all letters if too small.
    let others = shuffle(pool.filter((l) => l.id !== letter.id));
    if (others.length < 3) {
      others = shuffle(ARABIC_LETTERS.filter((l) => l.id !== letter.id));
    }
    const options = shuffle([letter, ...others.slice(0, 3)]);
    return { style, letter, options };
  });
}

/* ------------------------------- page -------------------------------- */

export default function ArabicPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz } = useChild(id);
  const timer = useSessionTimer();

  const [screen, setScreen] = useState<Screen>("picker");
  const [choice, setChoice] = useState<SetChoice>(1);

  // learn state
  const [learnIndex, setLearnIndex] = useState(0);

  // test state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const tallies = useRef<Record<string, LetterTally>>({});
  const questionStartRef = useRef<number>(Date.now());
  const answersRef = useRef<NonNullable<QuizResultInput["answers"]>>([]);

  // results state
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [resultCorrect, setResultCorrect] = useState(0);
  const [resultDuration, setResultDuration] = useState(0);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const poolFor = (c: SetChoice): ArabicLetter[] =>
    c === "all" ? ARABIC_LETTERS : lettersInSet(c);

  /* ------------------------------ actions ----------------------------- */

  function startLearn(set: number) {
    setChoice(set);
    setLearnIndex(0);
    setScreen("learn");
  }

  function startTest(c: SetChoice) {
    setChoice(c);
    setQuestions(buildQuestions(poolFor(c)));
    setQIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    tallies.current = {};
    answersRef.current = [];
    questionStartRef.current = Date.now();
    timer.reset();
    setScreen("test");
  }

  function answer(optionId: string) {
    if (picked) return; // already answered this question
    const q = questions[qIndex];
    const isCorrect = optionId === q.letter.id;
    setPicked(optionId);

    // Record answer for Supabase logging
    const responseTimeMs = Date.now() - questionStartRef.current;
    const pickedLetter = ARABIC_LETTERS.find((l) => l.id === optionId);
    answersRef.current.push({
      question: q.style === "glyphToName" ? q.letter.glyph : q.letter.name,
      correctAnswer: q.letter.name,
      givenAnswer: pickedLetter?.name ?? optionId,
      isCorrect,
      responseTimeMs,
    });

    // per-letter tally
    const t = tallies.current[q.letter.id] ?? {
      attempts: 0,
      correct: 0,
      bestStreak: 0,
      run: 0,
    };
    t.attempts += 1;
    if (isCorrect) {
      t.correct += 1;
      t.run += 1;
      t.bestStreak = Math.max(t.bestStreak, t.run);
    } else {
      t.run = 0;
    }
    tallies.current[q.letter.id] = t;

    // overall streak + score
    let nextStreak = streak;
    if (isCorrect) {
      nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((n) => n + 1);
    } else {
      setStreak(0);
    }

    // advance after a beat for feedback
    window.setTimeout(
      () => {
        if (qIndex + 1 >= questions.length) {
          finishTest(
            correctCount + (isCorrect ? 1 : 0),
            Math.max(bestStreak, nextStreak),
          );
        } else {
          setQIndex((i) => i + 1);
          setPicked(null);
          questionStartRef.current = Date.now();
        }
      },
      isCorrect ? 650 : 1100,
    );
  }

  function finishTest(finalCorrect: number, finalBestStreak: number) {
    const durationSec = timer.elapsed();
    const perKey: Record<
      string,
      { attempts: number; correct: number; bestStreak: number }
    > = {};
    for (const [key, t] of Object.entries(tallies.current)) {
      perKey[key] = {
        attempts: t.attempts,
        correct: t.correct,
        bestStreak: t.bestStreak,
      };
    }
    const out = recordQuiz({
      module: "arabic",
      topic: choice === "all" ? "all" : `set-${choice}`,
      total: QUESTION_COUNT,
      correct: finalCorrect,
      durationSec,
      bestStreak: finalBestStreak,
      perKey,
      answers: answersRef.current,
    });
    setOutcome(out);
    setResultCorrect(finalCorrect);
    setResultDuration(durationSec);
    setScreen("results");
  }

  /* ------------------------------ header ------------------------------ */

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={`/play/${id}`} />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={C.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ------------------------------ render ------------------------------ */

  return (
    <PageShell>
      {header}
      {screen === "picker" && (
        <SetPicker
          arabic={child.arabic}
          onLearn={startLearn}
          onTest={startTest}
        />
      )}
      {screen === "learn" && (
        <LearnDeck
          letters={poolFor(choice)}
          index={learnIndex}
          setIndex={setLearnIndex}
          onTest={() => startTest(choice)}
          onDone={() => setScreen("picker")}
        />
      )}
      {screen === "test" && questions.length > 0 && (
        <TestView
          question={questions[qIndex]}
          qIndex={qIndex}
          total={questions.length}
          picked={picked}
          streak={streak}
          onAnswer={answer}
        />
      )}
      {screen === "results" && outcome && (
        <Results
          correct={resultCorrect}
          total={QUESTION_COUNT}
          durationSec={resultDuration}
          outcome={outcome}
          onPlayAgain={() => startTest(choice)}
          onPickSet={() => setScreen("picker")}
          homeHref={`/play/${id}`}
        />
      )}
    </PageShell>
  );
}

/* ---------------------------- Set picker ----------------------------- */

function SetPicker({
  arabic,
  onLearn,
  onTest,
}: {
  arabic: Record<string, { mastered: boolean; attempts?: number }>;
  onLearn: (set: number) => void;
  onTest: (c: SetChoice) => void;
}) {
  return (
    <div className="animate-rise">
      <h1 className="mb-1 text-center font-display text-3xl font-bold text-ink">
        Alif Ba Ta
      </h1>
      <p className="mb-6 text-center font-display text-lg text-ink/70">
        Pick a set to learn or test
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {ARABIC_SETS.map((set, i) => {
          const letters = lettersInSet(set);
          const mastered = letters.filter((l) => arabic[l.id]?.mastered).length;
          const value = Math.round((mastered / SET_SIZE) * 100);
          return (
            <Card
              key={set}
              className="animate-rise flex flex-col gap-3"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-bold text-ink">
                  Set {set}
                </span>
                <span className={cn("font-display text-sm font-semibold", C.text)}>
                  {mastered}/{SET_SIZE} mastered
                </span>
              </div>

              <div
                dir="rtl"
                className="flex flex-wrap justify-center gap-2 py-2"
              >
                {letters.map((l) => {
                  const stat = arabic[l.id];
                  const isMastered = stat?.mastered;
                  const hasAttempted = stat && stat.attempts && stat.attempts > 0;
                  return (
                    <span
                      key={l.id}
                      className={cn(
                        "font-arabic flex h-11 w-11 items-center justify-center rounded-full text-2xl font-bold border-2 transition-all shadow-sm",
                        isMastered
                          ? "bg-leaf-100 text-leaf-700 border-leaf-400 font-bold"
                          : hasAttempted
                            ? "bg-teal-50 text-teal-700 border-teal-300"
                            : "bg-white/50 text-ink/30 border-black/10 hover:border-black/20"
                      )}
                      title={`${l.name} (${isMastered ? "Mastered" : hasAttempted ? "Practicing" : "Unpracticed"})`}
                    >
                      {l.glyph}
                    </span>
                  );
                })}
              </div>

              <ProgressBar value={value} color={ACCENT} />

              <div className="mt-1 flex gap-2">
                <Button
                  color={ACCENT}
                  variant="soft"
                  size="md"
                  className="flex-1"
                  onClick={() => onLearn(set)}
                >
                  📖 Learn
                </Button>
                <Button
                  color={ACCENT}
                  size="md"
                  className="flex-1"
                  onClick={() => onTest(set)}
                >
                  ✏️ Test
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center">
        <Button color="grape" size="lg" onClick={() => onTest("all")}>
          🌟 Test All 28 Letters
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- Learn deck ---------------------------- */

function LearnDeck({
  letters,
  index,
  setIndex,
  onTest,
  onDone,
}: {
  letters: ArabicLetter[];
  index: number;
  setIndex: (i: number) => void;
  onTest: () => void;
  onDone: () => void;
}) {
  const letter = letters[index];
  const isLast = index === letters.length - 1;
  const isFirst = index === 0;

  return (
    <div className="animate-rise flex flex-col items-center gap-6">
      <Card
        key={letter.id}
        className="animate-pop flex w-full flex-col items-center gap-4 py-10 text-center"
      >
        <span className="font-arabic text-[7rem] leading-none text-ink sm:text-[9rem]">
          {letter.glyph}
        </span>
        <span className="font-display text-4xl font-bold text-ink">
          {letter.name}
        </span>
        <span className={cn("font-display text-2xl font-semibold", C.text)}>
          sound: &ldquo;{letter.sound}&rdquo;
        </span>
      </Card>

      {/* progress dots */}
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((l, i) => (
          <span
            key={l.id}
            className={cn(
              "h-3 w-3 rounded-full",
              i === index ? C.bg : "bg-black/15",
            )}
          />
        ))}
      </div>

      <div className="flex w-full items-center justify-between gap-3">
        <Button
          color={ACCENT}
          variant="soft"
          size="md"
          onClick={() => setIndex(index - 1)}
          disabled={isFirst}
        >
          ← Prev
        </Button>
        <span className="font-display text-lg font-semibold text-ink/70">
          {index + 1} / {letters.length}
        </span>
        {isLast ? (
          <Button color={ACCENT} size="md" onClick={onTest}>
            Test me! ✏️
          </Button>
        ) : (
          <Button color={ACCENT} size="md" onClick={() => setIndex(index + 1)}>
            Next →
          </Button>
        )}
      </div>

      <Button color="grape" variant="ghost" size="md" onClick={onDone}>
        ← Back to sets
      </Button>
    </div>
  );
}

/* ------------------------------ Test view ---------------------------- */

function TestView({
  question,
  qIndex,
  total,
  picked,
  streak,
  onAnswer,
}: {
  question: Question;
  qIndex: number;
  total: number;
  picked: string | null;
  streak: number;
  onAnswer: (id: string) => void;
}) {
  const progress = Math.round((qIndex / total) * 100);

  return (
    <div className="animate-rise flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-lg font-semibold text-ink/70">
          Question {qIndex + 1} / {total}
        </span>
        {streak >= 2 && (
          <span className="font-display text-lg font-bold text-coral-500">
            🔥 {streak} streak
          </span>
        )}
      </div>
      <ProgressBar value={progress} color={ACCENT} />

      {/* prompt */}
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="font-display text-lg font-semibold text-ink/60">
          {question.style === "glyphToName"
            ? "Which name is this letter?"
            : "Which letter is this?"}
        </span>
        {question.style === "glyphToName" ? (
          <span className="font-arabic text-[7rem] leading-none text-ink sm:text-[8rem]">
            {question.letter.glyph}
          </span>
        ) : (
          <span className="font-display text-5xl font-bold text-ink sm:text-6xl">
            {question.letter.name}
          </span>
        )}
      </Card>

      {/* options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt) => {
          const isCorrect = opt.id === question.letter.id;
          const isPicked = picked === opt.id;
          let tone = "bg-white/85 text-ink";
          if (picked) {
            if (isCorrect) tone = "bg-leaf-500 text-white animate-pop";
            else if (isPicked) tone = "bg-coral-500 text-white";
            else tone = "bg-white/60 text-ink/50";
          }
          return (
            <button
              key={opt.id}
              onClick={() => onAnswer(opt.id)}
              disabled={!!picked}
              className={cn(
                "btn-pop tap flex min-h-[5.5rem] items-center justify-center rounded-[var(--radius-blob)] p-4 shadow-[var(--shadow-soft)] transition-colors",
                tone,
              )}
            >
              {question.style === "glyphToName" ? (
                <span className="font-display text-3xl font-bold">{opt.name}</span>
              ) : (
                <span className="font-arabic text-6xl leading-none">{opt.glyph}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Results ----------------------------- */

function Results({
  correct,
  total,
  durationSec,
  outcome,
  onPlayAgain,
  onPickSet,
  homeHref,
}: {
  correct: number;
  total: number;
  durationSec: number;
  outcome: QuizOutcome;
  onPlayAgain: () => void;
  onPickSet: () => void;
  homeHref: string;
}) {
  const accuracy = pct(correct, total);
  const masteredNames = outcome.masteredNow
    .map((idKey) => getLetter(idKey)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="animate-rise flex flex-col items-center gap-5 text-center">
      <Confetti show={outcome.perfect} />

      <h1 className="font-display text-3xl font-bold text-ink">
        {outcome.perfect
          ? "Perfect! 🌟"
          : correct >= total / 2
            ? "Great job! 🎉"
            : "Keep going! 💪"}
      </h1>

      <Card className="flex w-full flex-col items-center gap-4 py-8">
        <span className="font-display text-6xl font-bold text-ink">
          {correct}
          <span className="text-3xl text-ink/50"> / {total}</span>
        </span>

        <div className="grid w-full grid-cols-3 gap-3">
          <Stat label="Points" value={`+${outcome.pointsEarned}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Time" value={`${durationSec}s`} />
        </div>
      </Card>

      {masteredNames.length > 0 && (
        <Card className="w-full bg-teal-100">
          <p className="font-display text-lg font-bold text-teal-600">
            🏆 New letters mastered!
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">
            {masteredNames.join(", ")}
          </p>
        </Card>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button color={ACCENT} size="lg" onClick={onPlayAgain}>
          🔁 Play Again
        </Button>
        <div className="flex gap-3">
          <Button
            color="grape"
            variant="soft"
            size="md"
            className="flex-1"
            onClick={onPickSet}
          >
            Pick Another Set
          </Button>
          <a
            href={homeHref}
            role="button"
            className={cn(
              "btn-pop tap inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-display font-semibold",
              "bg-sunny-400 text-ink",
            )}
          >
            🏠 Home
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white/70 p-3">
      <span className="font-display text-2xl font-bold text-ink">{value}</span>
      <span className="font-display text-sm font-semibold text-ink/60">{label}</span>
    </div>
  );
}
