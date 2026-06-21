"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface TimeDatum {
  key: string;
  label: string;
  /** minutes spent */
  minutes: number;
}

/** Format minutes to readable string. */
function fmtMin(m: number): string {
  if (m < 1) return "<1m";
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/** Horizontal bar chart showing daily time spent. */
export function TimeChart({
  data,
  title,
}: {
  data: TimeDatum[];
  title?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.minutes));
  const color = "#6366f1"; // indigo

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
      {title && (
        <h4 className="mb-3 font-display text-sm font-bold text-ink/75">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#2c2140", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#2c214080" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => fmtMin(v)}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #2c214010",
              boxShadow: "0 4px 12px #2c214015",
              fontSize: 13,
              fontWeight: 600,
            }}
            cursor={{ fill: "#2c214008", radius: 8 }}
            formatter={(value: any) => [fmtMin(Number(value)), "Time"]}
            labelFormatter={(label: any) => String(label)}
          />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.minutes > 0 ? color : "#2c214015"}
                fillOpacity={d.minutes > 0 ? 0.8 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
