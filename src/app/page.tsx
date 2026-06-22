"use client";

import Link from "next/link";
import { PROFILES, COLOR_CLASSES } from "@/lib/data";
import { useApp } from "@/lib/store";
import { PageShell, Loading, PointsBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AvatarRenderer } from "@/components/AvatarRenderer";

export default function HomePage() {
  const { state, hydrated } = useApp();

  return (
    <PageShell>
      <header className="mb-8 text-center animate-rise">
        <h1 className="font-display text-5xl font-bold text-grape-600 sm:text-6xl">
          Sifir<span className="text-coral-500">Kids</span>
        </h1>
        <p className="mt-2 font-display text-lg text-ink/70">Who is learning today?</p>
      </header>

      {!hydrated ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {PROFILES.map((p, i) => {
            const c = COLOR_CLASSES[p.color];
            const child = state.children[p.id];
            return (
              <Link
                key={p.id}
                href={`/play/${p.id}`}
                role="button"
                className={cn(
                  "btn-pop tap animate-rise flex flex-col items-center gap-3 rounded-[var(--radius-blob)] p-6 text-center",
                  c.bgSoft,
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {child.avatar ? (
                  <AvatarRenderer avatar={child.avatar} size={96} className="shadow-[var(--shadow-pop)]" />
                ) : (
                  <span
                    className={cn(
                      "flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-[var(--shadow-pop)]",
                      c.bg,
                    )}
                  >
                    {p.avatar}
                  </span>
                )}
                <span className={cn("font-display text-2xl font-bold", c.text)}>{p.name}</span>
                <PointsBadge points={child.rewards.points} />
                {child.daily.currentStreak > 0 && (
                  <span className="font-display text-sm text-ink/70">
                    🔥 {child.daily.currentStreak} day streak
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-3">
        <Link
          href="/scoreboard"
          role="button"
          className="tap btn-pop rounded-full bg-sunny-400 px-5 py-3 font-display font-semibold text-ink"
        >
          🏆 Scoreboard
        </Link>
        <Link
          href="/parent"
          role="button"
          className="tap btn-pop rounded-full bg-white/80 px-5 py-3 font-display font-semibold text-ink/70"
        >
          👪 Parents
        </Link>
      </div>
    </PageShell>
  );
}
