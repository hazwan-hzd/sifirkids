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
  // Per-pack run selection (SK edition picker)
  const [selectedRuns, setSelectedRuns] = useState<Record<string, string>>({});

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

      {/* Packs with SK Edition Selector */}
      {!openingPack && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {availablePacks.map((pack) => {
            // Find which runs carry this pack
            const runsWithPack = activeRuns.filter((run) => {
              const runSupply = supplyByRun[run.id] || [];
              return runSupply.some((s) => s.pack_type === pack.id);
            });

            if (runsWithPack.length === 0) return null;

            // Selected run for this pack (default to newest with supply, fallback to newest overall)
            const defaultRunId = [...runsWithPack].reverse().find((run) => {
              const runSupply = supplyByRun[run.id] || [];
              const s = runSupply.find((rs) => rs.pack_type === pack.id);
              return s && s.remaining > 0;
            })?.id || runsWithPack[runsWithPack.length - 1]?.id;

            const selectedRunId = selectedRuns[pack.id] || defaultRunId;
            const selectedRunSupply = (supplyByRun[selectedRunId] || []).find((s) => s.pack_type === pack.id);
            const canAfford = child.rewards.points >= pack.cost;
            const isSoldOut = selectedRunSupply ? selectedRunSupply.remaining <= 0 : false;
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
                  <div className="absolute inset-0 bg-slate-900/20 z-20 pointer-events-none flex items-center justify-center rounded-3xl">
                    <span className="bg-red-600 text-white font-display font-black text-lg px-6 py-2 rounded-full -rotate-12 shadow-xl border-2 border-white">
                      SOLD OUT
                    </span>
                  </div>
                )}

                {/* Supply Badge */}
                {selectedRunSupply && !isSoldOut && (
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={cn(
                        "font-display font-bold text-[11px] px-2.5 py-1 rounded-full shadow-sm border",
                        selectedRunSupply.remaining <= 5
                          ? "bg-red-100 text-red-700 border-red-200 animate-pulse"
                          : selectedRunSupply.remaining <= 10
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {selectedRunSupply.remaining}/{selectedRunSupply.total_supply}
                    </span>
                  </div>
                )}

                {/* Visual Pack Wrapper Graphic */}
                <div className="flex items-center gap-4 mb-4">
                  {pack.imageUrl ? (
                    <div className="w-16 h-20 relative flex-shrink-0 drop-shadow-md">
                      <img src={pack.imageUrl} alt={pack.name} className="w-full h-full object-contain" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border border-indigo-200 flex items-center justify-center font-black text-[9px] text-indigo-950 shadow-sm z-20">
                        {pack.cardCount}
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-20 flex-shrink-0 bg-gradient-to-br from-indigo-500 via-sky-400 to-indigo-600 rounded-xl flex items-center justify-center border border-sky-300 shadow-md relative overflow-hidden">
                      <span className="text-4xl z-10">{pack.icon}</span>
                      <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-bl-lg border-l border-b border-indigo-200 flex items-center justify-center font-black text-[8px] text-indigo-950 z-20">
                        {pack.cardCount}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <h2 className="font-display text-lg font-bold text-slate-800 leading-tight">
                      {pack.name}
                    </h2>
                    <span className="text-xs text-slate-400 mt-0.5">
                      Booster Pack
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-grow text-left">
                  {pack.description}
                </p>

                {/* SK Edition Selector */}
                <div className="mb-4 relative z-30">
                  <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Edition
                  </span>
                  <div className="flex gap-1.5">
                    {runsWithPack.map((run) => {
                      const isNewest = run.id === activeRuns[activeRuns.length - 1]?.id;
                      const runPSupply = (supplyByRun[run.id] || []).find((s) => s.pack_type === pack.id);
                      const runSoldOut = runPSupply ? runPSupply.remaining <= 0 : true;
                      const isSelected = selectedRunId === run.id;
                      const label = run.id.replace("RUN-", "").replace("-01", "");

                      return (
                        <button
                          key={run.id}
                          onClick={() => setSelectedRuns((prev) => ({ ...prev, [pack.id]: run.id }))}
                          className={cn(
                            "relative flex flex-col items-center px-3 py-1.5 rounded-xl text-[11px] font-display font-bold transition-all border-2",
                            isSelected
                              ? isNewest
                                ? "bg-orange-50 border-orange-400 text-orange-700 shadow-sm"
                                : "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                              : runSoldOut
                              ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {isNewest && (
                            <span className="absolute -top-1.5 -right-1 text-[8px] bg-orange-500 text-white rounded-full px-1 font-black leading-tight">
                              NEW
                            </span>
                          )}
                          <span>{label}</span>
                          {runPSupply && (
                            <span className={cn(
                              "text-[9px] font-normal",
                              runSoldOut ? "text-red-400" : "text-slate-400"
                            )}>
                              {runSoldOut ? "Sold Out" : `${runPSupply.remaining} left`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                    onClick={() => handleBuyPack(pack, selectedRunId)}
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
