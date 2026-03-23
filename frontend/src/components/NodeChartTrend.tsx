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
  noise_db: number;
};

type NodeTrendChartProps = {
  title: string;
  data: TrendPoint[];
};

const PM25_THRESHOLD = 60;
const NOISE_THRESHOLD = 70;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const getUnit = (name: string) => {
    if (name === "Noise") return "dB";
    return "µg/m³";
  };

  return (
    <div
      className="shadow-2xl backdrop-blur-md"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
        borderRadius: 8,
        padding: "12px 14px",
        minWidth: 170,
        opacity: 0.95,
      }}
    >
      <p
        className="mb-2 border-b pb-2 font-mono text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--wp-text-muted)", borderBottomColor: "var(--wp-border)" }}
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
              <span style={{ color: "var(--wp-text-ghost)", fontSize: 9 }}>
                {getUnit(entry.name)}
              </span>
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
  const maxNoise = Math.max(...data.map((d) => d.noise_db ?? 0), 0);

  const isPmBreaching = maxPm25 > PM25_THRESHOLD;
  const isNoiseBreaching = maxNoise > NOISE_THRESHOLD;

  const pm25Color = isPmBreaching ? "var(--wp-severe)" : "var(--wp-text-primary)";
  const pm10Color = "var(--wp-text-ghost)";
  const noiseColor = isNoiseBreaching ? "var(--wp-poor)" : "var(--wp-moderate)";

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
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at top right, ${
            isPmBreaching || isNoiseBreaching
              ? "var(--wp-severe-dim)"
              : "var(--wp-bg-overlay)"
          }, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{
            borderBottom: "1px solid var(--wp-border)",
            background: "var(--wp-bg-overlay)",
          }}
        >
          <p
            className="truncate font-mono text-[11px] font-semibold tracking-wider"
            style={{ color: "var(--wp-text-secondary)" }}
            title={title}
          >
            {title}
          </p>

          <div className="ml-3 flex shrink-0 items-center gap-4">
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
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                PM2.5
              </span>
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
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                PM10
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 2,
                  background: noiseColor,
                  borderRadius: 1,
                }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                Noise
              </span>
            </div>

            {isPmBreaching && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                style={{
                  background: "var(--wp-severe-dim)",
                  color: "var(--wp-severe)",
                  border: "1px solid var(--wp-severe-border)",
                }}
              >
                PM Breach
              </span>
            )}

            {isNoiseBreaching && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                style={{
                  background: "var(--wp-poor-dim)",
                  color: "var(--wp-poor)",
                  border: "1px solid var(--wp-poor-border)",
                }}
              >
                Noise High
              </span>
            )}
          </div>
        </div>

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
                tick={{
                  fontSize: 9,
                  fill: "var(--wp-text-muted)",
                  fontFamily: "monospace",
                  fontWeight: 500,
                }}
                dy={10}
                minTickGap={30}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 9,
                  fill: "var(--wp-text-muted)",
                  fontFamily: "monospace",
                  fontWeight: 500,
                }}
                dx={-5}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "var(--wp-border-hover)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              <ReferenceLine
                y={PM25_THRESHOLD}
                stroke="var(--wp-severe)"
                strokeDasharray="4 4"
                strokeOpacity={0.3}
                strokeWidth={1}
                label={{
                  value: "PM SAFE LIMIT",
                  position: "insideTopRight",
                  fontSize: 8,
                  fontWeight: 700,
                  fill: "var(--wp-severe)",
                  opacity: 0.6,
                }}
              />

              <ReferenceLine
                y={NOISE_THRESHOLD}
                stroke="var(--wp-poor)"
                strokeDasharray="4 4"
                strokeOpacity={0.25}
                strokeWidth={1}
                label={{
                  value: "NOISE LIMIT",
                  position: "insideBottomRight",
                  fontSize: 8,
                  fontWeight: 700,
                  fill: "var(--wp-poor)",
                  opacity: 0.6,
                }}
              />

              <Line
                type="monotone"
                name="PM 2.5"
                dataKey="pm25"
                stroke={pm25Color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: pm25Color }}
              />

              <Line
                type="monotone"
                name="PM 10"
                dataKey="pm10"
                stroke={pm10Color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "var(--wp-text-secondary)" }}
              />

              <Line
                type="monotone"
                name="Noise"
                dataKey="noise_db"
                stroke={noiseColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: noiseColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}