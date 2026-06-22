"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, PACKS, CARDS, type PackConfig } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";
import { cn } from "@/lib/utils";

export default function TcgShopPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, buyBoosterPack } = useApp();
  const [openingPack, setOpeningPack] = useState<PackConfig | null>(null);
  const [pulledCards, setPulledCards] = useState<Card[] | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [ripWrapper, setRipWrapper] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];

  const handleBuyPack = (pack: PackConfig) => {
    if (child.rewards.points < pack.cost) {
      alert("Not enough points! Practice more times tables or Arabic letters to earn points.");
      return;
    }

    setIsBuying(true);
    // Add small delay to simulate purchasing feel
    setTimeout(() => {
      const cards = buyBoosterPack(id, pack.id);
      if (cards) {
        setOpeningPack(pack);
        setPulledCards(cards);
        setRevealedIndices([]);
        setRipWrapper(false);
      } else {
        alert("Purchase failed. Please try again.");
      }
      setIsBuying(false);
    }, 500);
  };

  const handleRipWrapper = () => {
    setRipWrapper(true);
  };

  const handleCardClick = (index: number) => {
    if (revealedIndices.includes(index)) return;
    setRevealedIndices([...revealedIndices, index]);
  };

  const isAllRevealed = pulledCards && revealedIndices.length === pulledCards.length;

  const handleCloseOpening = () => {
    setOpeningPack(null);
    setPulledCards(null);
    setRevealedIndices([]);
    setRipWrapper(false);
  };

  return (
    <PageShell>
      {/* Header */}
      {!openingPack && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <BackButton href={`/play/${id}/tcg`} />
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Booster Shop
          </h1>
          <PointsBadge points={child.rewards.points} />
        </div>
      )}

      {/* Packs Listing */}
      {!openingPack && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {PACKS.map((pack) => {
            const canAfford = child.rewards.points >= pack.cost;
            return (
              <div
                key={pack.id}
                className={cn(
                  "bg-white rounded-3xl p-5 border-2 border-black/5 shadow-md flex flex-col justify-between relative overflow-hidden transition-all duration-300",
                  canAfford ? "hover:shadow-xl hover:border-slate-200" : "opacity-75"
                )}
              >
                {/* Visual Pack Wrapper Graphic */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-indigo-500 via-sky-400 to-indigo-600 rounded-xl flex items-center justify-center border border-sky-300 shadow-md relative overflow-hidden">
                    <span className="text-4xl z-10">{pack.icon}</span>
                    <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-bl-lg border-l border-b border-indigo-200 flex items-center justify-center font-black text-[8px] text-indigo-950">
                      5
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <h2 className="font-display text-lg font-bold text-slate-800 leading-tight">
                      {pack.name}
                    </h2>
                    <span className="text-xs text-slate-400 mt-0.5">Booster Pack</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow text-left">
                  {pack.description}
                </p>

                {/* Rarity Pull Rates (Probabilities) */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 mb-5 text-[10px] text-left">
                  <span className="font-bold text-slate-500 block mb-1">Card Pull Rates:</span>
                  <div className="grid grid-cols-5 gap-1 text-center font-bold font-display">
                    {pack.rarityWeights.common > 0 && (
                      <div className="flex flex-col bg-slate-200/50 p-1 rounded">
                        <span className="text-[8px] text-slate-500">C</span>
                        <span className="text-slate-700">{pack.rarityWeights.common}%</span>
                      </div>
                    )}
                    {pack.rarityWeights.uncommon > 0 && (
                      <div className="flex flex-col bg-slate-200/50 p-1 rounded">
                        <span className="text-[8px] text-slate-500">UC</span>
                        <span className="text-slate-700">{pack.rarityWeights.uncommon}%</span>
                      </div>
                    )}
                    {pack.rarityWeights.rare > 0 && (
                      <div className="flex flex-col bg-purple-50 p-1 rounded text-purple-700">
                        <span className="text-[8px] text-purple-500">R</span>
                        <span>{pack.rarityWeights.rare}%</span>
                      </div>
                    )}
                    {pack.rarityWeights.ultra_rare > 0 && (
                      <div className="flex flex-col bg-yellow-50 p-1 rounded text-yellow-700">
                        <span className="text-[8px] text-yellow-600">UR</span>
                        <span>{pack.rarityWeights.ultra_rare}%</span>
                      </div>
                    )}
                    {pack.rarityWeights.secret_gold > 0 && (
                      <div className="flex flex-col bg-amber-50 p-1 rounded text-amber-700 border border-amber-200 animate-pulse">
                        <span className="text-[8px] text-amber-600">SEC</span>
                        <span>{pack.rarityWeights.secret_gold}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="font-display text-md font-bold text-amber-500 flex items-center gap-1">
                    <span>🪙</span> {pack.cost.toLocaleString()} pts
                  </span>

                  <button
                    disabled={isBuying}
                    onClick={() => handleBuyPack(pack)}
                    className={cn(
                      "font-display text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95",
                      canAfford
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isBuying ? "Buying..." : "Rip Pack"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pack Opening Arena Modal (Active Opening View) */}
      {openingPack && pulledCards && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* Packaging Wrapper Phase */}
          {!ripWrapper ? (
            <div className="flex flex-col items-center justify-center text-center animate-rise">
              <span className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-3">You Bought a Pack!</span>
              <h2 className="font-display text-2xl font-extrabold text-white mb-8">{openingPack.name}</h2>

              {/* Wrapper Container */}
              <div
                onClick={handleRipWrapper}
                className="w-64 h-96 bg-gradient-to-br from-indigo-600 via-sky-500 to-indigo-800 rounded-2xl border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-between p-6 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden"
              >
                {/* Shiny lines overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)] animate-pulse" />
                <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-sky-400/20 blur-xl animate-[pulse_2s_infinite]" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-pink-500/10 blur-xl animate-[pulse_4s_infinite]" />

                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider border border-amber-400/40 px-2 py-0.5 rounded">
                  ★ BOOSTER ★
                </span>

                <div className="flex flex-col items-center">
                  <span className="text-8xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] select-none">
                    {openingPack.icon}
                  </span>
                  <span className="text-[10px] font-bold text-sky-200 mt-4 select-none">
                    TAP TO TEAR OPEN
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-display font-extrabold text-lg text-white">SIFIRDEX</span>
                  <span className="text-[8px] text-sky-300 tracking-wider">5 TRADING CARDS INSIDE</span>
                </div>
              </div>

              <button
                onClick={handleRipWrapper}
                className="mt-8 font-display text-sm font-bold bg-amber-400 hover:bg-amber-500 text-amber-950 px-6 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                Rip Card Wrapper!
              </button>
            </div>
          ) : (
            /* Card Revealing Phase */
            <div className="w-full max-w-4xl flex flex-col items-center justify-center py-6 text-center animate-rise">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                Revealing Cards
              </span>
              <h3 className="font-display text-lg font-bold text-white mb-6">
                Tap each card to flip it over! ({revealedIndices.length} / 5)
              </h3>

              {/* Pulled Cards Grid */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 min-h-[384px]">
                {pulledCards.map((card, index) => {
                  const isRevealed = revealedIndices.includes(index);
                  const isGold = card.rarity === "secret_gold";

                  return (
                    <div
                      key={index}
                      className={cn(
                        "relative transition-all duration-500",
                        isRevealed ? "[transform-style:preserve-3d]" : "hover:-translate-y-2 active:scale-95 cursor-pointer"
                      )}
                      onClick={() => handleCardClick(index)}
                    >
                      <TcgCard
                        card={card}
                        size="md"
                        showBack={!isRevealed}
                        className={cn(
                          "transition-all duration-500",
                          isRevealed && isGold && "animate-[bounce_1.5s_ease-in-out_infinite]"
                        )}
                      />
                      
                      {/* Shiny aura behind card when gold pulled */}
                      {isRevealed && isGold && (
                        <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 rounded-[20px] blur-md opacity-75 -z-10 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Complete Footer Button */}
              {isAllRevealed && (
                <div className="mt-10 animate-rise flex flex-col items-center gap-3">
                  <span className="text-md text-amber-400 font-bold animate-pulse">🎉 Awesome pulls! All cards added to binder. 🎉</span>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCloseOpening}
                      className="font-display text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                      Back to Shop
                    </button>
                    <Link
                      href={`/play/${id}/tcg/binder`}
                      className="font-display text-sm font-bold bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                      View in Binder
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
