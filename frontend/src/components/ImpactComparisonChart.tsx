"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

type ImpactComparisonChartProps = {
  before_pm25_avg: number;
  after_pm25_avg: number;
  before_pm10_avg: number;
  after_pm10_avg: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const before = payload.find((p: any) => p.dataKey === "Before")?.value ?? 0;
  const after  = payload.find((p: any) => p.dataKey === "After")?.value ?? 0;
  const delta  = before > 0 ? Math.round(((before - after) / before) * 100) : 0;
  const improved = after < before;

  return (
    <div
      style={{
        background: "var(--wp-bg-panel)",
        border: "0.5px solid var(--wp-border-hover)",
        borderRadius: 6,
        padding: "10px 12px",
        minWidth: 160,
      }}
    >
      <p
        className="mb-2 pb-2 font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--wp-text-muted)", borderBottom: "0.5px solid var(--wp-border)" }}
      >
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: "var(--wp-severe)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>Before</span>
          </div>
          <span className="font-mono text-xs font-medium" style={{ color: "var(--wp-text-primary)" }}>
            {before} <span style={{ color: "var(--wp-text-muted)", fontSize: 9 }}>µg/m³</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: "var(--wp-good)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>After</span>
          </div>
          <span className="font-mono text-xs font-medium" style={{ color: "var(--wp-text-primary)" }}>
            {after} <span style={{ color: "var(--wp-text-muted)", fontSize: 9 }}>µg/m³</span>
          </span>
        </div>
        <div
          className="mt-1 flex items-center justify-between rounded px-2 py-1"
          style={{
            background: improved ? "var(--wp-good-dim)" : "var(--wp-severe-dim)",
            border: `0.5px solid ${improved ? "var(--wp-good-border)" : "var(--wp-severe-border)"}`,
          }}
        >
          <span className="text-[9px] uppercase tracking-widest" style={{ color: improved ? "var(--wp-good)" : "var(--wp-severe)" }}>
            {improved ? "Improvement" : "Worsened"}
          </span>
          <span className="font-mono text-[10px] font-medium" style={{ color: improved ? "var(--wp-good)" : "var(--wp-severe)" }}>
            {improved ? "−" : "+"}{Math.abs(delta)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ImpactComparisonChart({
  before_pm25_avg,
  after_pm25_avg,
  before_pm10_avg,
  after_pm10_avg,
}: ImpactComparisonChartProps) {
  const data = [
    { metric: "PM2.5", Before: before_pm25_avg, After: after_pm25_avg },
    { metric: "PM10",  Before: before_pm10_avg, After: after_pm10_avg },
  ];

  const pm25Delta  = before_pm25_avg > 0
    ? Math.round(((before_pm25_avg - after_pm25_avg) / before_pm25_avg) * 100)
    : 0;
  const pm10Delta  = before_pm10_avg > 0
    ? Math.round(((before_pm10_avg - after_pm10_avg) / before_pm10_avg) * 100)
    : 0;
  const improved   = pm25Delta > 0;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--wp-bg-panel)",
        border: "0.5px solid var(--wp-border)",
        borderRadius: 8,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--wp-border)" }}
      >
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>
          Before vs After · Intervention Impact
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 16, height: 2, background: "var(--wp-severe)", borderRadius: 1 }} />
            <span className="wp-label">Before</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 16, height: 2, background: "var(--wp-good)", borderRadius: 1 }} />
            <span className="wp-label">After</span>
          </div>
        </div>
      </div>

      {/* Delta summary strip */}
      <div
        className="grid grid-cols-2 gap-0"
        style={{ borderBottom: "0.5px solid var(--wp-border)" }}
      >
        {[
          { label: "PM2.5 change", delta: pm25Delta, before: before_pm25_avg, after: after_pm25_avg },
          { label: "PM10 change",  delta: pm10Delta,  before: before_pm10_avg, after: after_pm10_avg },
        ].map((item, i) => {
          const ok = item.delta > 0;
          return (
            <div
              key={item.label}
              className="flex flex-col gap-1 px-4 py-3"
              style={{ borderRight: i === 0 ? "0.5px solid var(--wp-border)" : "none" }}
            >
              <span className="wp-label">{item.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono text-xl font-medium leading-none"
                  style={{ color: ok ? "var(--wp-good)" : "var(--wp-severe)" }}
                >
                  {ok ? "−" : "+"}{Math.abs(item.delta)}%
                </span>
                <span className="text-[10px]" style={{ color: "var(--wp-text-muted)" }}>
                  {item.before} → {item.after} µg/m³
                </span>
              </div>
              {/* Mini inline bar */}
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--wp-bg-overlay)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.abs(item.delta), 100)}%`,
                    background: ok ? "var(--wp-good)" : "var(--wp-severe)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
            barCategoryGap="35%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#1f2330"
              opacity={0.8}
            />
            <XAxis
              dataKey="metric"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#4a5268", fontFamily: "monospace", fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#4a5268", fontFamily: "monospace" }}
              dx={-4}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#1f2330", opacity: 0.5 }}
            />
            <ReferenceLine
              y={60}
              stroke="#e24b4a"
              strokeDasharray="4 3"
              strokeOpacity={0.35}
              strokeWidth={1}
              label={{ value: "Safe limit", position: "insideTopRight", fontSize: 9, fill: "#e24b4a", opacity: 0.5 }}
            />
            <Bar dataKey="Before" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {data.map((_, i) => (
                <Cell key={i} fill="#e24b4a" fillOpacity={0.75} />
              ))}
            </Bar>
            <Bar dataKey="After" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {data.map((_, i) => (
                <Cell key={i} fill="#1d9e75" fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Verdict footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderTop: "0.5px solid var(--wp-border)", background: "var(--wp-bg-base)" }}
      >
        <span className="wp-label">Intervention verdict</span>
        <span
          className="rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest"
          style={{
            background: improved ? "var(--wp-good-dim)" : "var(--wp-severe-dim)",
            color: improved ? "var(--wp-good)" : "var(--wp-severe)",
            border: `0.5px solid ${improved ? "var(--wp-good-border)" : "var(--wp-severe-border)"}`,
          }}
        >
          {improved ? `Effective · PM2.5 down ${pm25Delta}%` : "Ineffective · No improvement"}
        </span>
      </div>
    </div>
  );
}