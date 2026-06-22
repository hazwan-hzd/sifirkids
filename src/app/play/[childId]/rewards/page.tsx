"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import {
  CHILD_IDS,
  COLOR_CLASSES,
  CHILD_REWARDS,
  REWARDS,
} from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { useApp, useChild } from "@/lib/store";
import {
  PageShell,
  Loading,
  PointsBadge,
  BackButton,
  ProgressBar,
  Card,
  Button,
  Confetti,
} from "@/components/ui";
import { cn, dayKey } from "@/lib/utils";

const STATUS_STYLES: Record<
  "pending" | "approved" | "denied",
  { label: string; cls: string }
> = {
  pending: { label: "⏳ Pending", cls: "bg-sunny-100 text-sunny-600" },
  approved: { label: "✅ Approved", cls: "bg-leaf-400/30 text-leaf-500" },
  denied: { label: "↩️ Refunded", cls: "bg-coral-100 text-coral-600" },
};

export default function RewardsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { hydrated } = useApp();
  const { child, claimReward } = useChild(id);

  const [toast, setToast] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  function onClaim(rewardId: string, name: string) {
    const ok = claimReward(rewardId);
    if (ok) {
      setToast(`${name} claimed! 🎉 Waiting for parent approval.`);
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1600);
      window.setTimeout(() => setToast(null), 3200);
    }
  }

  // Sorted shop (cheapest first) — declared before any early return for stable hooks.
  const sortedRewards = useMemo(() => {
    const list = CHILD_REWARDS[id] || REWARDS;
    return [...list].sort((a, b) => a.cost - b.cost);
  }, [id]);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const c = COLOR_CLASSES[child.profile.color];
  const points = child.rewards.points;

  // Daily tracker numbers
  const todayKey = dayKey();
  const todaySessions = child.daily.history[todayKey]?.sessions ?? 0;
  const goal = child.daily.dailyGoal;
  const goalPct = goal > 0 ? Math.min(100, Math.round((todaySessions / goal) * 100)) : 0;
  const goalMet = todaySessions >= goal;

  // Last 7 days strip (oldest -> today)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    const rec = child.daily.history[key];
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      sessions: rec?.sessions ?? 0,
      isToday: key === todayKey,
    };
  });
  const maxSessions = Math.max(goal, ...last7.map((d) => d.sessions), 1);

  // Claims newest first
  const claims = [...child.rewards.claims].reverse();

  return (
    <PageShell>
      <Confetti show={celebrate} />

      {toast && (
        <div
          role="status"
          className="animate-pop fixed inset-x-0 top-4 z-50 mx-auto w-[min(92%,32rem)] rounded-[var(--radius-blob)] bg-leaf-400 px-5 py-4 text-center font-display text-lg font-bold text-white shadow-[var(--shadow-soft)]"
        >
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}`} />
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="text-3xl">{child.profile.avatar}</span>
          <span className={c.text}>{child.profile.name}</span>
        </div>
        <PointsBadge points={points} />
      </div>

      <h1 className="mb-6 text-center font-display text-3xl font-bold text-ink">
        🎁 Reward Shop
      </h1>

      {/* ---------------------- Reward shop ---------------------- */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {sortedRewards.map((reward, i) => {
          const affordable = points >= reward.cost;
          const need = reward.cost - points;
          return (
            <Card
              key={reward.id}
              className="animate-rise flex flex-col items-center gap-2 p-4 text-center"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-5xl" aria-hidden>
                {reward.icon}
              </span>
              <span className="font-display text-lg font-bold text-ink">
                {reward.name}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-sm font-bold",
                  affordable ? "bg-sunny-400 text-ink" : "bg-black/5 text-ink/70",
                )}
              >
                <span aria-hidden>⭐</span>
                {reward.cost.toLocaleString()}
              </span>
              {affordable ? (
                <Button
                  color={child.profile.color}
                  size="md"
                  className="mt-1 w-full"
                  onClick={() => onClaim(reward.id, reward.name)}
                >
                  Claim
                </Button>
              ) : (
                <span className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-black/5 px-3 py-3 font-display text-sm font-semibold text-ink/70">
                  🔒 {need.toLocaleString()} more ⭐
                </span>
              )}
            </Card>
          );
        })}
      </div>

      {/* ---------------------- Daily tracker ---------------------- */}
      <Card className="animate-rise mb-10 bg-grape-50">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-grape-600">
            ☀️ Today&apos;s Goal
          </h2>
          <span className="font-display text-lg font-bold text-grape-600">
            {todaySessions} / {goal}
          </span>
        </div>
        <ProgressBar value={goalPct} color="grape" className="h-5" />
        <p className="mt-2 font-display text-base text-ink/80">
          {goalMet
            ? "🌟 Goal smashed! You're a superstar today!"
            : `${goal - todaySessions} more quiz${goal - todaySessions === 1 ? "" : "zes"} to hit your goal — you can do it!`}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-3xl bg-sunny-100 p-4 text-center">
            <span className="text-3xl" aria-hidden>
              🔥
            </span>
            <span className="font-display text-2xl font-bold text-sunny-600">
              {child.daily.currentStreak}
            </span>
            <span className="font-display text-sm text-ink/70">day streak</span>
          </div>
          <div className="flex flex-col items-center rounded-3xl bg-grape-100 p-4 text-center">
            <span className="text-3xl" aria-hidden>
              🏅
            </span>
            <span className="font-display text-2xl font-bold text-grape-600">
              {child.daily.longestStreak}
            </span>
            <span className="font-display text-sm text-ink/70">longest streak</span>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 font-display text-sm font-semibold text-ink/70">
            Last 7 days
          </p>
          <div className="flex items-end justify-between gap-2">
            {last7.map((d) => {
              const heightPct = Math.round((d.sessions / maxSessions) * 100);
              const hit = d.sessions >= goal && goal > 0;
              return (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className={cn(
                        "w-full rounded-xl transition-[height] duration-500 ease-out",
                        d.sessions === 0
                          ? "bg-black/10"
                          : hit
                            ? "bg-sunny-500"
                            : "bg-grape-400",
                        d.isToday && "ring-2 ring-grape-600 ring-offset-2",
                      )}
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      aria-hidden
                    />
                  </div>
                  <span
                    className={cn(
                      "font-display text-xs",
                      d.isToday ? "font-bold text-grape-600" : "text-ink/60",
                    )}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ---------------------- My claims ---------------------- */}
      <h2 className="mb-3 font-display text-2xl font-bold text-ink">My Claims</h2>
      {claims.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-lg text-ink/70">
            No claims yet — earn ⭐ and treat yourself!
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((claim) => {
            const s = STATUS_STYLES[claim.status];
            return (
              <Card key={claim.id} className="flex items-center gap-3 p-4">
                <span className="text-3xl" aria-hidden>
                  {claim.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-ink">
                    {claim.name}
                  </p>
                  <p className="font-display text-sm text-ink/60">
                    ⭐ {claim.cost.toLocaleString()} ·{" "}
                    {new Date(claim.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 font-display text-sm font-bold",
                    s.cls,
                  )}
                >
                  {s.label}
                </span>
              </Card>
            );
          })}
          <p className="px-2 font-display text-sm text-ink/60">
            Denied claims are automatically refunded — your ⭐ come straight back!
          </p>
        </div>
      )}
    </PageShell>
  );
}
