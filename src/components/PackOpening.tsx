"use client";

/*
  Pack-opening experience (Hybrid).
  - Route A (CSS 3D + animejs) for every pull: tear-burst, rarity glow telegraph,
    real 3D card flip, foil shimmer (via TcgCard), particle burst, sound, haptics.
  - Secret Gold pulls cut to a Three.js cinematic, dynamically imported so the 3D
    code only loads when a Secret Gold is actually revealed.
*/

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { animate } from "animejs";
import type { Card, ChildId } from "@/lib/types";
import type { PackConfig } from "@/lib/data";
import { TcgCard } from "@/components/TcgCard";
import { cn } from "@/lib/utils";
import { playRip, playFlip, playReveal, playGold, haptic } from "@/lib/sfx";

const SecretGoldCinematic = dynamic(
  () => import("./SecretGoldCinematic").then((m) => m.SecretGoldCinematic),
  { ssr: false },
);

interface Props {
  pack: PackConfig;
  cards: Card[];
  childId: ChildId;
  onClose: () => void;
}

// Glow colour telegraph by rarity, shown behind the face-down card.
const GLOW: Record<Card["rarity"], string> = {
  common: "shadow-[0_0_24px_6px_rgba(148,163,184,0.45)]",
  uncommon: "shadow-[0_0_26px_8px_rgba(96,165,250,0.5)]",
  rare: "shadow-[0_0_30px_10px_rgba(168,85,247,0.6)]",
  ultra_rare: "shadow-[0_0_36px_12px_rgba(250,204,21,0.7)]",
  secret_gold: "shadow-[0_0_46px_16px_rgba(245,158,11,0.85)]",
};

const PARTICLE_COLOR: Record<string, string> = {
  rare: "#c084fc",
  ultra_rare: "#fde047",
  secret_gold: "#fbbf24",
};

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function burst(host: HTMLElement, color: string) {
  if (reducedMotion()) return;
  for (let i = 0; i < 16; i++) {
    const p = document.createElement("span");
    p.className = "pk-particle";
    p.style.background = color;
    host.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 80;
    animate(p, {
      translateX: Math.cos(ang) * dist,
      translateY: Math.sin(ang) * dist,
      scale: [1, 0],
      opacity: [1, 0],
      duration: 700 + Math.random() * 350,
      ease: "outExpo",
      onComplete: () => p.remove(),
    });
  }
}

