"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import type { ChildId } from "@/lib/types";

const PARENT_IDS = new Set<ChildId>(["papa", "mommy"]);
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton, ProgressBar } from "@/components/ui";
import { LockedModuleCard } from "@/components/LockedModuleCard";
import { getModulesForChild, getActiveModulesForChild } from "@/lib/moduleRegistry";
import { cn } from "@/lib/utils";
import { AvatarRenderer } from "@/components/AvatarRenderer";

export default function ChildHubPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  if (!CHILD_IDS.includes(childId as ChildId)) notFound();
  const id = childId as ChildId;

  const { state, hydrated, recordOpen } = useApp();
  const opened = useRef(false);
  const [papaUnlocked, setPapaUnlocked] = useState(false);
  const [papaPin, setPapaPin] = useState("");
  const [papaPinError, setPapaPinError] = useState(false);

  useEffect(() => {
    if (hydrated && !opened.current) {
      opened.current = true;
      recordOpen(id);
    }
  }, [hydrated, id, recordOpen]);

  if (!hydrated) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }

  const child = state.children[id];
  const c = COLOR_CLASSES[child.profile.color];

  const mathMastered = TABLES.filter((t) => child.multiplication[String(t)]?.mastered).length;
  const mathPct = Math.round((mathMastered / TABLES.length) * 100);
  const arabicMastered = ARABIC_LETTERS.filter((l) => child.arabic[l.id]?.mastered).length;
  const arabicPct = Math.round((arabicMastered / ARABIC_LETTERS.length) * 100);

  // PIN gate for parent profiles
  if (PARENT_IDS.has(id) && !papaUnlocked) {
    const submitPapaPin = (value: string) => {
      if (value === "2707") {
        setPapaUnlocked(true);
      } else {
        setPapaPinError(true);
        setPapaPin("");
        setTimeout(() => setPapaPinError(false), 600);
      }
    };
    const pressDigit = (d: string) => {
      if (papaPin.length >= 6) return;
      setPapaPin(papaPin + d);
    };
    return (
      <PageShell>
        <div className="mb-6 flex items-center justify-between gap-3">
          <BackButton href="/" />
          <span className="font-display text-xl font-bold text-grape-600">{child.profile.name}</span>
          <div />
        </div>
        <div className={cn("mx-auto max-w-sm rounded-[var(--radius-blob)] bg-white p-8 text-center shadow-sm", papaPinError && "animate-[shake_0.4s]")}>
          <div className="mb-2 text-5xl">🔒</div>
          <h2 className="font-display text-2xl font-bold text-grape-600">Adults Only</h2>
          <p className="mb-4 text-sm text-ink/60">Enter PIN to continue</p>
          <div className="mb-5 flex justify-center gap-2">
            {Array.from({ length: Math.max(4, papaPin.length) }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-4 w-4 rounded-full border-2 border-grape-400",
                  i < papaPin.length && "bg-grape-500",
                  papaPinError && "border-coral-500",
                )}
              />
            ))}
          </div>
          <div className="mx-auto grid max-w-[15rem] grid-cols-3 gap-3">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button key={d} onClick={() => pressDigit(d)} className="tap btn-pop h-14 rounded-2xl bg-cream font-display text-2xl font-bold text-ink">{d}</button>
            ))}
            <button onClick={() => setPapaPin(papaPin.slice(0, -1))} className="tap h-14 rounded-2xl font-display text-xl text-ink/60" aria-label="Delete">⌫</button>
            <button onClick={() => pressDigit("0")} className="tap btn-pop h-14 rounded-2xl bg-cream font-display text-2xl font-bold text-ink">0</button>
            <button onClick={() => submitPapaPin(papaPin)} className="tap btn-pop h-14 rounded-2xl bg-grape-500 font-display text-xl font-bold text-white" aria-label="Enter">✓</button>
          </div>
          {papaPinError && <p className="mt-3 font-display text-coral-600">Wrong PIN, try again</p>}
          <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton href="/" />
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          {child.avatar ? (
            <AvatarRenderer avatar={child.avatar} size={36} className="rounded-full shadow-sm ring-2 ring-black/5" />
          ) : (
            <span className="text-3xl">{child.profile.avatar}</span>
          )}
          <span className={c.text}>{child.profile.name}</span>
        </div>
        <PointsBadge points={child.rewards.points} />
      </div>

      <p className="mb-6 text-center font-display text-2xl text-ink/80">What shall we play?</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Kid module cards — hidden for parent profiles */}
        {!PARENT_IDS.has(id) && (<>
        <Link
          href={`/play/${id}/multiplication`}
          role="button"
          className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-coral-100 p-6"
        >
          <span className="text-6xl">✖️</span>
          <span className="font-display text-2xl font-bold text-coral-600">Times Tables</span>
          <span className="text-sm text-ink/70">Multiply 2 to 12</span>
          <ProgressBar value={mathPct} color="coral" />
          <span className="font-display text-sm text-ink/70">
            {mathMastered}/{TABLES.length} tables mastered
          </span>
        </Link>

        <Link
          href={`/play/${id}/arabic`}
          role="button"
          className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-teal-100 p-6"
          style={{ animationDelay: "80ms" }}
        >
          <span className="font-arabic text-6xl leading-none">ا ب ت</span>
          <span className="font-display text-2xl font-bold text-teal-600">Alif Ba Ta</span>
          <span className="text-sm text-ink/70">Learn Arabic letters</span>
          <ProgressBar value={arabicPct} color="teal" />
          <span className="font-display text-sm text-ink/70">
            {arabicMastered}/{ARABIC_LETTERS.length} letters learned
          </span>
        </Link>

        {/* Sejarah module — Dhiya only */}
        {id === "dhiya" && (
          <Link
            href={`/play/${id}/sejarah`}
            role="button"
            className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-teal-100 p-6"
            style={{ animationDelay: "160ms" }}
          >
            <span className="text-6xl">📜</span>
            <span className="font-display text-2xl font-bold text-teal-600">
              Sejarah Tingkatan 3
            </span>
            <span className="text-sm text-ink/70">
              Kuiz KSSM — 8 Bab Kedatangan Kuasa Asing
            </span>
          </Link>
        )}

        {/* Geografi module — Dhiya only */}
        {id === "dhiya" && (
          <Link
            href={`/play/${id}/geografi`}
            role="button"
            className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-sky-100 p-6"
            style={{ animationDelay: "170ms" }}
          >
            <span className="text-6xl">🌍</span>
            <span className="font-display text-2xl font-bold text-sky-600">
              Geografi Tingkatan 4
            </span>
            <span className="text-sm text-ink/70">
              Kuiz KSSM — Kemahiran, Fizikal & Manusia
            </span>
          </Link>
        )}

        {/* Peribahasa module — all children */}
        <Link
          href={`/play/${id}/peribahasa`}
          role="button"
          className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-grape-100 p-6"
          style={{ animationDelay: "240ms" }}
        >
          <span className="text-6xl">📖</span>
          <span className="font-display text-2xl font-bold text-grape-600">
            Peribahasa
          </span>
          <span className="text-sm text-ink/70">
            Tingkatan 1, 2 & 3 — Simpulan Bahasa & Peribahasa
          </span>
        </Link>

        {/* Bahasa Melayu module — all children */}
        <Link
          href={`/play/${id}/bahasa_melayu`}
          role="button"
          className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-sunny-100 p-6"
          style={{ animationDelay: "320ms" }}
        >
          <span className="text-6xl">📝</span>
          <span className="font-display text-2xl font-bold text-sunny-600">
            Bahasa Melayu
          </span>
          <span className="text-sm text-ink/70">
            Kuiz BM KSSR/KSSM — mengikut tahap umur
          </span>
        </Link>

        {/* Fardu Ain (PAFA/KAFA) module — all children */}
        <Link
          href={`/play/${id}/pafa_kafa`}
          role="button"
          className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-grape-100 p-6"
          style={{ animationDelay: "400ms" }}
        >
          <span className="text-6xl">🕌</span>
          <span className="font-display text-2xl font-bold text-grape-600">
            Fardu Ain (PAFA/KAFA)
          </span>
          <span className="text-sm text-ink/70">
            Kuiz Perkara Asas Fardu Ain & Kurikulum KAFA
          </span>
        </Link>
        </>)}

        {/* Parent business modules — dynamic from registry */}
        {PARENT_IDS.has(id) && getActiveModulesForChild(id).map((m) => (
          <Link
            key={m.id}
            href={`/play/${id}/${m.id}`}
            role="button"
            className={`btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-${m.accent}-100 p-6`}
            style={{ animationDelay: `${m.animationDelay}ms` }}
          >
            <span className="text-6xl">{m.emoji}</span>
            <span className={`font-display text-2xl font-bold text-${m.accent}-600`}>
              {m.label}
            </span>
            <span className="text-sm text-ink/70">
              {m.description}
            </span>
          </Link>
        ))}

        {/* Card game — also available to parents */}
        {PARENT_IDS.has(id) && (
          <Link
            href={`/play/${id}/tcg`}
            role="button"
            className="btn-pop tap animate-rise flex flex-col gap-3 rounded-[var(--radius-blob)] bg-sky-100 p-6"
            style={{ animationDelay: "800ms" }}
          >
            <span className="text-6xl">🃏</span>
            <span className="font-display text-2xl font-bold text-sky-600">
              SifirDex Card Game
            </span>
            <span className="text-sm text-ink/70">
              Open packs, collect cards & trade with the kids
            </span>
          </Link>
        )}

        {/* Locked / coming-soon modules — shaded out */}
        {getModulesForChild(id)
          .filter((m) => m.status === "coming_soon" || m.status === "locked")
          .map((m) => (
            <LockedModuleCard key={m.id} module={m} />
          ))}
      </div>

      {/* Bottom nav — hidden for papa (adults don't need TCG/Avatar/Rewards) */}
      {!PARENT_IDS.has(id) && (
      <div className="mt-6 grid grid-cols-5 gap-1.5">
        <Link
          href={`/play/${id}/tcg`}
          role="button"
          className="btn-pop tap flex flex-col items-center gap-1 rounded-3xl bg-sky-100 p-3 text-center"
        >
          <span className="text-2xl">🃏</span>
          <span className="font-display text-[10px] font-bold text-sky-600">SifirDex</span>
        </Link>
        <Link
          href={`/play/${id}/rewards`}
          role="button"
          className="btn-pop tap flex flex-col items-center gap-1 rounded-3xl bg-sunny-100 p-3 text-center"
        >
          <span className="text-2xl">🎁</span>
          <span className="font-display text-[10px] font-bold text-sunny-600">Rewards</span>
        </Link>
        <Link
          href={`/play/${id}/avatar`}
          role="button"
          className="btn-pop tap flex flex-col items-center gap-1 rounded-3xl bg-coral-100 p-3 text-center"
        >
          <span className="text-2xl">👕</span>
          <span className="font-display text-[10px] font-bold text-coral-600">Avatar</span>
        </Link>
        <Link
          href="/scoreboard"
          role="button"
          className="btn-pop tap flex flex-col items-center gap-1 rounded-3xl bg-grape-100 p-3 text-center"
        >
          <span className="text-2xl">🏆</span>
          <span className="font-display text-[10px] font-bold text-grape-600">Scores</span>
        </Link>
        <div className="flex flex-col items-center gap-1 rounded-3xl bg-white/70 p-3 text-center">
          <span className="text-2xl">🔥</span>
          <span className="font-display text-[10px] font-bold text-ink/80">
            {child.daily.currentStreak} day{child.daily.currentStreak === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      )}
    </PageShell>
  );
}
