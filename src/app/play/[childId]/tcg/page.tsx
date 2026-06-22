"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, CARDS, COLOR_CLASSES } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton, ProgressBar } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";

export default function TcgHubPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated } = useApp();

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];
  const tcg = child.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
  const c = COLOR_CLASSES[child.profile.color];

  const totalCards = CARDS.length;
  const ownedCardsCount = Object.keys(tcg.collection).filter(cardId => tcg.collection[cardId] > 0).length;
  const pctOwned = Math.round((ownedCardsCount / totalCards) * 100);

  const buddyCard = CARDS.find((card) => card.id === tcg.activeBuddyId);

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}`} />
        <h1 className={classNameHelper("font-display text-2xl font-bold text-sky-600", c.text)}>
          SifirDex TCG
        </h1>
        <PointsBadge points={child.rewards.points} />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Buddy Card Showcase (4 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-white/60 rounded-[var(--radius-blob)] p-6 border-2 border-black/5 shadow-md relative overflow-hidden backdrop-blur">
          <h2 className="font-display text-lg font-bold text-ink/80 mb-4 flex items-center gap-1.5">
            <span>⚡</span> Active Buddy Card
          </h2>
          {buddyCard ? (
            <div className="flex flex-col items-center gap-4 animate-rise">
              <TcgCard card={buddyCard} size="md" />
              <Link
                href={`/play/${id}/tcg/binder`}
                className="text-xs font-semibold text-sky-600 hover:underline bg-sky-50 px-3 py-1.5 rounded-full"
              >
                Change Buddy
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl w-64 h-96 bg-slate-50/50">
              <span className="text-5xl mb-4 animate-pulse">🃏</span>
              <p className="text-sm font-semibold text-slate-500 text-center">No Active Buddy Card</p>
              <p className="text-[11px] text-slate-400 text-center mt-1.5">Go to your Binder to choose a favorite companion!</p>
              <Link
                href={`/play/${id}/tcg/binder`}
                className="mt-6 font-display text-xs font-bold bg-sky-500 text-white px-4 py-2 rounded-full shadow-sm hover:bg-sky-600 active:scale-95"
              >
                Choose Card
              </Link>
            </div>
          )}
        </div>

        {/* Collection & Menus (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-5">
          {/* Progress Card */}
          <div className="bg-white/80 rounded-[var(--radius-blob)] p-6 border-2 border-black/5 shadow-md">
            <h3 className="font-display text-lg font-bold text-ink/80 mb-3 flex items-center gap-1.5">
              <span>📚</span> Card Binder Status
            </h3>
            <div className="flex justify-between text-sm font-semibold mb-1.5">
              <span className="text-slate-600">Collected Cards</span>
              <span className={c.text}>{ownedCardsCount} / {totalCards} ({pctOwned}%)</span>
            </div>
            <ProgressBar value={pctOwned} color={child.profile.color} />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Opened Packs: {tcg.openedPacksCount}</span>
              <span>Unique Unlocks: {ownedCardsCount}</span>
            </div>
          </div>

          {/* Nav Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Binder */}
            <Link
              href={`/play/${id}/tcg/binder`}
              className="btn-pop tap flex items-center gap-4 bg-purple-100 p-4 rounded-2xl border-2 border-purple-200"
            >
              <span className="text-4xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">📖</span>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-purple-700">Card Binder</span>
                <span className="text-[11px] text-purple-600 font-medium">Browse your collection</span>
              </div>
            </Link>

            {/* Shop */}
            <Link
              href={`/play/[childId]/tcg/shop`}
              as={`/play/${id}/tcg/shop`}
              className="btn-pop tap flex items-center gap-4 bg-sunny-100 p-4 rounded-2xl border-2 border-sunny-200"
            >
              <span className="text-4xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">🔥</span>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-sunny-700">Booster Shop</span>
                <span className="text-[11px] text-sunny-600 font-medium">Buy packs with points</span>
              </div>
            </Link>

            {/* Deck Builder */}
            <Link
              href={`/play/${id}/tcg/deck`}
              className="btn-pop tap flex items-center gap-4 bg-coral-100 p-4 rounded-2xl border-2 border-coral-200"
            >
              <span className="text-4xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">⚔️</span>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-coral-700">Battle Deck</span>
                <span className="text-[11px] text-coral-600 font-medium">Select your card squad</span>
              </div>
            </Link>

            {/* Battle Arena */}
            <Link
              href={`/play/${id}/tcg/battle`}
              className="btn-pop tap flex items-center gap-4 bg-teal-100 p-4 rounded-2xl border-2 border-teal-200"
            >
              <span className="text-4xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">🏟️</span>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-teal-700">Battle Arena</span>
                <span className="text-[11px] text-teal-600 font-medium">Test your deck power</span>
              </div>
            </Link>

            {/* Sibling Trade */}
            <Link
              href={`/play/${id}/tcg/trade`}
              className="btn-pop tap flex items-center gap-4 bg-sky-100 p-4 rounded-2xl border-2 border-sky-200 sm:col-span-2"
            >
              <span className="text-4xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">🤝</span>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-sky-700">Sibling Trade Request</span>
                <span className="text-[11px] text-sky-600 font-medium">Request to trade duplicate cards with siblings</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function classNameHelper(normal: string, override: string) {
  return normal.split(" ").map(w => w.startsWith("text-") ? override : w).join(" ");
}
