"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, CARDS, COLOR_CLASSES } from "@/lib/data";
import type { ChildId, Card } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton } from "@/components/ui";
import { TcgCard } from "@/components/TcgCard";
import { cn } from "@/lib/utils";

interface Opponent {
  name: string;
  avatar: string;
  difficulty: "Easy" | "Medium" | "Hard";
  deck: string[];
  rewardPoints: number;
}

const OPPONENTS: Opponent[] = [
  {
    name: "Multiplication Slime",
    avatar: "🟢",
    difficulty: "Easy",
    deck: ["starter-02", "starter-04", "starter-06", "starter-03", "starter-05"],
    rewardPoints: 100,
  },
  {
    name: "Grand Line Recruit",
    avatar: "👒",
    difficulty: "Medium",
    deck: ["starter-01", "monsters-01", "monsters-03", "crews-02", "crews-03"],
    rewardPoints: 250,
  },
  {
    name: "Haki Overlord",
    avatar: "👑",
    difficulty: "Hard",
    deck: ["monsters-05", "monsters-08", "crews-07", "crews-08", "promo-arabic-03"],
    rewardPoints: 500,
  },
];

export default function TcgBattlePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, recordQuiz } = useApp();
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [gameState, setGameState] = useState<"select_opponent" | "battle" | "game_over">("select_opponent");

  // Battle States
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [oppHand, setOppHand] = useState<Card[]>([]);
  const [playerActive, setPlayerActive] = useState<Card | null>(null);
  const [oppActive, setOppActive] = useState<Card | null>(null);
  const [roundLog, setRoundLog] = useState<string>("");
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [battleOutcome, setBattleOutcome] = useState<"win" | "lose" | "draw">("draw");
  const [earnedReward, setEarnedReward] = useState<number>(0);
  const [victoryTier, setVictoryTier] = useState<string>("");

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];
  const tcg = child.tcg ?? { collection: {}, activeBuddyId: null, activeDeck: [], openedPacksCount: 0 };
  const hasFullDeck = tcg.activeDeck.length === 5;

  const startBattle = (selectedOpp: Opponent) => {
    // Load player cards
    const pCards = tcg.activeDeck
      .map((cardId) => CARDS.find((c) => c.id === cardId))
      .filter((c): c is Card => !!c);

    // Load opponent cards
    const oCards = selectedOpp.deck
      .map((cardId) => CARDS.find((c) => c.id === cardId))
      .filter((c): c is Card => !!c);

    setOpponent(selectedOpp);
    setPlayerHand(pCards);
    setOppHand(oCards);
    setPlayerActive(null);
    setOppActive(null);
    setRoundNumber(1);
    setPlayerScore(0);
    setOppScore(0);
    setRoundLog("A new battle begins! Choose a card from your hand.");
    setGameState("battle");
  };

  const RARITY_BONUS: Record<string, number> = {
    common: 0, uncommon: 3, rare: 6, ultra_rare: 10, secret_gold: 15,
  };

  const calculateDamageBonus = (atkType: Card["type"], defType: Card["type"]): { bonus: number; penalty: number; log: string } => {
    // Fire > Grass > Water > Fire
    if (atkType === "fire" && defType === "grass") return { bonus: 20, penalty: 0, log: "🔥 Fire melts Grass! (+20 Atk)" };
    if (atkType === "grass" && defType === "water") return { bonus: 20, penalty: 0, log: "🍃 Grass absorbs Water! (+20 Atk)" };
    if (atkType === "water" && defType === "fire") return { bonus: 20, penalty: 0, log: "💧 Water douses Fire! (+20 Atk)" };
    if (atkType === "lightning" && defType === "water") return { bonus: 20, penalty: 0, log: "⚡ Lightning shocks Water! (+20 Atk)" };
    // One Piece factions
    if (atkType === "strawhat" && defType === "marine") return { bonus: 10, penalty: 0, log: "👒 Pirates outsmart Marines! (+10 Atk)" };
    if (atkType === "marine" && defType === "shadow") return { bonus: 10, penalty: 0, log: "⚓ Marines capture Shadow! (+10 Atk)" };
    if (atkType === "shadow" && defType === "strawhat") return { bonus: 10, penalty: 0, log: "👁️ Shadow ambushes Pirates! (+10 Atk)" };
    // World Cup positions
    if (atkType === "attacker" && defType === "goalkeeper") return { bonus: 15, penalty: 0, log: "⚽ Striker scores past Keeper! (+15 Atk)" };
    if (atkType === "defender" && defType === "attacker") return { bonus: 15, penalty: 0, log: "🛡️ Defender shuts down Striker! (+15 Atk)" };
    if (atkType === "midfielder" && defType === "attacker") return { bonus: 10, penalty: 0, log: "🎯 Midfielder controls Striker! (+10 Atk)" };
    if (atkType === "goalkeeper" && defType === "midfielder") return { bonus: 10, penalty: 0, log: "🧤 Keeper saves mid-range shot! (+10 Atk)" };
    // JJK types
    if (atkType === "sorcerer" && defType === "curse") return { bonus: 15, penalty: 0, log: "✨ Sorcerer exorcises Curse! (+15 Atk)" };
    if (atkType === "curse" && defType === "domain") return { bonus: 10, penalty: 0, log: "👿 Curse corrupts Domain! (+10 Atk)" };
    if (atkType === "domain" && defType === "sorcerer") return { bonus: 15, penalty: 0, log: "🌀 Domain Expansion traps Sorcerer! (+15 Atk)" };
    // MHA hero
    if (atkType === "hero" && defType === "shadow") return { bonus: 10, penalty: 0, log: "🦸 Hero defeats the Shadows! (+10 Atk)" };
    if (atkType === "hero" && defType === "curse") return { bonus: 10, penalty: 0, log: "🦸 Hero overcomes Curse! (+10 Atk)" };
    // Legendary universal small bonus
    if (atkType === "legendary") return { bonus: 5, penalty: 0, log: "👑 Legendary power! (+5 Atk)" };
    if (atkType === "legend") return { bonus: 5, penalty: 0, log: "🌟 Football Legend! (+5 Atk)" };
    if (atkType === "special_grade") return { bonus: 8, penalty: 0, log: "💀 Special Grade power! (+8 Atk)" };

    // Weakness penalties (reverse matchups)
    if (atkType === "fire" && defType === "water") return { bonus: 0, penalty: 10, log: "🌊 Fire weakened by Water! (-10 Atk)" };
    if (atkType === "grass" && defType === "fire") return { bonus: 0, penalty: 10, log: "🔥 Grass wilts against Fire! (-10 Atk)" };
    if (atkType === "water" && defType === "grass") return { bonus: 0, penalty: 10, log: "🍃 Water absorbed by Grass! (-10 Atk)" };

    return { bonus: 0, penalty: 0, log: "" };
  };

  const chooseAICard = (hand: Card[], playerCard: Card, difficulty: Opponent["difficulty"]): Card => {
    if (difficulty === "Easy" || hand.length <= 1) {
      return hand[Math.floor(Math.random() * hand.length)];
    }
    // Score each card by potential damage output
    const scored = hand.map((card) => {
      const { bonus, penalty } = calculateDamageBonus(card.type, playerCard.type);
      return { card, score: card.attackDmg + bonus - penalty + (RARITY_BONUS[card.rarity] ?? 0) };
    });
    scored.sort((a, b) => b.score - a.score);
    if (difficulty === "Medium") {
      // 50% smart pick, 50% random
      return Math.random() < 0.5 ? scored[0].card : hand[Math.floor(Math.random() * hand.length)];
    }
    // Hard: always picks best counter
    return scored[0].card;
  };

  const getVictoryTier = (pScore: number, oScore: number) => {
    const margin = pScore - oScore;
    if (margin >= 5) return { tier: "Flawless Victory", emoji: "💎", multiplier: 2.0 };
    if (margin >= 3) return { tier: "Dominant Win", emoji: "🔥", multiplier: 1.5 };
    if (margin >= 2) return { tier: "Solid Win", emoji: "⭐", multiplier: 1.25 };
    return { tier: "Close Win", emoji: "✅", multiplier: 1.0 };
  };

  const handlePlayCard = (playerCard: Card) => {
    if (isAnimating || !opponent) return;
    setIsAnimating(true);
    setPlayerActive(playerCard);

    // AI chooses card based on difficulty
    const oppCard = chooseAICard(oppHand, playerCard, opponent.difficulty);
    setOppActive(oppCard);

    // Compute Duel with rarity + buddy bonuses
    const playerBonuses = calculateDamageBonus(playerCard.type, oppCard.type);
    const oppBonuses = calculateDamageBonus(oppCard.type, playerCard.type);

    const playerRarityBonus = RARITY_BONUS[playerCard.rarity] ?? 0;
    const oppRarityBonus = RARITY_BONUS[oppCard.rarity] ?? 0;
    const buddyBonus = (playerCard.id === tcg.activeBuddyId) ? 10 : 0;

    // Critical hit chance (15%)
    const playerCrit = Math.random() < 0.15;
    const oppCrit = Math.random() < 0.15;
    const playerCritMult = playerCrit ? 1.5 : 1;
    const oppCritMult = oppCrit ? 1.5 : 1;

    const playerTotalAtk = Math.floor((playerCard.attackDmg + playerBonuses.bonus - playerBonuses.penalty + playerRarityBonus + buddyBonus) * playerCritMult);
    const oppTotalAtk = Math.floor((oppCard.attackDmg + oppBonuses.bonus - oppBonuses.penalty + oppRarityBonus) * oppCritMult);

    let roundOutcomeLog = "";
    let pPoints = 0;
    let oPoints = 0;

    if (playerTotalAtk > oppTotalAtk) {
      roundOutcomeLog = `🎉 ${playerCard.name} wins the clash! Deals ${playerTotalAtk} DMG vs ${oppCard.name}'s ${oppTotalAtk} DMG.`;
      pPoints = 1;
    } else if (oppTotalAtk > playerTotalAtk) {
      roundOutcomeLog = `💥 ${oppCard.name} wins the clash! Deals ${oppTotalAtk} DMG vs ${playerCard.name}'s ${playerTotalAtk} DMG.`;
      oPoints = 1;
    } else {
      roundOutcomeLog = `🤝 It's a tie clash! Both deal ${playerTotalAtk} DMG.`;
    }

    // Build detailed log
    const modifiers: string[] = [];
    if (playerBonuses.log) modifiers.push(playerBonuses.log);
    if (oppBonuses.log) modifiers.push(oppBonuses.log);
    if (playerRarityBonus > 0) modifiers.push(`${playerCard.name} rarity +${playerRarityBonus}`);
    if (buddyBonus > 0) modifiers.push(`⚡ Buddy Bond +${buddyBonus} Atk!`);
    if (playerCrit) modifiers.push(`💥 ${playerCard.name} CRITICAL HIT! (1.5x)`);
    if (oppCrit) modifiers.push(`💥 ${oppCard.name} CRITICAL HIT! (1.5x)`);

    const bonusLog = modifiers.join(" | ");
    setRoundLog(`${playerCard.name} attacks with ${playerCard.attackName}! ${oppCard.name} counters with ${oppCard.attackName}! ${bonusLog ? "\n(" + bonusLog + ")" : ""}\n\n${roundOutcomeLog}`);

    setTimeout(() => {
      // Apply scores
      setPlayerScore((prev) => prev + pPoints);
      setOppScore((prev) => prev + oPoints);

      // Remove cards from hand
      setPlayerHand((prev) => prev.filter((c) => c.id !== playerCard.id));
      setOppHand((prev) => prev.filter((c) => c.id !== oppCard.id));

      setTimeout(() => {
        setPlayerActive(null);
        setOppActive(null);
        setIsAnimating(false);

        if (roundNumber < 5) {
          setRoundNumber((prev) => prev + 1);
        } else {
          // Battle finished
          const finalPlayerScore = playerScore + pPoints;
          const finalOppScore = oppScore + oPoints;

          let outcome: "win" | "lose" | "draw" = "draw";
          if (finalPlayerScore > finalOppScore) {
            outcome = "win";
            const vt = getVictoryTier(finalPlayerScore, finalOppScore);
            const reward = Math.floor(opponent.rewardPoints * vt.multiplier);
            setEarnedReward(reward);
            setVictoryTier(`${vt.emoji} ${vt.tier} (${vt.multiplier}x)`);
            // Award correct points using bonusPoints override
            recordQuiz(id, {
              module: "multiplication",
              topic: "TCG Battle: " + opponent.name,
              total: 5,
              correct: finalPlayerScore,
              durationSec: 30,
              bestStreak: finalPlayerScore,
              bonusPoints: reward,
            });
          } else if (finalOppScore > finalPlayerScore) {
            outcome = "lose";
          }

          setBattleOutcome(outcome);
          setGameState("game_over");
        }
      }, 2500);
    }, 1500);
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href={`/play/${id}/tcg`} />
        <h1 className="font-display text-2xl font-bold text-slate-800">
          Battle Arena
        </h1>
        <PointsBadge points={child.rewards.points} />
      </div>

      {/* Check Deck */}
      {!hasFullDeck && gameState === "select_opponent" && (
        <div className="bg-white/80 rounded-[var(--radius-blob)] p-8 border-2 border-black/5 shadow-md text-center max-w-md mx-auto">
          <span className="text-6xl mb-4 block">🏟️</span>
          <h2 className="font-display text-xl font-bold text-slate-800 mb-2">Deck is Incomplete</h2>
          <p className="text-sm text-slate-500 mb-6">
            You need exactly **5 cards** in your Battle Deck to play in the Arena. Currently you have **{tcg.activeDeck.length} / 5** cards.
          </p>
          <Link
            href={`/play/${id}/tcg/deck`}
            className="font-display text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-full shadow-md active:scale-95 transition-all"
          >
            Go to Deck Builder
          </Link>
        </div>
      )}

      {/* Select Opponent Screen */}
      {hasFullDeck && gameState === "select_opponent" && (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md text-center">
            <h2 className="font-display text-lg font-bold text-slate-800 mb-1">Choose an Opponent</h2>
            <p className="text-xs text-slate-400">Battle against the computer to test your cards and win points!</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {OPPONENTS.map((opp) => (
              <div
                key={opp.name}
                className="bg-white rounded-3xl p-5 border-2 border-black/5 shadow-md flex flex-col justify-between items-center text-center"
              >
                <span className="text-6xl mb-3">{opp.avatar}</span>
                <div className="flex flex-col mb-4">
                  <h3 className="font-display font-bold text-slate-800 text-md leading-tight">{opp.name}</h3>
                  <span className={cn("text-[10px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full inline-block self-center",
                    opp.difficulty === "Easy" ? "bg-emerald-100 text-emerald-600" :
                    opp.difficulty === "Medium" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                  )}>
                    {opp.difficulty}
                  </span>
                </div>
                <div className="flex flex-col gap-3 w-full mt-auto">
                  <span className="text-xs text-slate-500 font-bold">Reward: 🪙 {opp.rewardPoints} pts</span>
                  <button
                    onClick={() => startBattle(opp)}
                    className="font-display text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white w-full py-2.5 rounded-xl shadow-md active:scale-95"
                  >
                    Battle!
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle Field Screen */}
      {gameState === "battle" && opponent && (
        <div className="flex flex-col gap-6 relative">
          {/* Battle Header */}
          <div className="bg-slate-900 rounded-3xl p-4 border-2 border-slate-800 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{opponent.avatar}</span>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs">{opponent.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Opponent</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm font-display font-extrabold bg-slate-950 px-4 py-2 rounded-2xl border border-slate-700">
              <span className="text-sky-400">YOU: {playerScore}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-red-400">AI: {oppScore}</span>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-400">Round</span>
              <span className="font-display font-extrabold text-sm text-yellow-400">{roundNumber} / 5</span>
            </div>
          </div>

          {/* Arena Duel View */}
          <div className="bg-slate-950 rounded-[var(--radius-blob)] border-4 border-slate-900 h-[420px] flex flex-col justify-between p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_80%)]" />

            {/* AI Active Side */}
            <div className="flex justify-center items-center h-1/3">
              {oppActive ? (
                <div className={cn("transition-transform duration-300 animate-slide-down", isAnimating && "scale-105")}>
                  <TcgCard card={oppActive} size="sm" />
                </div>
              ) : (
                <div className="w-40 h-28 border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xs select-none">
                  AI choosing card...
                </div>
              )}
            </div>

            {/* Match Status / Action Duel Field */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-white font-medium text-xs max-w-xl mx-auto w-full min-h-[96px] flex items-center justify-center shadow-inner relative z-10 whitespace-pre-line">
              {roundLog}
            </div>

            {/* Player Active Side */}
            <div className="flex justify-center items-center h-1/3">
              {playerActive ? (
                <div className={cn("transition-transform duration-300 animate-slide-up", isAnimating && "scale-105")}>
                  <TcgCard card={playerActive} size="sm" />
                </div>
              ) : (
                <div className="w-40 h-28 border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xs select-none animate-pulse">
                  Choose a card below
                </div>
              )}
            </div>
          </div>

          {/* Hand Cards (Only show if not duel animating) */}
          <div className="bg-white/80 rounded-[var(--radius-blob)] p-5 border-2 border-black/5 shadow-md">
            <h3 className="font-display text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-1.5 text-left">
              👋 Your Remaining Hand ({playerHand.length} Cards)
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {playerHand.map((card) => (
                <div
                  key={card.id}
                  onClick={() => !playerActive && !isAnimating && handlePlayCard(card)}
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:-translate-y-3",
                    (playerActive || isAnimating) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <TcgCard card={card} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "game_over" && opponent && (
        <div className="bg-white/80 rounded-[var(--radius-blob)] p-8 border-2 border-black/5 shadow-md text-center max-w-md mx-auto animate-rise">
          {battleOutcome === "win" ? (
            <>
              <span className="text-7xl mb-4 block animate-bounce">🏆</span>
              <h2 className="font-display text-2xl font-black text-emerald-600 mb-1">Victory!</h2>
              {victoryTier && (
                <p className="text-xs font-bold text-amber-600 mb-2">{victoryTier}</p>
              )}
              <p className="text-sm text-slate-600 mb-6">
                Excellent strategy! You defeated **{opponent.name}** and claimed the victory reward!
              </p>
              <div className="bg-amber-100 border border-amber-200 rounded-2xl p-4 mb-6 font-display font-extrabold text-amber-700 flex justify-center items-center gap-2">
                <span>🪙</span> +{earnedReward} points added to wallet!
              </div>
            </>
          ) : battleOutcome === "lose" ? (
            <>
              <span className="text-7xl mb-4 block filter grayscale">💔</span>
              <h2 className="font-display text-2xl font-black text-red-500 mb-2">Defeat...</h2>
              <p className="text-sm text-slate-600 mb-6">
                **{opponent.name}** won the match. Practice your skills, unlock stronger cards, and build a better deck to try again!
              </p>
            </>
          ) : (
            <>
              <span className="text-7xl mb-4 block">🤝</span>
              <h2 className="font-display text-2xl font-black text-slate-600 mb-2">Draw Match!</h2>
              <p className="text-sm text-slate-600 mb-6">
                It was an extremely close duel! A tie match against **{opponent.name}**.
              </p>
            </>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setGameState("select_opponent")}
              className="font-display text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl shadow-md active:scale-95"
            >
              Play Again
            </button>
            <Link
              href={`/play/${id}/tcg`}
              className="font-display text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 px-6 py-2.5 rounded-xl shadow-md active:scale-95"
            >
              TCG Home
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  );
}
