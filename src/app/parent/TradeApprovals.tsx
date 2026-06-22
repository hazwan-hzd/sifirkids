"use client";

import { useApp } from "@/lib/store";
import { getProfile, CARDS } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { Button } from "@/components/ui";

export function TradeApprovals() {
  const { state, resolveTradeRequest } = useApp();

  const pending = (state.pendingTrades ?? []).filter((t) => t.status === "pending");

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-grape-600">
        🤝 Sibling Trade Approvals
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-sky-500 px-2 py-0.5 align-middle text-sm text-white">
            {pending.length}
          </span>
        )}
      </h3>

      {pending.length === 0 ? (
        <p className="text-sm text-ink/50">No pending trade requests.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((trade) => {
            const sender = getProfile(trade.fromChildId as ChildId);
            const receiver = getProfile(trade.toChildId as ChildId);
            const offerCard = CARDS.find((c) => c.id === trade.offeredCardId);
            const reqCard = CARDS.find((c) => c.id === trade.requestedCardId);

            if (!offerCard || !reqCard) return null;

            return (
              <li
                key={trade.id}
                className="flex flex-col gap-3 rounded-2xl bg-cream p-4 text-left border border-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="text-xs font-bold text-slate-500">
                    Trade Request on {new Date(trade.date).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="md"
                      color="teal"
                      onClick={() => resolveTradeRequest(trade.id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="md"
                      color="coral"
                      variant="soft"
                      onClick={() => resolveTradeRequest(trade.id, false)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-1 text-slate-700">
                  {/* Sender offer */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sender.avatar}</span>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{sender.name} offers:</div>
                      <div className="font-semibold text-sky-600 mt-0.5">
                        {offerCard.emoji} {offerCard.name} ({offerCard.rarity.replace("_", " ")})
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="text-2xl text-slate-400 font-bold hidden sm:inline">⇄</span>

                  {/* Receiver request */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{receiver.avatar}</span>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{receiver.name} gives:</div>
                      <div className="font-semibold text-purple-600 mt-0.5">
                        {reqCard.emoji} {reqCard.name} ({reqCard.rarity.replace("_", " ")})
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink/50">Approving trades will exchange card ownership between the siblings. Denied trades simply cancel the request.</p>
    </div>
  );
}
