"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, CARDS, COLOR_CLASSES } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";

export default function TcgBinderPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, setTcgBuddy, setTcgDeck } = useApp();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [filterOwned, setFilterOwned] = useState<"all" | "owned" | "unowned">("all");
  const [sortBy, setSortBy] = useState<"default" | "series" | "name">("default");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

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

  // Filter logic
  const filteredCards = CARDS.filter((card) => {
    const qty = tcg.collection[card.id] ?? 0;
    const isOwned = qty > 0;

    if (filterType !== "all" && card.type !== filterType) return false;
    if (filterRarity !== "all" && card.rarity !== filterRarity) return false;
    if (filterOwned === "owned" && !isOwned) return false;
    if (filterOwned === "unowned" && isOwned) return false;
    return true;
  });

  const SERIES_NAMES: Record<string, string> = {
    starter: "Series 1: Pokemon x One Piece Hybrid (Starter)",
    monsters: "Series 1: Pokemon x One Piece Hybrid (Monsters)",
    crews: "Series 2: One Piece Crews",
    mha: "Series 3: My Hero Academia",
    jjk: "Series 4: Jujutsu Kaisen",
    fifa: "Series 5: FIFA Football",
    net: "Series 6: Cybersecurity",
    squishy: "Series 7: Squishy Squad",
  };

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === "series") {
      const nameA = SERIES_NAMES[a.set] ?? "Unknown Series";
      const nameB = SERIES_NAMES[b.set] ?? "Unknown Series";
      return nameA.localeCompare(nameB);
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
  };

  const isBuddy = selectedCard ? tcg.activeBuddyId === selectedCard.id : false;
  const isDeck = selectedCard ? tcg.activeDeck.includes(selectedCard.id) : false;
  const quantity = selectedCard ? tcg.collection[selectedCard.id] ?? 0 : 0;
  const isCardOwned = quantity > 0;

  const handleToggleBuddy = () => {
    if (!selectedCard) return;
    setTcgBuddy(id, isBuddy ? null : selectedCard.id);
  };

  const handleToggleDeck = () => {
    if (!selectedCard) return;
    if (isDeck) {
      setTcgDeck(id, tcg.activeDeck.filter(cardId => cardId !== selectedCard.id));
    } else {
      if (tcg.activeDeck.length >= 5) {
        alert("Deck is full! Remove another card first.");
        return;
      }
      setTcgDeck(id, [...tcg.activeDeck, selectedCard.id]);
    }
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}/tcg`} />
        <h1 className="font-display text-2xl font-bold text-slate-800">
          Card Binder
        </h1>
        <PointsBadge points={child.rewards.points} />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/80 rounded-[var(--radius-blob)] p-4 border-2 border-black/5 shadow-sm mb-6 flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap gap-2.5">
          {/* Element Type */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-500">Element Type</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-100 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Elements</option>
              <option value="fire">🔥 Fire</option>
              <option value="water">💧 Water</option>
              <option value="grass">🍃 Grass</option>
              <option value="lightning">⚡ Lightning</option>
              <option value="strawhat">👒 Strawhat</option>
              <option value="marine">⚓ Marine</option>
              <option value="shadow">👁️ Shadow</option>
              <option value="legendary">👑 Legendary</option>
              <option value="squishy">🧸 Squishy</option>
            </select>
          </div>

          {/* Rarity */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-500">Rarity</span>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="bg-slate-100 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="ultra_rare">Ultra Rare</option>
              <option value="secret_gold">Secret Gold</option>
            </select>
          </div>

          {/* Owned Status */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-500">Collection Status</span>
            <select
              value={filterOwned}
              onChange={(e) => setFilterOwned(e.target.value as any)}
              className="bg-slate-100 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
            >
              <option value="all">Show All Cards</option>
              <option value="owned">Owned Only</option>
              <option value="unowned">Locked Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-slate-500">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-100 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none"
            >
              <option value="default">Default</option>
              <option value="series">Series Name</option>
              <option value="name">Card Name</option>
            </select>
          </div>
        </div>

        <div className="font-semibold text-slate-500 mt-2 sm:mt-0">
          Showing {sortedCards.length} cards
        </div>
      </div>

      {/* Binder Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
        {sortedCards.map((card) => {
          const qty = tcg.collection[card.id] ?? 0;
          const isOwned = qty > 0;
          const isCurrentBuddy = tcg.activeBuddyId === card.id;
          const isCurrentDeck = tcg.activeDeck.includes(card.id);

          return (
            <div
              key={card.id}
              className="relative flex flex-col items-center group cursor-pointer"
              onClick={() => handleSelectCard(card)}
            >
              <TcgCard card={card} quantity={qty} isLocked={!isOwned} size="sm" />
              
              {/* Binder markers */}
              {isOwned && (
                <div className="absolute top-2 left-2 flex gap-1 z-30">
                  {isCurrentBuddy && (
                    <span className="text-xs bg-sky-500 border border-white text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">
                      ⚡
                    </span>
                  )}
                  {isCurrentDeck && (
                    <span className="text-[10px] bg-red-500 border border-white text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">
                      ⚔️
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedCards.length === 0 && (
        <div className="bg-white/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <span className="text-5xl">🔍</span>
          <h3 className="font-display font-bold text-slate-500 mt-3">No matching cards found</h3>
          <p className="text-xs text-slate-400 mt-1">Try changing your filters or purchase packs in the Booster Shop!</p>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full border-2 border-slate-200 shadow-2xl relative animate-rise flex flex-col items-center gap-5">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center outline-none active:scale-90 transition-transform"
            >
              ✕
            </button>

            {/* Display Card */}
            <TcgCard
              card={selectedCard}
              quantity={tcg.collection[selectedCard.id] ?? 0}
              isLocked={!(tcg.collection[selectedCard.id] > 0)}
              size="md"
            />

            {/* Actions for owned cards */}
            {isCardOwned ? (
              <div className="w-full flex flex-col gap-2 mt-2">
                <button
                  onClick={handleToggleBuddy}
                  className={`w-full py-2.5 rounded-xl font-display font-bold text-xs shadow-sm transition-all active:scale-95 ${
                    isBuddy
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-sky-500 text-white hover:bg-sky-600"
                  }`}
                >
                  {isBuddy ? "Remove as Buddy ⚡" : "Set as Buddy Card ⚡"}
                </button>
                <button
                  onClick={handleToggleDeck}
                  className={`w-full py-2.5 rounded-xl font-display font-bold text-xs shadow-sm transition-all active:scale-95 ${
                    isDeck
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {isDeck ? "Remove from Battle Deck ⚔️" : "Add to Battle Deck ⚔️"}
                </button>
              </div>
            ) : (
              <div className="text-center p-3.5 bg-slate-100 rounded-2xl w-full text-slate-500 text-xs font-semibold">
                🔒 You haven't unlocked this card yet! Collect points and buy packs in the shop to pull it.
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
