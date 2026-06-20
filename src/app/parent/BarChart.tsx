"use client";

import { cn } from "@/lib/utils";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

/** Pure-SVG vertical bar chart. No dependencies. */
export function BarChart({
  data,
  color = "#8b4dff",
  height = 120,
  unit = "",
  title,
}: {
  data: BarDatum[];
  color?: string;
  height?: number;
  unit?: string;
  title?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = 0.25; // fraction of slot used as gap
  const slot = 100 / n;
  const barW = slot * (1 - gap);

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      {title && <h4 className="mb-2 font-display text-sm font-semibold text-ink/70">{title}</h4>}
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={title ?? "bar chart"}
      >
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 18);
          const x = i * slot + (slot - barW) / 2;
          const y = height - 14 - h;
          return (
            <g key={d.key}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, d.value > 0 ? 2 : 0)}
                rx={1.5}
                fill={color}
                opacity={d.value > 0 ? 1 : 0.15}
              />
              {d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 2}
                  fontSize={5}
                  textAnchor="middle"
                  fill="#2c2140"
                  fontWeight={700}
                >
                  {d.value}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={height - 4}
                fontSize={4.5}
                textAnchor="middle"
                fill="#2c2140"
                opacity={0.55}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className={cn("mt-1 text-right text-xs text-ink/50")}>
        peak {max}
        {unit}
      </div>
    </div>
  );
}
