import { dayKey } from "@/lib/utils";

export function formatLastOpen(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return "0m";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Last N day-keys oldest -> newest. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/** Short label like "Mon 16". */
export function dayLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);
}

export type Tier = "mastered" | "strong" | "improving" | "weak" | "untouched";

export function masteryTier(attempts: number, correct: number, mastered: boolean): Tier {
  if (attempts === 0) return "untouched";
  if (mastered) return "mastered";
  const acc = correct / attempts;
  if (acc >= 0.75) return "strong";
  if (acc >= 0.5) return "improving";
  return "weak";
}

export const TIER_STYLE: Record<Tier, { bg: string; text: string; label: string }> = {
  mastered: { bg: "bg-leaf-500", text: "text-white", label: "Mastered" },
  strong: { bg: "bg-teal-400", text: "text-white", label: "Strong" },
  improving: { bg: "bg-sunny-400", text: "text-ink", label: "Improving" },
  weak: { bg: "bg-coral-400", text: "text-white", label: "Needs work" },
  untouched: { bg: "bg-black/10", text: "text-ink/60", label: "Not started" },
};

export function accuracyPct(attempts: number, correct: number): number {
  if (attempts <= 0) return 0;
  return Math.round((correct / attempts) * 100);
}
