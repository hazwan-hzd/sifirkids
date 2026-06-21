"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

/** Donut chart showing module/topic distribution. */
export function TopicPieChart({
  data,
  title,
}: {
  data: PieDatum[];
  title?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const filtered = data.filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
        {title && (
          <h4 className="mb-3 font-display text-sm font-bold text-ink/75">
            {title}
          </h4>
        )}
        <p className="py-8 text-center text-sm text-ink/50">
          No quizzes completed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
      {title && (
        <h4 className="mb-3 font-display text-sm font-bold text-ink/75">
          {title}
        </h4>
      )}
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={160}>
          <RechartsPieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {filtered.map((d, i) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #2c214010",
                boxShadow: "0 4px 12px #2c214015",
                fontSize: 13,
                fontWeight: 600,
              }}
              formatter={(value: any, name: any) => {
                const pct = Math.round((Number(value) / total) * 100);
                return [`${value} (${pct}%)`, name];
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-1 flex-col gap-2">
          {filtered.map((d) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="flex-1 text-sm font-semibold text-ink/70 truncate">
                  {d.name}
                </span>
                <span className="text-sm font-bold text-ink/90">
                  {pct}%
                </span>
              </div>
            );
          })}
          <div className="mt-1 border-t border-black/5 pt-1">
            <span className="text-xs font-bold text-ink/40">
              {total} total sessions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
