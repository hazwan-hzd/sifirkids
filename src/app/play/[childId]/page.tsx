"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHILD_IDS, COLOR_CLASSES, TABLES, ARABIC_LETTERS } from "@/lib/data";
import type { ChildId } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge, BackButton, ProgressBar } from "@/components/ui";
import { LockedModuleCard } from "@/components/LockedModuleCard";
import { getModulesForChild } from "@/lib/moduleRegistry";
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

        {/* Locked / coming-soon modules — shaded out */}
        {getModulesForChild(id)
          .filter((m) => m.status === "coming_soon" || m.status === "locked")
          .map((m) => (
            <LockedModuleCard key={m.id} module={m} />
          ))}
      </div>

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
    </PageShell>
  );
}
