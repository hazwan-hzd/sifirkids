"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { CHILD_IDS, PACKS, CARDS, type PackConfig } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { PackOpening } from "@/components/PackOpening";
import { cn } from "@/lib/utils";
import {
  getActiveRuns,
  getPackSupply,
  type TcgRun,
  type PackSupply,
} from "@/lib/tcg-runs";

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
  const [isBuying, setIsBuying] = useState(false);

  // Run tracking state — supports multiple active runs
  const [activeRuns, setActiveRuns] = useState<TcgRun[]>([]);
  const [supplyByRun, setSupplyByRun] = useState<Record<string, PackSupply[]>>({});
  const [supplyLoaded, setSupplyLoaded] = useState(false);

  // Fetch all active runs and their pack supplies on mount
  useEffect(() => {
    async function loadRuns() {
      const runs = await getActiveRuns();
      setActiveRuns(runs);
      const supplyMap: Record<string, PackSupply[]> = {};
      for (const run of runs) {
        supplyMap[run.id] = await getPackSupply(run.id);
      }
      setSupplyByRun(supplyMap);
      setSupplyLoaded(true);
    }
    loadRuns();
  }, []);

  // Refresh supply for all runs after a pack opening closes
  const refreshSupply = async () => {
    const supplyMap: Record<string, PackSupply[]> = {};
    for (const run of activeRuns) {
      supplyMap[run.id] = await getPackSupply(run.id);
    }
    setSupplyByRun(supplyMap);
  };

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];

  // Filter packs: only show packs that have cards with images in their pool
  const availablePacks = PACKS.filter((pack) => {
    const hasImageCards = CARDS.some(
      (card) => pack.allowedSets.includes(card.set) && !!card.imageUrl
    );
    return hasImageCards;
  });

  const handleBuyPack = (pack: PackConfig, runId: string) => {
    const runSupply = supplyByRun[runId] || [];
    const packSupply = runSupply.find((s) => s.pack_type === pack.id);
    if (packSupply && packSupply.remaining <= 0) {
      alert("This pack is SOLD OUT for this run!");
      return;
    }
    if (child.rewards.points < pack.cost) {
      alert(
        "Not enough points! Practice more to earn points."
      );
      return;
    }

    setIsBuying(true);
    setTimeout(() => {
      const cards = buyBoosterPack(id, pack.id, runId);
      if (cards) {
        setOpeningPack(pack);
        setPulledCards(cards);
      } else {
        alert("Purchase failed. Please try again.");
      }
      setIsBuying(false);
    }, 500);
  };

  const handleCloseOpening = () => {
    setOpeningPack(null);
    setPulledCards(null);
    refreshSupply();
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

      {/* Runs + Packs Listing */}
      {!openingPack && (
        <div className="space-y-8">
          {activeRuns.map((run) => {
            const runSupply = supplyByRun[run.id] || [];
            const totalRemaining = runSupply.reduce((sum, s) => sum + s.remaining, 0);
            const isNewest = run.id === activeRuns[activeRuns.length - 1]?.id;

            // Filter packs that exist in this run's inventory
            const runPacks = availablePacks.filter((pack) =>
              runSupply.some((s) => s.pack_type === pack.id)
            );

            if (runPacks.length === 0) return null;

            return (
              <div key={run.id}>
                {/* Run Banner */}
                <div className={cn(
                  "mb-4 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg",
                  isNewest
                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                )}>
                  <div className="flex flex-col">
                    {isNewest && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 rounded-full px-2 py-0.5 mb-1 w-fit">
                        ✨ NEW
                      </span>
                    )}
                    <span className="font-display font-bold text-sm">
                      {run.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {run.id}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold">
                      {totalRemaining} packs left
                    </span>
                  </div>
                </div>

                {/* Packs for this run */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                  {runPacks.map((pack) => {
                    const canAfford = child.rewards.points >= pack.cost;
                    const packSupply = runSupply.find((s) => s.pack_type === pack.id);
                    const isSoldOut = packSupply
                      ? packSupply.remaining <= 0
                      : false;
                    const isDisabled = isSoldOut || !canAfford;

                    return (
                      <div
                        key={pack.id}
                        className={cn(
                          "bg-white rounded-3xl p-5 border-2 border-black/5 shadow-md flex flex-col justify-between relative overflow-hidden transition-all duration-300",
                          isSoldOut
                            ? "opacity-50 grayscale"
                            : canAfford
                            ? "hover:shadow-xl hover:border-slate-200"
                            : "opacity-75"
                        )}
                      >
                        {/* Sold Out Overlay */}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-slate-900/20 z-20 flex items-center justify-center rounded-3xl">
                            <span className="bg-red-600 text-white font-display font-black text-lg px-6 py-2 rounded-full -rotate-12 shadow-xl border-2 border-white">
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        {/* Supply Badge */}
                        {packSupply && !isSoldOut && (
                          <div className="absolute top-3 right-3 z-10">
                            <span
                              className={cn(
                                "font-display font-bold text-[11px] px-2.5 py-1 rounded-full shadow-sm border",
                                packSupply.remaining <= 5
                                  ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                                  : packSupply.remaining <= 10
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {packSupply.remaining}/{packSupply.total_supply}
                            </span>
                          </div>
                        )}

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
                            <span className="text-xs text-slate-400 mt-0.5">
                              Booster Pack
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow text-left">
                          {pack.description}
                        </p>

                        {/* Rarity Pull Rates */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 mb-5 text-[10px] text-left">
                          <span className="font-bold text-slate-500 block mb-1">
                            Card Pull Rates:
                          </span>
                          <div className="grid grid-cols-5 gap-1 text-center font-bold font-display">
                            {pack.rarityWeights.common > 0 && (
                              <div className="flex flex-col bg-slate-200/50 p-1 rounded">
                                <span className="text-[8px] text-slate-500">C</span>
                                <span className="text-slate-700">
                                  {pack.rarityWeights.common}%
                                </span>
                              </div>
                            )}
                            {pack.rarityWeights.uncommon > 0 && (
                              <div className="flex flex-col bg-slate-200/50 p-1 rounded">
                                <span className="text-[8px] text-slate-500">UC</span>
                                <span className="text-slate-700">
                                  {pack.rarityWeights.uncommon}%
                                </span>
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
                            disabled={isBuying || isDisabled}
                            onClick={() => handleBuyPack(pack, run.id)}
                            className={cn(
                              "font-display text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95",
                              isSoldOut
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                : canAfford
                                ? "bg-sky-500 hover:bg-sky-600 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                          >
                            {isBuying
                              ? "Buying..."
                              : isSoldOut
                              ? "Sold Out"
                              : "Rip Pack"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pack Opening (Hybrid: Route A + Secret Gold cinematic) */}
      {openingPack && pulledCards && (
        <PackOpening
          pack={openingPack}
          cards={pulledCards}
          childId={id}
          onClose={handleCloseOpening}
        />
      )}
    </PageShell>
  );
}
