"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const { state } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function submit(value: string) {
    if (value === state.parentPin) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 600);
    }
  }

  function press(d: string) {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
  }

  return (
    <Card className={cn("mx-auto max-w-sm text-center", error && "animate-[shake_0.4s]")}>
      <div className="mb-2 text-5xl">🔒</div>
      <h2 className="font-display text-2xl font-bold text-grape-600">Parents only</h2>
      <p className="mb-4 text-sm text-ink/60">Enter your PIN</p>

      <div className="mb-5 flex justify-center gap-2">
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 border-grape-400",
              i < pin.length && "bg-grape-500",
              error && "border-coral-500",
            )}
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-[15rem] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="tap btn-pop h-14 rounded-2xl bg-cream font-display text-2xl font-bold text-ink"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          className="tap h-14 rounded-2xl font-display text-xl text-ink/60"
          aria-label="Delete"
        >
          ⌫
        </button>
        <button
          onClick={() => press("0")}
          className="tap btn-pop h-14 rounded-2xl bg-cream font-display text-2xl font-bold text-ink"
        >
          0
        </button>
        <button
          onClick={() => submit(pin)}
          className="tap btn-pop h-14 rounded-2xl bg-grape-500 font-display text-xl font-bold text-white"
          aria-label="Enter"
        >
          ✓
        </button>
      </div>

      {error && <p className="mt-3 font-display text-coral-600">Wrong PIN, try again</p>}
      <p className="mt-4 text-xs text-ink/40">Default PIN is 1234</p>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </Card>
  );
}
