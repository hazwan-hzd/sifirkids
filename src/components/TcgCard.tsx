"use client";

import React, { useRef, useState } from "react";
import type { Card } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TcgCardProps {
  card: Card;
  quantity?: number;
  isLocked?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBack?: boolean;
}

const TYPE_STYLES = {
  fire: {
    bg: "from-orange-500 via-red-500 to-amber-600",
    border: "border-red-600",
    text: "text-red-100",
    badge: "bg-red-700 text-red-100",
    icon: "🔥",
  },
  water: {
    bg: "from-sky-500 via-blue-500 to-indigo-600",
    border: "border-blue-600",
    text: "text-blue-100",
    badge: "bg-blue-700 text-blue-100",
    icon: "💧",
  },
  grass: {
    bg: "from-green-500 via-emerald-500 to-teal-600",
    border: "border-emerald-600",
    text: "text-emerald-100",
    badge: "bg-emerald-700 text-emerald-100",
    icon: "🍃",
  },
  lightning: {
    bg: "from-yellow-400 via-amber-400 to-yellow-600",
    border: "border-yellow-600",
    text: "text-yellow-950",
    badge: "bg-yellow-700 text-yellow-100",
    icon: "⚡",
  },
  strawhat: {
    bg: "from-cyan-400 via-sky-500 to-blue-600",
    border: "border-sky-600",
    text: "text-sky-100",
    badge: "bg-sky-700 text-sky-100",
    icon: "👒",
  },
  marine: {
    bg: "from-slate-100 via-slate-200 to-blue-900",
    border: "border-slate-400",
    text: "text-slate-900",
    badge: "bg-blue-800 text-white",
    icon: "⚓",
  },
  shadow: {
    bg: "from-purple-900 via-slate-900 to-violet-950",
    border: "border-purple-800",
    text: "text-purple-100",
    badge: "bg-purple-950 text-purple-100",
    icon: "👁️",
  },
  legendary: {
    bg: "from-indigo-600 via-purple-600 to-pink-600",
    border: "border-pink-600",
    text: "text-pink-100",
    badge: "bg-pink-700 text-pink-100",
    icon: "👑",
  },
  hero: {
    bg: "from-blue-600 via-red-500 to-yellow-400",
    border: "border-blue-700",
    text: "text-blue-50",
    badge: "bg-blue-800 text-yellow-100",
    icon: "🦸",
  },
  squishy: {
    bg: "from-pink-300 via-rose-300 to-fuchsia-400",
    border: "border-pink-400",
    text: "text-pink-50",
    badge: "bg-pink-500 text-white",
    icon: "🧸",
  },
};

const RARITY_STYLES = {
  common: "ring-2 ring-black/10 shadow-md",
  uncommon: "ring-2 ring-slate-300 shadow-lg",
  rare: "ring-4 ring-purple-400/80 shadow-xl border-dashed animate-pulse",
  ultra_rare: "ring-4 ring-yellow-400/90 shadow-2xl border-double bg-gradient-to-r",
  secret_gold: "ring-4 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] border-double bg-gradient-to-r",
};

