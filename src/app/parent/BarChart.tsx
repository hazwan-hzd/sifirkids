"use client";

import { useEffect, useRef, useId } from "react";
import { animate, stagger } from "animejs";
import { cn } from "@/lib/utils";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

/** Pure-SVG vertical bar chart with Anime.js animations & modern aesthetics. */
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
  const chartId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = 0.22; // narrow gap for fatter, more visible bars
  const slot = 100 / n;
  const barW = slot * (1 - gap);

  useEffect(() => {
    if (!svgRef.current) return;

    // Animate bars vertically
    animate(
      svgRef.current.querySelectorAll(".chart-bar"),
      {
        height: (el: any) => parseFloat(el.getAttribute("data-height") || "0"),
        y: (el: any) => parseFloat(el.getAttribute("data-y") || "0"),
        opacity: (el: any) => parseFloat(el.getAttribute("data-opacity") || "1"),
        delay: stagger(30),
        duration: 1000,
        ease: "easeOutElastic(1, 0.85)",
      }
    );

    // Fade in and slide value labels up slightly
    animate(
      svgRef.current.querySelectorAll(".chart-value-label"),
      {
        opacity: [0, 1],
        y: (el: any) => parseFloat(el.getAttribute("data-y") || "0") - 3,
        delay: stagger(30, { start: 300 }),
        duration: 600,
        ease: "easeOutQuad",
      }
    );
  }, [data, height]);


  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
      {title && <h4 className="mb-3 font-display text-sm font-bold text-ink/75">{title}</h4>}
      <svg
        ref={svgRef}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
        role="img"
        aria-label={title ?? "bar chart"}
      >
        <defs>
          <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.4} />
          </linearGradient>
          <filter id={`shadow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#2c2140" floodOpacity="0.1" />
          </filter>
        </defs>

        {data.map((d, i) => {
          const h = (d.value / max) * (height - 24); // top headroom for value labels
          const x = i * slot + (slot - barW) / 2;
          const finalY = height - 16 - h;
          const finalH = d.value > 0 ? Math.max(h, 3) : 1.5; // fatter baseline dot for 0 values
          const finalOpacity = d.value > 0 ? 1 : 0.18;

          return (
            <g key={d.key} className="group">
              {/* Animated Bar */}
              <rect
                className="chart-bar transition-all duration-300 group-hover:brightness-95 hover:cursor-pointer"
                x={x}
                y={height - 16} // start at baseline
                width={barW}
                height={0} // start at height 0
                rx={barW * 0.4} // capsular rounded corners
                fill={d.value > 0 ? `url(#barGradient-${chartId})` : "#2c2140"}
                filter={d.value > 0 ? `url(#shadow-${chartId})` : undefined}
                opacity={0}
                data-y={finalY}
                data-height={finalH}
                data-opacity={finalOpacity}
              />
              
              {/* Subtle hover highlight outline */}
              {d.value > 0 && (
                <rect
                  x={x - 1}
                  y={finalY - 2}
                  width={barW + 2}
                  height={finalH + 4}
                  rx={barW * 0.4 + 1}
                  fill="transparent"
                  className="pointer-events-none stroke-grape-400/0 group-hover:stroke-grape-400/20 stroke-[0.8] transition-all duration-300"
                />
              )}

              {/* Value Label */}
              {d.value > 0 && (
                <text
                  className="chart-value-label font-display pointer-events-none"
                  x={x + barW / 2}
                  y={height - 16} // start at baseline
                  opacity={0}
                  data-y={finalY}
                  fontSize={4.8}
                  textAnchor="middle"
                  fill="#2c2140"
                  fontWeight={700}
                >
                  {d.value}
                </text>
              )}

              {/* X Axis Label */}
              <text
                x={x + barW / 2}
                y={height - 4}
                fontSize={4.2}
                textAnchor="middle"
                fill="#2c2140"
                className="font-display font-semibold transition-opacity duration-300 group-hover:fill-grape-600 opacity-60"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 text-right text-[10px] font-bold tracking-wide text-ink/40 uppercase">
        peak {max}
        {unit}
      </div>
    </div>
  );
}

