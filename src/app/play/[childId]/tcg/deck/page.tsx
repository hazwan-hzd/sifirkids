"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, CARDS, COLOR_CLASSES } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";
import { cn } from "@/lib/utils";

export default function TcgDeckPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, setTcgDeck } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

  // Get owned cards
  const ownedCards = CARDS.filter((card) => (tcg.collection[card.id] ?? 0) > 0);

  // Deck cards details
  const deckCards = tcg.activeDeck
    .map((cardId) => CARDS.find((card) => card.id === cardId))
    .filter((card): card is Card => !!card);

  const handleRemoveFromDeck = (cardId: string) => {
    const nextDeck = tcg.activeDeck.filter((id) => id !== cardId);
    setTcgDeck(id, nextDeck);
  };

  const handleAddToDeck = (cardId: string) => {
    if (tcg.activeDeck.includes(cardId)) return;
    if (tcg.activeDeck.length >= 5) {
      alert("Deck is full! Remove a card from your deck first.");
      return;
    }
    const nextDeck = [...tcg.activeDeck, cardId];
    setTcgDeck(id, nextDeck);
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}/tcg`} />
        <h1 className="font-display text-2xl font-bold text-slate-800">
          Battle Deck
        </h1>
        <PointsBadge points={child.rewards.points} />
      </div>

      {/* Main layout */}
      <div className="flex flex-col gap-6">
        {/* Current Deck Section */}
        <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚔️</span> Your Deck
              </h2>
              <span className="text-[11px] text-slate-400">Assemble exactly 5 character cards to enter the arena</span>
            </div>
            <span className={cn("font-display text-sm font-extrabold px-3 py-1.5 rounded-full", tcg.activeDeck.length === 5 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
              {tcg.activeDeck.length} / 5 Cards
            </span>
          </div>

          {/* Deck Cards Grid */}
          <div className="flex flex-wrap items-center justify-start gap-4 min-h-[192px]">
            {deckCards.map((card) => (
              <div key={card.id} className="relative group animate-rise">
                <TcgCard card={card} size="sm" />
                <button
                  onClick={() => handleRemoveFromDeck(card.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-md active:scale-90 outline-none"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: 5 - deckCards.length }).map((_, idx) => (
              <div
                key={idx}
                className="w-40 h-56 rounded-[16px] border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 select-none"
              >
                <span className="text-2xl mb-1">➕</span>
                <span className="text-[10px] font-bold">Slot {deckCards.length + idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owned Cards Pool */}
        <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md text-left">
          <h2 className="font-display text-lg font-bold text-slate-800 mb-1.5">
            🎒 Owned Cards Pool
          </h2>
          <p className="text-[11px] text-slate-400 mb-4 border-b border-slate-100 pb-2">
            Tap a card below to add it to your deck!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ownedCards.map((card) => {
              const inDeck = tcg.activeDeck.includes(card.id);
              const qty = tcg.collection[card.id] ?? 0;
              return (
                <div
                  key={card.id}
                  onClick={() => (inDeck ? handleRemoveFromDeck(card.id) : handleAddToDeck(card.id))}
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 hover:scale-105",
                    inDeck && "opacity-75"
                  )}
                >
                  <TcgCard card={card} quantity={qty} size="sm" />
                  {inDeck && (
                    <div className="absolute inset-0 bg-slate-950/40 rounded-[16px] flex items-center justify-center z-30">
                      <span className="text-white text-xs font-black bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/20">
                        In Deck ⚔️
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {ownedCards.length === 0 && (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl">
              <span className="text-4xl">🎒</span>
              <p className="text-sm font-semibold text-slate-400 mt-2">No cards in your collection pool!</p>
              <p className="text-[10px] text-slate-400 mt-1">Go to the Booster Shop and purchase packs to start collecting.</p>
              <Link
                href={`/play/${id}/tcg/shop`}
                className="inline-block mt-4 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full shadow-sm"
              >
                Go to Shop
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
