"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColorKey } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ------------------------------- Button ------------------------------ */

type ButtonProps = {
  color?: ColorKey;
  variant?: "solid" | "soft" | "ghost";
  size?: "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const SIZES = {
  md: "px-5 py-3 text-lg",
  lg: "px-6 py-4 text-xl",
  xl: "px-8 py-5 text-2xl",
};

export function Button({
  color = "grape",
  variant = "solid",
  size = "lg",
  className,
  children,
  ...rest
}: ButtonProps) {
  const c = COLOR_CLASSES[color];
  const styles =
    variant === "solid"
      ? cn(c.bg, "text-white")
      : variant === "soft"
        ? cn(c.bgSoft, c.text)
        : cn("bg-transparent", c.text);
  return (
    <button
      {...rest}
      className={cn(
        "btn-pop tap inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold",
        "disabled:opacity-40 disabled:shadow-none disabled:active:translate-y-0",
        SIZES[size],
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Card -------------------------------- */

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-[var(--radius-blob)] bg-white/85 p-6 shadow-[var(--shadow-soft)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------- ProgressBar ---------------------------- */

export function ProgressBar({
  value,
  color = "teal",
  className,
}: {
  value: number; // 0..100
  color?: ColorKey;
  className?: string;
}) {
  const c = COLOR_CLASSES[color];
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-4 w-full overflow-hidden rounded-full bg-black/10", className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", c.bg)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

/* --------------------------- PointsBadge ----------------------------- */

export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sunny-400 px-3 py-1 font-display font-bold text-ink shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      <span aria-hidden>⭐</span>
      {points.toLocaleString()}
    </span>
  );
}

/* ----------------------------- BackButton ---------------------------- */

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  const cls =
    "tap inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-[var(--shadow-pop)] btn-pop";
  if (href) {
    return (
      <Link href={href} aria-label="Back" role="button" className={cls}>
        ←
      </Link>
    );
  }
  return (
    <button aria-label="Back" onClick={() => router.back()} className={cls}>
      ←
    </button>
  );
}

/* ------------------------------ Confetti ----------------------------- */
/* Lightweight CSS confetti burst, no dependency. */

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 24 });
  const colors = ["#ff5a47", "#14c2a0", "#1f9bff", "#8b4dff", "#ffba00", "#7ed957"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.2 + Math.random() * 0.8;
        const bg = colors[i % colors.length];
        const size = 8 + Math.random() * 8;
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              top: "-5%",
              width: size,
              height: size,
              background: bg,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
            className="absolute rounded-sm [animation-name:fall] [animation-timing-function:ease-in] [animation-fill-mode:forwards]"
          />
        );
      })}
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:0}}`}</style>
    </div>
  );
}

/* ---------------------------- PageShell ------------------------------ */

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-2xl px-4 py-6 sm:py-10", className)}>
      {children}
    </main>
  );
}

/* ------------------------------ Loading ------------------------------ */

export function Loading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="animate-pop font-display text-2xl text-grape-500">Loading…</div>
    </div>
  );
}