export function TcgCard({
  card,
  quantity = 0,
  isLocked = false,
  onClick,
  size = "md",
  className,
  showBack = false,
}: TcgCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isLocked || showBack) return;

    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation (-15 to 15 degrees)
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rx = -(y - yc) / (rect.height / 15);
    const ry = (x - xc) / (rect.width / 15);

    // Calculate shine position (0% to 100%)
    const sx = (x / rect.width) * 100;
    const sy = (y / rect.height) * 100;

    setRotateX(rx);
    setRotateY(ry);
    setShineX(sx);
    setShineY(sy);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const st = TYPE_STYLES[card.type] || TYPE_STYLES.fire;
  const isSpecial = card.rarity === "ultra_rare" || card.rarity === "secret_gold" || card.rarity === "rare";

  const sizeClasses = {
    sm: "w-40 h-56 text-[10px]",
    md: "w-64 h-96 text-xs",
    lg: "w-80 h-[480px] text-sm",
  };

  if (showBack) {
    return (
      <div
        className={cn(
          "relative select-none rounded-[16px] border-4 border-slate-700 bg-slate-800 text-white flex flex-col items-center justify-center shadow-md",
          sizeClasses[size],
          onClick && "cursor-pointer active:scale-95 transition-transform",
          className
        )}
        onClick={onClick}
      >
        <div className="w-full h-full p-4 rounded-[12px] bg-gradient-to-br from-indigo-900 via-sky-900 to-indigo-950 flex flex-col items-center justify-between border-2 border-indigo-400 relative overflow-hidden">
          {/* Card Back Logo design */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,transparent_70%)]" />
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-sky-500/10 blur-xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl" />

          <div className="text-lg font-bold font-display text-sky-300 tracking-wider">SIFIRDEX</div>
          <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center bg-indigo-950/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="text-4xl animate-bounce">🃏</span>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-amber-400">CREW & MONSTERS</div>
            <div className="text-[9px] text-sky-400/80">Trading Card Game</div>
          </div>
        </div>
      </div>
    );
  }

  // Locked cards with artwork: show greyed-out preview of actual card
  if (isLocked && card.imageUrl) {
    return (
      <div
        className={cn(
          "relative select-none rounded-[16px] border-4 border-slate-600 overflow-hidden shadow-md cursor-pointer",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
      >
        {/* Greyed-out card image */}
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover grayscale opacity-40"
        />
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40">
          <span className="text-3xl drop-shadow-lg">🔒</span>
          <span className="font-display font-bold text-white/80 text-xs mt-1 drop-shadow">Locked</span>
        </div>
      </div>
    );
  }

  // Locked cards without artwork: generic lock display
  if (isLocked) {
    return (
      <div
        className={cn(
          "relative select-none rounded-[16px] border-4 border-slate-700 bg-slate-800 text-white flex flex-col items-center justify-center shadow-md opacity-60 saturate-50 cursor-pointer",
          sizeClasses[size],
          className
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <span className="text-4xl filter grayscale">🔒</span>
          <span className="font-display font-bold text-slate-400">Locked</span>
          <p className="text-[10px] text-slate-500 font-medium">Earn points & open packs to collect this card!</p>
        </div>
      </div>
    );
  }

  if (!isLocked && card.imageUrl) {
    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.03 : 1})`,
          transition: isHovered ? "transform 0.05s ease-out" : "transform 0.3s ease-out",
        }}
        className={cn(
          "relative rounded-[16px] border-4 border-slate-900 select-none overflow-hidden shadow-2xl cursor-pointer bg-slate-800",
          RARITY_STYLES[card.rarity],
          className,
          sizeClasses[size]
        )}
      >
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
        />

        {/* Holographic overlay */}
        {isSpecial && isHovered && (
          <div
            style={{
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
            }}
            className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
          />
        )}
        
        {/* Rainbow foil shift for secret gold */}
        {card.rarity === "secret_gold" && (
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-yellow-500/20 to-cyan-500/20 pointer-events-none z-10 mix-blend-color-dodge animate-[pulse_3s_infinite]" />
        )}

        {/* Floating duplicate quantity badge */}
        {quantity > 1 && (
          <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-red-600 border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-lg animate-bounce z-30">
            x{quantity}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.03 : 1})`,
        transition: isHovered ? "transform 0.05s ease-out" : "transform 0.3s ease-out",
      }}
      className={cn(
        "relative rounded-[16px] border-4 border-slate-900 select-none bg-gradient-to-b overflow-hidden shadow-2xl flex flex-col justify-between p-3.5",
        st.bg,
        RARITY_STYLES[card.rarity],
        onClick && "cursor-pointer",
        className,
        sizeClasses[size]
      )}
    >
      {/* Holographic overlay */}
      {isSpecial && isHovered && (
        <div
          style={{
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
          }}
          className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
        />
      )}
      
      {/* Rainbow foil shift for secret gold */}
      {card.rarity === "secret_gold" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-yellow-500/20 to-cyan-500/20 pointer-events-none z-10 mix-blend-color-dodge animate-[pulse_3s_infinite]" />
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-1 z-10">
        <div className="flex flex-col">
          {card.evolvesFrom && (
            <span className="text-[9px] font-semibold text-white/85 bg-black/20 px-1.5 py-0.5 rounded-md self-start mb-0.5 uppercase tracking-wide">
              Evolves
            </span>
          )}
          <span className="font-display font-extrabold text-white text-md drop-shadow-md truncate max-w-[130px]">
            {card.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full text-white font-extrabold text-xs">
          <span className="text-[10px]">HP</span>
          <span className="text-xs">{card.hp}</span>
          <span className="text-sm leading-none">{st.icon}</span>
        </div>
      </div>

      {/* Card Artwork Box */}
      <div className="my-2 h-1/2 w-full rounded-xl bg-slate-900/10 border-2 border-white/20 flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_80%)]" />
        {!imageError ? (
          <img
            src={card.imageUrl || `/cards/${card.id}.png`}
            alt={card.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
        ) : (
          <span className="text-7xl group-hover:scale-110 transition-transform drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
            {card.emoji}
          </span>
        )}
        
        {/* Rarity Ribbon */}
        <span className={cn(
          "absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shadow-sm border border-white/25",
          card.rarity === "secret_gold" ? "bg-amber-500 text-amber-950 font-black animate-bounce" :
          card.rarity === "ultra_rare" ? "bg-yellow-400 text-yellow-950" :
          card.rarity === "rare" ? "bg-purple-600 text-white" :
          card.rarity === "uncommon" ? "bg-slate-500 text-white" : "bg-zinc-700 text-zinc-100"
        )}>
          {card.rarity.replace("_", " ")}
        </span>
      </div>

      {/* Card Description / Moves */}
      <div className="flex flex-col gap-2 bg-white/95 rounded-xl p-2.5 shadow-inner border border-black/5 text-slate-800 z-10 flex-grow justify-between min-h-[96px]">
        {/* Ability (if present) */}
        {card.ability && (
          <div className="text-[10px] leading-tight border-b border-slate-200 pb-1">
            <span className="font-extrabold text-indigo-700">Ability: {card.ability.split(":")[0]}</span>
            <span className="text-slate-600"> {card.ability.split(":")[1]}</span>
          </div>
        )}

        {/* Primary Attack */}
        <div className="flex items-center justify-between gap-2 my-1">
          <div className="flex flex-col">
            <span className="font-extrabold text-[11px] text-slate-900 leading-tight">
              {card.attackName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-display font-extrabold text-sm text-slate-900">
              {card.attackDmg}
            </span>
          </div>
        </div>

        {/* Flavor / Description */}
        <p className="text-[9px] text-slate-500 italic leading-snug line-clamp-2 mt-auto border-t border-slate-100 pt-1">
          "{card.description}"
        </p>
      </div>

      {/* Card Footer / Set indicator */}
      <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/90 font-bold z-10 px-0.5">
        <span className="capitalize tracking-wider">Set: {card.set}</span>
        <span className="bg-black/20 px-1.5 py-0.5 rounded text-[8px]">
          #{card.id.split("-")[1]}
        </span>
      </div>

      {/* Floating duplicate quantity badge */}
      {quantity > 1 && (
        <div className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-red-600 border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-lg animate-bounce z-30">
          x{quantity}
        </div>
      )}
    </div>
  );
}
