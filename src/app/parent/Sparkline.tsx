"use client";

import { useEffect, useRef, useId } from "react";
import { animate, stagger } from "animejs";

/** Pure-SVG accuracy trend line with path-tracing & stagger animations. */
export function Sparkline({
  values,
  height = 120,
  color = "#14c2a0",
  title,
}: {
  values: number[]; // 0..100, oldest -> newest
  height?: number;
  color?: string;
  title?: string;
}) {
  const chartId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const hasData = values.length >= 2;
  const w = 100;
  const pad = 6;

  // Convert values to SVG Path commands
  const pathD = hasData
    ? values
        .map((v, i) => {
          const x = pad + (i / (values.length - 1)) * (w - pad * 2);
          const y = pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
          return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    : "";

  // Connect path back to baseline to create a closed fill area
  const areaD = hasData
    ? `${pathD} L ${(w - pad).toFixed(2)} ${(height - pad).toFixed(2)} L ${pad.toFixed(2)} ${(height - pad).toFixed(2)} Z`
    : "";

  useEffect(() => {
    if (!pathRef.current) return;

    // Line drawing animation
    const length = pathRef.current.getTotalLength();
    pathRef.current.setAttribute("stroke-dasharray", String(length));
    pathRef.current.setAttribute("stroke-dashoffset", String(length));

    animate(
      pathRef.current,
      {
        strokeDashoffset: [length, 0],
        duration: 1100,
        ease: "inOutQuad",
      }
    );

    // Fade in fill area
    if (areaRef.current) {
      animate(
        areaRef.current,
        {
          opacity: [0, 0.12],
          duration: 900,
          ease: "outQuad",
        }
      );
    }

    // Stagger circles entrance
    if (svgRef.current) {
      animate(
        svgRef.current.querySelectorAll(".sparkline-dot"),
        {
          r: [0, 1.4],
          delay: stagger(40, { start: 400 }),
          duration: 400,
          ease: "outBack",
        }
      );
    }
  }, [values]);

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
      {title && <h4 className="mb-3 font-display text-sm font-bold text-ink/75">{title}</h4>}
      {hasData ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${height}`}
          preserveAspectRatio="none"
          className="w-full overflow-visible"
          style={{ height }}
          role="img"
          aria-label={title ?? "accuracy trend"}
        >
          <defs>
            <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id={`sparklineShadow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor={color} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Guide lines */}
          {[0, 50, 100].map((g) => {
            const y = pad + (1 - g / 100) * (height - pad * 2);
            return (
              <line
                key={g}
                x1={pad}
                y1={y}
                x2={w - pad}
                y2={y}
                stroke="#2c2140"
                strokeWidth={0.3}
                opacity={0.12}
              />
            );
          })}

          {/* Closed Fill Area */}
          <path
            ref={areaRef}
            d={areaD}
            fill={`url(#areaGradient-${chartId})`}
            opacity={0}
            className="pointer-events-none"
          />

          {/* Stroke Path Line */}
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#sparklineShadow-${chartId})`}
          />

          {/* Interactive Dot Points */}
          {values.map((v, i) => {
            const x = pad + (i / (values.length - 1)) * (w - pad * 2);
            const y = pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={0}
                fill={color}
                className="sparkline-dot transition-all duration-300 hover:r-[2.2] hover:stroke-white hover:stroke-[0.6] cursor-pointer"
              >
                <title>{`Acc: ${v}%`}</title>
              </circle>
            );
          })}
        </svg>
      ) : (
        <p className="py-8 text-center text-sm text-ink/50">Not enough quizzes yet.</p>
      )}
    </div>
  );
}


