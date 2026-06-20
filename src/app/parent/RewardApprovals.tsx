"use client";

import { useApp } from "@/lib/store";
import { getProfile } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { Button } from "@/components/ui";

export function RewardApprovals() {
  const { state, resolveClaim } = useApp();

  const pending = (Object.keys(state.children) as ChildId[]).flatMap((id) =>
    state.children[id].rewards.claims
      .filter((c) => c.status === "pending")
      .map((c) => ({ childId: id, claim: c })),
  );

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 font-display text-lg font-bold text-grape-600">
        🎁 Reward Approvals
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-coral-500 px-2 py-0.5 align-middle text-sm text-white">
            {pending.length}
          </span>
        )}
      </h3>

      {pending.length === 0 ? (
        <p className="text-sm text-ink/50">No pending requests.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map(({ childId, claim }) => (
            <li
              key={claim.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  {claim.icon}
                </span>
                <div>
                  <div className="font-display font-semibold text-ink">{claim.name}</div>
                  <div className="text-xs text-ink/60">
                    {getProfile(childId).name} · {claim.cost} ⭐ ·{" "}
                    {new Date(claim.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="md"
                  color="teal"
                  onClick={() => resolveClaim(childId, claim.id, true)}
                >
                  Approve
                </Button>
                <Button
                  size="md"
                  color="coral"
                  variant="soft"
                  onClick={() => resolveClaim(childId, claim.id, false)}
                >
                  Deny
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink/50">Denied requests refund the child&apos;s points.</p>
    </div>
  );
}
