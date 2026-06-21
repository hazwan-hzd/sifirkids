"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/** Clean accuracy trend line chart with area fill. */
export function Sparkline({
  values,
  color = "#14c2a0",
  title,
}: {
  values: number[];
  color?: string;
  title?: string;
}) {
  const hasData = values.length >= 2;

  const data = values.map((v, i) => ({
    idx: i + 1,
    label: `Quiz ${i + 1}`,
    accuracy: Math.round(v),
  }));

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-[var(--shadow-soft)] border border-black/5">
      {title && (
        <h4 className="mb-3 font-display text-sm font-bold text-ink/75">
          {title}
        </h4>
      )}
      {hasData ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="idx"
              tick={{ fontSize: 10, fill: "#2c214060" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#2c214060" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ReferenceLine
              y={80}
              stroke="#2c214020"
              strokeDasharray="4 4"
              label={{
                value: "80%",
                position: "left",
                fontSize: 9,
                fill: "#2c214040",
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #2c214010",
                boxShadow: "0 4px 12px #2c214015",
                fontSize: 13,
                fontWeight: 600,
              }}
              formatter={(value: any) => [`${value}%`, "Accuracy"]}
              labelFormatter={(label: any) => `Quiz ${label}`}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke={color}
              strokeWidth={2.5}
              fill="url(#accuracyGrad)"
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-8 text-center text-sm text-ink/50">
          Not enough quizzes yet.
        </p>
      )}
    </div>
  );
}
