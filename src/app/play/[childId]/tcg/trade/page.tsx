"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, CARDS, PROFILES, COLOR_CLASSES } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";
import { cn } from "@/lib/utils";

export default function TcgTradePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, createTradeRequest } = useApp();
  
  // Selection States
  const [selectedSiblingId, setSelectedSiblingId] = useState<ChildId | "">("");
  const [offeredCardId, setOfferedCardId] = useState<string>("");
  const [requestedCardId, setRequestedCardId] = useState<string>("");
  const [tradeSubmitted, setTradeSubmitted] = useState<boolean>(false);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];
  const siblings = PROFILES.filter((p) => p.id !== id);

  // offered card candidates: cards where quantity >= 2 (duplicates only to keep collections safe!)
  const childTcg = child.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
  const offeredCandidates = CARDS.filter(
    (card) => (childTcg.collection[card.id] ?? 0) >= 2
  );

  // requested card candidates: cards owned by the selected sibling
  const selectedSibling = selectedSiblingId ? state.children[selectedSiblingId] : null;
  const siblingTcg = selectedSibling?.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
  const requestedCandidates = selectedSibling
    ? CARDS.filter((card) => (siblingTcg.collection[card.id] ?? 0) >= 1)
    : [];

  const handleSiblingChange = (siblingId: ChildId) => {
    setSelectedSiblingId(siblingId);
    setRequestedCardId("");
  };

  const handleOfferCardSelect = (cardId: string) => {
    setOfferedCardId(cardId);
  };

  const handleRequestCardSelect = (cardId: string) => {
    setRequestedCardId(cardId);
  };

  const handleSendTradeRequest = () => {
    if (!selectedSiblingId || !offeredCardId || !requestedCardId) {
      alert("Please select a sibling, a card to offer, and a card to request!");
      return;
    }

    createTradeRequest(id, selectedSiblingId, offeredCardId, requestedCardId);
    setTradeSubmitted(true);
  };

  const offeredCard = CARDS.find((c) => c.id === offeredCardId);
  const requestedCard = CARDS.find((c) => c.id === requestedCardId);
  const siblingProfile = PROFILES.find((p) => p.id === selectedSiblingId);

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}/tcg`} />
        <h1 className="font-display text-2xl font-bold text-slate-800">
          Trade Center
        </h1>
        <PointsBadge points={child.rewards.points} />
      </div>

      {!tradeSubmitted ? (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto text-left">
          {/* Sibling selection */}
          <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md">
            <h2 className="font-display text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <span>🤝</span> 1. Select a Sibling to Trade With
            </h2>
            <div className="flex gap-4">
              {siblings.map((sib) => (
                <button
                  key={sib.id}
                  onClick={() => handleSiblingChange(sib.id)}
                  className={cn(
                    "flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                    selectedSiblingId === sib.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-4xl">{sib.avatar}</span>
                  <span className="font-display font-bold text-slate-700 text-sm">{sib.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards exchange area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Offer list (Your duplicates) */}
            <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md flex flex-col">
              <h2 className="font-display text-md font-extrabold text-slate-800 mb-1">
                📤 2. Choose a Card to Give (Offered)
              </h2>
              <span className="text-[10px] text-slate-400 mb-4 border-b border-slate-100 pb-2">
                Only duplicate cards (2 or more copies) can be offered to protect collections.
              </span>

              {offeredCandidates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] p-1">
                  {offeredCandidates.map((card) => {
                    const isSelected = offeredCardId === card.id;
                    const qty = childTcg.collection[card.id] ?? 0;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleOfferCardSelect(card.id)}
                        className={cn(
                          "relative cursor-pointer transition-all border-4 rounded-[20px]",
                          isSelected ? "border-sky-500 scale-95" : "border-transparent"
                        )}
                      >
                        <TcgCard card={card} quantity={qty} size="sm" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl my-auto text-slate-400 text-xs">
                  🔒 You don't have any duplicate cards to trade yet! Keep opening packs in the shop.
                </div>
              )}
            </div>

            {/* Request list (Sibling's cards) */}
            <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md flex flex-col">
              <h2 className="font-display text-md font-extrabold text-slate-800 mb-1">
                📥 3. Choose a Card to Get (Requested)
              </h2>
              <span className="text-[10px] text-slate-400 mb-4 border-b border-slate-100 pb-2">
                Choose one card owned by your selected sibling.
              </span>

              {!selectedSiblingId ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl my-auto text-slate-400 text-xs">
                  👈 Please select a sibling first.
                </div>
              ) : requestedCandidates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] p-1">
                  {requestedCandidates.map((card) => {
                    const isSelected = requestedCardId === card.id;
                    const qty = siblingTcg.collection[card.id] ?? 0;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleRequestCardSelect(card.id)}
                        className={cn(
                          "relative cursor-pointer transition-all border-4 rounded-[20px]",
                          isSelected ? "border-sky-500 scale-95" : "border-transparent"
                        )}
                      >
                        <TcgCard card={card} quantity={qty} size="sm" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl my-auto text-slate-400 text-xs">
                  Sibling has no cards in their collection yet!
                </div>
              )}
            </div>
          </div>

          {/* Trade Preview & Submit */}
          {offeredCard && requestedCard && siblingProfile && (
            <div className="bg-white/90 rounded-[var(--radius-blob)] p-6 border-2 border-sky-200 shadow-lg text-center animate-rise">
              <h3 className="font-display text-lg font-bold text-slate-800 mb-4">Trade Summary</h3>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
                {/* Offered */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">You Give:</span>
                  <TcgCard card={offeredCard} size="sm" />
                </div>

                {/* Arrow */}
                <span className="text-4xl text-sky-500 animate-pulse">⇄</span>

                {/* Requested */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">{siblingProfile.name} Gives:</span>
                  <TcgCard card={requestedCard} size="sm" />
                </div>
              </div>

              <button
                onClick={handleSendTradeRequest}
                className="font-display text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                Send Trade Request to Papa 👨
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Success Screen */
        <div className="bg-white/80 rounded-[var(--radius-blob)] p-8 border-2 border-black/5 shadow-md text-center max-w-md mx-auto animate-rise">
          <span className="text-7xl mb-4 block">💌</span>
          <h2 className="font-display text-2xl font-black text-slate-800 mb-2">Request Sent!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your trade request has been successfully submitted! It will occur once Papa approves it in the Parent Dashboard.
          </p>

          <Link
            href={`/play/${id}/tcg`}
            className="font-display text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl shadow-md active:scale-95 block text-center"
          >
            Back to TCG Hub
          </Link>
        </div>
      )}
    </PageShell>
  );
}
