"use client";

import { use, useRef, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CHILD_IDS, COLOR_CLASSES, TABLES } from "@/lib/data";
import type { ChildId, QuizMode } from "@/lib/types";
import { useChild } from "@/lib/store";
import type { QuizOutcome } from "@/lib/store";
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
import Quiz, { type QuizCompletion } from "./Quiz";

const ACCENT = "coral" as const;

type Screen = "picker" | "menu" | "learn" | "quiz" | "results";
type TableChoice = number | "mixed";

export default function MultiplicationPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { child, hydrated, recordQuiz } = useChild(id);

  const [screen, setScreen] = useState<Screen>("picker");
  const [table, setTable] = useState<TableChoice>(2);
  const [quizMode, setQuizMode] = useState<QuizMode>("random");
  const [quizKey, setQuizKey] = useState(0);
  const [result, setResult] = useState<QuizCompletion | null>(null);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const recorded = useRef(false);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const c = COLOR_CLASSES[ACCENT];

  function startQuiz(t: TableChoice, mode: QuizMode) {
    setTable(t);
    setQuizMode(mode);
    setResult(null);
    setOutcome(null);
    recorded.current = false;
    setQuizKey((k) => k + 1);
    setScreen("quiz");
  }

  function handleComplete(r: QuizCompletion) {
    if (recorded.current) return;
    recorded.current = true;
    const out = recordQuiz({
      module: "multiplication",
      topic: table === "mixed" ? "mixed" : String(table),
      quizMode: r.quizMode,
      total: r.total,
      correct: r.correct,
      durationSec: r.durationSec,
      bestStreak: r.bestStreak,
      answers: r.answers,
      perKey: r.perKey,
    });
    setResult(r);
    setOutcome(out);
    setScreen("results");
  }

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <BackButton href={`/play/${id}`} />
      <div className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="text-3xl">{child.profile.avatar}</span>
        <span className={c.text}>{child.profile.name}</span>
      </div>
      <PointsBadge points={child.rewards.points} />
    </div>
  );

  /* ----------------------------- PICKER ----------------------------- */
  if (screen === "picker") {
    return (
      <PageShell>
        {header}
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-coral-600">
          Times Tables ✖️
        </h1>
        <p className="mb-6 text-center font-display text-lg text-ink/70">
          Pick a table to practice
        </p>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {TABLES.map((t, i) => {
            const stat = child.multiplication[String(t)];
            const mastered = stat?.mastered;
            const accuracy = stat && stat.attempts > 0 ? pct(stat.correct, stat.attempts) : null;
            return (
              <button
                key={t}
                onClick={() => {
                  setTable(t);
                  setScreen("menu");
                }}
                className={cn(
                  "btn-pop tap animate-rise flex flex-col items-center justify-center gap-1 rounded-[var(--radius-blob)] p-4 shadow-[var(--shadow-pop)]",
                  mastered ? "bg-coral-500 text-white" : "bg-coral-100 text-coral-600",
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="font-display text-3xl font-bold">{t}</span>
                <span className="text-sm font-semibold">
                  {mastered ? "⭐" : accuracy !== null ? `${accuracy}%` : "·"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => startQuiz("mixed", "random")}
          className="btn-pop tap animate-rise mt-5 flex w-full flex-col items-center gap-1 rounded-[var(--radius-blob)] bg-sunny-400 p-6 text-ink shadow-[var(--shadow-pop)]"
          style={{ animationDelay: "360ms" }}
        >
          <span className="text-4xl">🎲</span>
          <span className="font-display text-2xl font-bold">Mixed Challenge</span>
          <span className="text-sm font-semibold text-ink/70">Random tables 2 to 12</span>
        </button>
      </PageShell>
    );
  }

  /* ------------------------------ MENU ------------------------------ */
  if (screen === "menu" && typeof table === "number") {
    const stat = child.multiplication[String(table)];
    return (
      <PageShell>
        {header}
        <Card className="flex flex-col items-center gap-5 py-8">
          <span className="font-display text-2xl font-bold text-ink/70">The</span>
          <span className="font-display text-7xl font-bold text-coral-600">{table}×</span>
          <span className="font-display text-2xl font-bold text-ink/70">table</span>
          {stat && stat.attempts > 0 && (
            <span className="font-display text-base font-semibold text-ink/60">
              {stat.mastered ? "⭐ Mastered!" : `${pct(stat.correct, stat.attempts)}% accuracy`}
            </span>
          )}

          {/* Quiz Mode Selection */}
          <div className="mt-2 flex w-full flex-col gap-3">
            <Button
              color={ACCENT}
              size="xl"
              onClick={() => startQuiz(table, "random")}
            >
              🎲 Random Quiz
            </Button>
            <Button
              color={ACCENT}
              variant="soft"
              size="xl"
              onClick={() => startQuiz(table, "standard")}
            >
              📋 Standard Quiz
            </Button>
            <p className="text-center text-xs font-semibold text-ink/40">
              Random = shuffled questions · Standard = x1, x2, x3...x12
            </p>
            <Button color={ACCENT} variant="soft" size="lg" onClick={() => setScreen("learn")}>
              Learn 📖
            </Button>
            <Button color={ACCENT} variant="ghost" size="md" onClick={() => setScreen("picker")}>
              ← Pick another
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  /* ------------------------------ LEARN ----------------------------- */
  if (screen === "learn" && typeof table === "number") {
    return (
      <PageShell>
        {header}
        <h1 className="mb-4 text-center font-display text-3xl font-bold text-coral-600">
          The {table}× table
        </h1>
        <Card className="mb-6">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((a) => (
              <li
                key={a}
                className="flex items-center justify-between rounded-2xl bg-coral-100 px-4 py-3 font-display text-xl font-bold text-coral-600 animate-rise"
                style={{ animationDelay: `${a * 25}ms` }}
              >
                <span>
                  {a} × {table}
                </span>
                <span className="text-2xl">{a * table}</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-3">
          <Button color={ACCENT} size="xl" onClick={() => startQuiz(table, "random")}>
            🎲 Random Quiz
          </Button>
          <Button color={ACCENT} variant="soft" size="xl" onClick={() => startQuiz(table, "standard")}>
            📋 Standard Quiz
          </Button>
          <Button color={ACCENT} variant="ghost" size="md" onClick={() => setScreen("menu")}>
            ← Back
          </Button>
        </div>
      </PageShell>
    );
  }

  /* ------------------------------ QUIZ ------------------------------ */
  if (screen === "quiz") {
    return (
      <PageShell>
        <Quiz
          key={quizKey}
          table={table}
          color={ACCENT}
          mode={quizMode}
          onComplete={handleComplete}
          onQuit={() => setScreen("picker")}
        />
      </PageShell>
    );
  }

  /* ----------------------------- RESULTS ---------------------------- */
  if (screen === "results" && result && outcome) {
    const accuracy = pct(result.correct, result.total);
    const masteredTables = outcome.masteredNow.filter((k) => k !== "mixed");
    return (
      <PageShell>
        <Confetti show={outcome.perfect} />
        {header}
        <Card className="flex flex-col items-center gap-4 py-8 text-center animate-pop">
          <span className="text-6xl">{outcome.perfect ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}</span>
          <h1 className="font-display text-3xl font-bold text-coral-600">
            {outcome.perfect ? "Perfect!" : "Nice work!"}
          </h1>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-100 px-3 py-1 font-display text-sm font-semibold text-coral-600">
            {result.quizMode === "standard" ? "📋 Standard" : "🎲 Random"}
          </span>

          <div className="font-display text-6xl font-bold text-ink">
            {result.correct}
            <span className="text-3xl text-ink/50"> / {result.total}</span>
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            <div className="rounded-2xl bg-coral-100 p-3">
              <div className="font-display text-2xl font-bold text-coral-600">{accuracy}%</div>
              <div className="text-xs font-semibold text-ink/60">Accuracy</div>
            </div>
            <div className="rounded-2xl bg-sunny-100 p-3">
              <div className="font-display text-2xl font-bold text-sunny-600">
                +{outcome.pointsEarned}
              </div>
              <div className="text-xs font-semibold text-ink/60">Points</div>
            </div>
            <div className="rounded-2xl bg-teal-100 p-3">
              <div className="font-display text-2xl font-bold text-teal-600">
                🔥 {result.bestStreak}
              </div>
              <div className="text-xs font-semibold text-ink/60">Best streak</div>
            </div>
          </div>

          {masteredTables.length > 0 && (
            <div className="w-full rounded-2xl bg-leaf-400 p-4 text-white animate-pop">
              <div className="font-display text-xl font-bold">⭐ New mastery!</div>
              <div className="font-semibold">
                You mastered the {masteredTables.join(", ")}× table
                {masteredTables.length > 1 ? "s" : ""}!
              </div>
            </div>
          )}

          <div className="mt-2 flex w-full flex-col gap-3">
            <Button color={ACCENT} size="xl" onClick={() => startQuiz(table, quizMode)}>
              Play Again 🔁
            </Button>
            <Button color={ACCENT} variant="soft" size="lg" onClick={() => setScreen("picker")}>
              Pick Another Table
            </Button>
            <Link
              href={`/play/${id}`}
              role="button"
              className="btn-pop tap inline-flex min-h-[44px] items-center justify-center rounded-full bg-transparent px-5 py-3 font-display text-lg font-semibold text-coral-600"
            >
              🏠 Home
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  // fallback (e.g. menu/learn reached with table === "mixed")
  return (
    <PageShell>
      {header}
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-xl text-ink/70">Let&apos;s pick a table!</p>
        <Button color={ACCENT} size="lg" onClick={() => setScreen("picker")}>
          Choose a table
        </Button>
      </Card>
    </PageShell>
  );
}