export function PackOpening({ pack, cards, childId, onClose }: Props) {
  const [torn, setTorn] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [goldCard, setGoldCard] = useState<Card | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const allRevealed = revealed.length === cards.length;

  const handleTear = useCallback(() => {
    if (torn) return;
    playRip();
    haptic([18, 30, 18]);
    setFlashing(true);
    window.setTimeout(() => setFlashing(false), 450);
    setTorn(true);
  }, [torn]);

  const revealOne = useCallback(
    (index: number) => {
      setRevealed((prev) => {
        if (prev.includes(index)) return prev;
        const card = cards[index];
        playFlip();
        haptic(12);

        if (card.rarity === "secret_gold") {
          // let the flip play, then cut to the cinematic
          window.setTimeout(() => {
            playGold();
            haptic([20, 40, 20, 40, 60]);
            setGoldCard(card);
          }, 620);
        } else {
          window.setTimeout(() => {
            playReveal(card.rarity);
            const host = cardRefs.current[index];
            const color = PARTICLE_COLOR[card.rarity];
            if (host && color) burst(host, color);
          }, 300);
        }
        return [...prev, index];
      });
    },
    [cards],
  );

  const revealAll = useCallback(() => {
    cards.forEach((_, i) => window.setTimeout(() => revealOne(i), i * 220));
  }, [cards, revealOne]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-slate-950/95 p-4">
      {/* Tear flash */}
      {flashing && (
        <div className="pointer-events-none fixed inset-0 z-[55] bg-white pk-flash" />
      )}

      {!torn ? (
        /* ---------- Wrapper phase ---------- */
        <div className="flex flex-col items-center text-center animate-rise">
          <span className="mb-3 text-sm font-bold uppercase tracking-widest text-sky-400">
            You Bought a Pack!
          </span>
          <h2 className="mb-8 font-display text-2xl font-extrabold text-white">
            {pack.name}
          </h2>

          <button
            onClick={handleTear}
            aria-label="Tear open the pack"
            className="group relative h-96 w-64 overflow-hidden rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-indigo-600 via-sky-500 to-indigo-800 p-6 shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0%,transparent_70%)]" />
            <div className="absolute -left-12 -top-12 h-24 w-24 animate-[pulse_2s_infinite] rounded-full bg-sky-400/20 blur-xl" />
            <div className="absolute -bottom-12 -right-12 h-24 w-24 animate-[pulse_4s_infinite] rounded-full bg-pink-500/10 blur-xl" />
            <div className="flex h-full flex-col items-center justify-between">
              <span className="rounded border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                ★ BOOSTER ★
              </span>
              <div className="flex flex-col items-center">
                <span className="select-none text-8xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110">
                  {pack.icon}
                </span>
                <span className="mt-4 select-none text-[10px] font-bold text-sky-200">
                  TAP TO TEAR OPEN
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-display text-lg font-extrabold text-white">
                  SIFIRDEX
                </span>
                <span className="text-[8px] tracking-wider text-sky-300">
                  {cards.length} TRADING CARDS INSIDE
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={handleTear}
            className="mt-8 rounded-full bg-amber-400 px-6 py-2.5 font-display text-sm font-bold text-amber-950 shadow-lg transition-transform hover:bg-amber-500 active:scale-95"
          >
            Rip Card Wrapper!
          </button>
        </div>
      ) : (
        /* ---------- Reveal phase ---------- */
        <div className="flex w-full max-w-4xl flex-col items-center py-6 text-center animate-rise">
          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            Revealing Cards
          </span>
          <h3 className="mb-6 font-display text-lg font-bold text-white">
            Tap each card to flip it over! ({revealed.length} / {cards.length})
          </h3>

          <div className="flex min-h-[240px] flex-wrap items-center justify-center gap-4 md:gap-6">
            {cards.map((card, index) => {
              const isRevealed = revealed.includes(index);
              return (
                <div
                  key={index}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  className="relative h-56 w-40"
                  style={{ perspective: "1000px" }}
                  onClick={() => revealOne(index)}
                >
                  {/* glow telegraph behind the card */}
                  <div
                    className={cn(
                      "absolute inset-2 rounded-[16px] transition-opacity duration-500",
                      GLOW[card.rarity],
                      isRevealed ? "opacity-90" : "opacity-70 animate-pulse",
                    )}
                  />
                  <div
                    className="relative h-full w-full transition-transform duration-700"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isRevealed
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                    }}
                  >
                    {/* Back face */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <TcgCard card={card} size="sm" showBack />
                    </div>
                    {/* Front face */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <TcgCard card={card} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!allRevealed && (
            <button
              onClick={revealAll}
              className="mt-8 rounded-full bg-sky-500 px-6 py-2.5 font-display text-sm font-bold text-white shadow-lg transition-transform hover:bg-sky-600 active:scale-95"
            >
              Reveal All
            </button>
          )}

          {allRevealed && (
            <div className="mt-10 flex flex-col items-center gap-3 animate-rise">
              <span className="text-md animate-pulse font-bold text-amber-400">
                🎉 Awesome pulls! All cards added to binder. 🎉
              </span>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="rounded-full bg-sky-500 px-8 py-3 font-display text-sm font-bold text-white shadow-lg transition-transform hover:bg-sky-600 active:scale-95"
                >
                  Back to Shop
                </button>
                <Link
                  href={`/play/${childId}/tcg/binder`}
                  className="rounded-full bg-purple-500 px-8 py-3 font-display text-sm font-bold text-white shadow-lg transition-transform hover:bg-purple-600 active:scale-95"
                >
                  View in Binder
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {goldCard && (
        <SecretGoldCinematic card={goldCard} onDone={() => setGoldCard(null)} />
      )}
    </div>
  );
}
