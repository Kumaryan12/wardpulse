"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type TrendPoint = {
  timestamp: string;
  pm25: number;
  pm10: number;
};

type NodeTrendChartProps = {
  title: string;
  data: TrendPoint[];
};

const PM25_THRESHOLD = 60;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="shadow-2xl backdrop-blur-md"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
        borderRadius: 8,
        padding: "12px 14px",
        minWidth: 160,
        opacity: 0.95,
      }}
    >
      <p
        className="mb-2 pb-2 font-mono text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--wp-text-muted)", borderBottom: "1px solid var(--wp-border)" }}
      >
        Time: {label}
      </p>
      <div className="flex flex-col gap-2">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: entry.color,
                  boxShadow: `0 0 8px ${entry.color}80`,
                }}
              />
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-secondary)" }}
              >
                {entry.name}
              </span>
            </div>
            <span
              className="font-mono text-xs font-bold"
              style={{ color: "var(--wp-text-primary)" }}
            >
              {entry.value}{" "}
              <span style={{ color: "var(--wp-text-ghost)", fontSize: 9 }}>µg/m³</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function NodeTrendChart({ title, data }: NodeTrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const maxPm25 = Math.max(...data.map((d) => d.pm25), 0);
  const isBreaching = maxPm25 > PM25_THRESHOLD;

  // Dynamic colors: Only use color if it's actually an emergency
  const pm25Color = isBreaching ? "var(--wp-severe)" : "var(--wp-text-primary)";
  const pm10Color = "var(--wp-text-ghost)";

  return (
    <div
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
        borderRadius: 12,
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Premium Radial Hover Glow based on breach status */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ 
          background: `radial-gradient(circle at top right, ${isBreaching ? 'var(--wp-severe-dim)' : 'var(--wp-bg-overlay)'}, transparent 60%)` 
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--wp-border)", background: "var(--wp-bg-overlay)" }}
        >
          <p
            className="truncate font-mono text-[11px] font-semibold tracking-wider"
            style={{ color: "var(--wp-text-secondary)" }}
            title={title}
          >
            {title}
          </p>
          <div className="flex items-center gap-4 shrink-0 ml-3">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 2,
                  background: pm25Color,
                  borderRadius: 1,
                }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>PM2.5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 2,
                  background: pm10Color,
                  borderRadius: 1,
                }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>PM10</span>
            </div>
            {isBreaching && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                style={{
                  background: "var(--wp-severe-dim)",
                  color: "var(--wp-severe)",
                  border: "1px solid var(--wp-severe-border)",
                }}
              >
                Threshold Breach
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="px-3 py-5" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--wp-border)"
                opacity={0.4}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "var(--wp-text-muted)", fontFamily: "monospace", fontWeight: 500 }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "var(--wp-text-muted)", fontFamily: "monospace", fontWeight: 500 }}
                dx={-5}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "var(--wp-border-hover)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <ReferenceLine
                y={PM25_THRESHOLD}
                stroke="var(--wp-severe)"
                strokeDasharray="4 4"
                strokeOpacity={0.3}
                strokeWidth={1}
                label={{
                  value: "SAFE LIMIT",
                  position: "insideTopRight",
                  fontSize: 8,
                  fontWeight: 700,
                  fill: "var(--wp-severe)",
                  opacity: 0.6,
                }}
              />
              {/* PM2.5 Line - Dynamic Color */}
              <Line
                type="monotone"
                name="PM 2.5"
                dataKey="pm25"
                stroke={pm25Color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: pm25Color }}
              />
              {/* PM10 Line - Muted */}
              <Line
                type="monotone"
                name="PM 10"
                dataKey="pm10"
                stroke={pm10Color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "var(--wp-text-secondary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}