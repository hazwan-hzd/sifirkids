"use client";

/** Pure-SVG accuracy trend line across recent quiz sessions. */
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
  const hasData = values.length >= 2;
  const w = 100;
  const pad = 6;

  const points = hasData
    ? values
        .map((v, i) => {
          const x = pad + (i / (values.length - 1)) * (w - pad * 2);
          const y = pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ")
    : "";

  return (
    <div className="rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
      {title && <h4 className="mb-2 font-display text-sm font-semibold text-ink/70">{title}</h4>}
      {hasData ? (
        <svg
          viewBox={`0 0 ${w} ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height }}
          role="img"
          aria-label={title ?? "accuracy trend"}
        >
          {/* 50% and 100% guide lines */}
          {[0, 50, 100].map((g) => {
            const y = pad + (1 - g / 100) * (height - pad * 2);
            return (
              <line key={g} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#2c2140" strokeWidth={0.3} opacity={0.12} />
            );
          })}
          <polyline points={points} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
          {values.map((v, i) => {
            const x = pad + (i / (values.length - 1)) * (w - pad * 2);
            const y = pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
            return <circle key={i} cx={x} cy={y} r={1.4} fill={color} />;
          })}
        </svg>
      ) : (
        <p className="py-8 text-center text-sm text-ink/50">Not enough quizzes yet.</p>
      )}
    </div>
  );
}
