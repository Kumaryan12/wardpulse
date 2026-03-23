"use client";

import { useState } from "react";
import api from "@/lib/api";
import AIBriefPanel from "@/components/AIBriefPanel";

type NodeCardProps = {
  node_id: string;
  location_name: string;
  ward_id: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  noise_db?: number;
  timestamp: string;
  severity: string;
  is_hotspot: boolean;
  pm_ratio: number;
  likely_source: string;
  confidence_score: number;
  source_scores: Record<string, number>;
  attribution_reasons: string[];
  urgency: string;
  target_team: string;
  recommended_actions: string[];
  priority_score: number;
  priority_level: string;
  priority_reasons: string[];
  escalation_required: boolean;
  sensitive_zone: boolean;
  sensitive_zone_type?: string | null;
  recurrence_count: number;
};

type BriefData = {
  node_id: string;
  location_name: string;
  ward_id?: string;
  likely_source?: string;
  urgency?: string;
  target_team?: string;
  officer_brief: string;
  citizen_advisory: string;
  escalation_note: string;
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

function severityColor(severity: string) {
  if (severity === "severe") return "var(--wp-severe)";
  if (severity === "poor") return "var(--wp-poor)";
  if (severity === "moderate") return "var(--wp-moderate)";
  return "var(--wp-good)";
}

function severityDim(severity: string) {
  if (severity === "severe") return "var(--wp-severe-dim)";
  if (severity === "poor") return "var(--wp-poor-dim)";
  if (severity === "moderate") return "var(--wp-moderate-dim)";
  return "var(--wp-good-dim)";
}

function severityBorder(severity: string) {
  if (severity === "severe") return "var(--wp-severe-border)";
  if (severity === "poor") return "var(--wp-poor-border)";
  if (severity === "moderate") return "var(--wp-moderate-border)";
  return "var(--wp-good-border)";
}

function classifyNoise(noiseDb: number) {
  if (noiseDb < 55) return "acceptable";
  if (noiseDb < 70) return "elevated";
  if (noiseDb < 85) return "high";
  return "critical";
}

function getNoiseColor(status: string) {
  if (status === "critical") return "var(--wp-severe)";
  if (status === "high") return "var(--wp-poor)";
  if (status === "elevated") return "var(--wp-moderate)";
  return "var(--wp-good)";
}

function getNoiseDim(status: string) {
  if (status === "critical") return "var(--wp-severe-dim)";
  if (status === "high") return "var(--wp-poor-dim)";
  if (status === "elevated") return "var(--wp-moderate-dim)";
  return "var(--wp-good-dim)";
}

function getNoiseBorder(status: string) {
  if (status === "critical") return "var(--wp-severe-border)";
  if (status === "high") return "var(--wp-poor-border)";
  if (status === "elevated") return "var(--wp-moderate-border)";
  return "var(--wp-good-border)";
}

function computeUrbanStressIndex(
  pm25: number,
  pm10: number,
  noiseDb: number,
  sensitiveZone: boolean,
  recurrenceCount: number
) {
  const pm25Score = Math.min((pm25 / 250) * 35, 35);
  const pm10Score = Math.min((pm10 / 350) * 20, 20);
  const noiseScore = Math.min((noiseDb / 100) * 20, 20);
  const sensitiveScore = sensitiveZone ? 15 : 0;
  const recurrenceScore = Math.min((recurrenceCount / 6) * 10, 10);

  return Math.round(
    pm25Score + pm10Score + noiseScore + sensitiveScore + recurrenceScore
  );
}

function getUrbanStressLabel(score: number) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "guarded";
  return "low";
}

function getUrbanStressColor(label: string) {
  if (label === "critical") return "var(--wp-severe)";
  if (label === "high") return "var(--wp-poor)";
  if (label === "guarded") return "var(--wp-moderate)";
  return "var(--wp-good)";
}

function getUrbanStressDim(label: string) {
  if (label === "critical") return "var(--wp-severe-dim)";
  if (label === "high") return "var(--wp-poor-dim)";
  if (label === "guarded") return "var(--wp-moderate-dim)";
  return "var(--wp-good-dim)";
}

function getUrbanStressBorder(label: string) {
  if (label === "critical") return "var(--wp-severe-border)";
  if (label === "high") return "var(--wp-poor-border)";
  if (label === "guarded") return "var(--wp-moderate-border)";
  return "var(--wp-good-border)";
}

export default function NodeCard(props: NodeCardProps) {
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formattedTime = props.timestamp
    ? new Date(props.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const color = severityColor(props.severity);
  const dim = severityDim(props.severity);
  const border = severityBorder(props.severity);

  const safeNoiseDb = typeof props.noise_db === "number" ? props.noise_db : 0;
  const noiseStatus = classifyNoise(safeNoiseDb);
  const noiseColor = getNoiseColor(noiseStatus);
  const noiseDim = getNoiseDim(noiseStatus);
  const noiseBorder = getNoiseBorder(noiseStatus);

  const urbanStressIndex = computeUrbanStressIndex(
    props.pm25,
    props.pm10,
    safeNoiseDb,
    props.sensitive_zone,
    props.recurrence_count
  );
  const urbanStressLabel = getUrbanStressLabel(urbanStressIndex);
  const urbanStressColor = getUrbanStressColor(urbanStressLabel);
  const urbanStressDim = getUrbanStressDim(urbanStressLabel);
  const urbanStressBorder = getUrbanStressBorder(urbanStressLabel);

  const isOperationalNode =
    props.is_hotspot ||
    props.priority_level !== "low" ||
    props.severity === "poor" ||
    props.severity === "severe" ||
    props.recurrence_count >= 3 ||
    (props.sensitive_zone && props.severity !== "good");

  const createTicket = async () => {
    try {
      await api.post("/tickets", {
        node_id: props.node_id,
        location_name: props.location_name,
        ward_id: props.ward_id,
        likely_source: props.likely_source,
        urgency: props.urgency,
        target_team: props.target_team,
        assigned_to: props.target_team,
        remarks: "Auto-created from WardPulse hotspot panel",
      });
      alert(`Ticket created for ${props.node_id}`);
    } catch {
      alert("Failed to create ticket");
    }
  };

  const generateBrief = async () => {
    try {
      setLoadingBrief(true);
      const res = await api.get(`/briefs/${props.node_id}`);
      setBriefData(res.data);
    } catch {
      alert("Failed to generate AI brief");
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--wp-bg-panel)",
        border: `1px solid var(--wp-border)`,
        borderRadius: 12,
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 30px -10px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at top right, ${dim}, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex flex-col">
        <div
          style={{
            height: 2,
            background: props.is_hotspot ? color : "transparent",
            width: "100%",
          }}
        />

        <div
          className="flex items-start justify-between gap-4 p-5"
          style={{ borderBottom: "1px solid var(--wp-border)" }}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest shadow-inner"
                style={{
                  background: "var(--wp-bg-overlay)",
                  color: "var(--wp-text-secondary)",
                  border: "1px solid var(--wp-border)",
                }}
              >
                {props.node_id}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                Ward {props.ward_id}
              </span>
            </div>
            <p
              className="truncate text-base font-bold leading-tight tracking-wide text-white"
              title={props.location_name}
            >
              {props.location_name}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm"
              style={{
                background: dim,
                color,
                border: `1px solid ${border}`,
              }}
            >
              {props.severity}
            </span>

            {props.is_hotspot && (
              <span
                className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                style={{
                  background: "var(--wp-severe-dim)",
                  color: "var(--wp-severe)",
                  border: "1px solid var(--wp-severe-border)",
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ background: "var(--wp-severe)" }}
                  />
                  <span
                    className="relative block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--wp-severe)" }}
                  />
                </span>
                HOTSPOT
              </span>
            )}
          </div>
        </div>

        <div
          className="grid grid-cols-3 gap-0 bg-black/10"
          style={{ borderBottom: "1px solid var(--wp-border)" }}
        >
          <div
            className="flex flex-col justify-between gap-1 p-4"
            style={{ borderRight: "1px solid var(--wp-border)" }}
          >
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--wp-text-muted)" }}
            >
              PM 2.5
            </span>
            <div>
              <span
                className="font-mono text-2xl font-bold tracking-tight"
                style={{ color }}
              >
                {props.pm25}
              </span>
              <span
                className="ml-1 text-[9px] font-bold uppercase"
                style={{ color: "var(--wp-text-ghost)" }}
              >
                µg/m³
              </span>
            </div>
          </div>

          <div
            className="flex flex-col justify-between gap-1 p-4"
            style={{ borderRight: "1px solid var(--wp-border)" }}
          >
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--wp-text-muted)" }}
            >
              Source
            </span>
            <div className="flex flex-col">
              <span className="truncate text-xs font-bold capitalize text-white">
                {formatSource(props.likely_source)}
              </span>
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
                {Math.round(props.confidence_score * 100)}% CONF.
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2 p-4">
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                Threat
              </span>
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: "var(--wp-text-primary)" }}
              >
                {props.priority_score}
                <span style={{ color: "var(--wp-text-ghost)" }}>/100</span>
              </span>
            </div>
            <div
              className="h-[2px] w-full overflow-hidden rounded-full"
              style={{ background: "var(--wp-bg-overlay)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${props.priority_score}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}80`,
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3"
          style={{
            borderBottom: "1px solid var(--wp-border)",
            background: "var(--wp-bg-overlay)",
          }}
        >
          {props.escalation_required && (
            <span
              className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
              style={{
                background: "var(--wp-severe-dim)",
                color: "var(--wp-severe)",
                border: "1px solid var(--wp-severe-border)",
              }}
            >
              Escalation Req.
            </span>
          )}

          {props.sensitive_zone && (
            <span
              className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
              style={{
                background: "rgba(167, 139, 250, 0.1)",
                color: "#a78bfa",
                border: "1px solid rgba(167, 139, 250, 0.2)",
              }}
            >
              {props.sensitive_zone_type ?? "Sensitive Zone"}
            </span>
          )}

          {props.recurrence_count > 0 && (
            <span
              className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
              style={{
                background: "var(--wp-bg-base)",
                color: "var(--wp-text-secondary)",
                border: "1px solid var(--wp-border-hover)",
              }}
            >
              {props.recurrence_count}× Recurrence
            </span>
          )}

          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
            style={{
              background: "var(--wp-bg-base)",
              color: "var(--wp-text-secondary)",
              border: "1px solid var(--wp-border-hover)",
            }}
          >
            {props.urgency} Urgency
          </span>

          <span
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
            style={{
              background: noiseDim,
              color: noiseColor,
              border: `1px solid ${noiseBorder}`,
            }}
          >
            {noiseStatus === "critical" && (
              <span className="h-1 w-1 animate-ping rounded-full bg-red-500" />
            )}
            Acoustic: {noiseStatus}
          </span>

          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
            style={{
              background: urbanStressDim,
              color: urbanStressColor,
              border: `1px solid ${urbanStressBorder}`,
            }}
          >
            USI {urbanStressIndex}
          </span>

          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
            style={{
              background: "var(--wp-bg-base)",
              color: "var(--wp-text-secondary)",
              border: "1px solid var(--wp-border-hover)",
            }}
          >
            {urbanStressLabel}
          </span>
        </div>

        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between px-5 py-3 text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-white/5 focus:outline-none"
            style={{
              color: showDetails
                ? "var(--wp-text-primary)"
                : "var(--wp-text-muted)",
            }}
          >
            <span>
              {showDetails ? "Close Telemetry" : "View Telemetry & Attribution"}
            </span>
            <span
              className="font-mono text-xs"
              style={{ color: "var(--wp-text-ghost)" }}
            >
              {showDetails ? "[-]" : "[+]"}
            </span>
          </button>

          {showDetails && (
            <div className="animate-in slide-in-from-top-2 fade-in flex flex-col gap-5 px-5 pb-5 duration-300">
              <div
                className="grid grid-cols-4 gap-px overflow-hidden rounded-md"
                style={{
                  background: "var(--wp-border)",
                  border: "1px solid var(--wp-border)",
                }}
              >
                {[
                  { label: "PM10", value: `${props.pm10}` },
                  { label: "Temp", value: `${props.temperature}°C` },
                  { label: "Humid", value: `${props.humidity}%` },
                  { label: "Noise", value: `${safeNoiseDb.toFixed(1)} dB`, color: noiseColor },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center gap-1 py-2.5"
                    style={{ background: "var(--wp-bg-base)" }}
                  >
                    <span
                      className="font-mono text-[8px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--wp-text-muted)" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="font-mono text-[11px] font-bold"
                      style={{ color: item.color || "var(--wp-text-primary)" }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="font-mono text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--wp-text-secondary)" }}
                  >
                    Source Probability
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {Object.entries(props.source_scores).map(([source, score]) => (
                    <div key={source} className="flex items-center gap-3">
                      <span
                        className="w-20 truncate text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--wp-text-muted)" }}
                      >
                        {formatSource(source)}
                      </span>
                      <div
                        className="h-[2px] flex-1 overflow-hidden rounded-full"
                        style={{ background: "var(--wp-bg-overlay)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(score * 100)}%`,
                            background:
                              score > 0.5 ? color : "var(--wp-text-ghost)",
                            boxShadow:
                              score > 0.5 ? `0 0 6px ${color}80` : "none",
                          }}
                        />
                      </div>
                      <span
                        className="w-8 text-right font-mono text-[9px] font-bold"
                        style={{ color: "var(--wp-text-muted)" }}
                      >
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                {props.attribution_reasons.length > 0 && (
                  <ul
                    className="mt-4 flex flex-col gap-2 border-l pl-3"
                    style={{ borderColor: "var(--wp-border-hover)" }}
                  >
                    {props.attribution_reasons.slice(0, 2).map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-[10px] leading-relaxed"
                        style={{ color: "var(--wp-text-muted)" }}
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isOperationalNode ? (
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--wp-bg-overlay)",
                    border: "1px solid var(--wp-border)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className="font-mono text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--wp-text-primary)" }}
                    >
                      Action Protocol
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
                      style={{
                        background: "var(--wp-bg-base)",
                        color: "var(--wp-text-secondary)",
                        border: "1px solid var(--wp-border-hover)",
                      }}
                    >
                      {props.target_team}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {props.recommended_actions.map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[10px] leading-relaxed"
                        style={{ color: "var(--wp-text-secondary)" }}
                      >
                        <span
                          className="font-mono text-[12px] font-bold leading-none"
                          style={{ color }}
                        >
                          ›
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: "var(--wp-bg-overlay)",
                    border: "1px solid var(--wp-border)",
                  }}
                >
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--wp-text-primary)" }}
                  >
                    Monitoring Status
                  </span>
                  <p
                    className="mx-auto mt-2 max-w-[80%] text-[10px] leading-relaxed"
                    style={{ color: "var(--wp-text-secondary)" }}
                  >
                    Passive telemetry monitoring active. No immediate intervention
                    required for this node.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {briefData && (
          <div style={{ borderTop: "1px solid var(--wp-border)" }}>
            <AIBriefPanel data={briefData} onClose={() => setBriefData(null)} />
          </div>
        )}

        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{
            borderTop: "1px solid var(--wp-border)",
            background: "var(--wp-bg-overlay)",
          }}
        >
          <span
            className="font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "var(--wp-text-ghost)" }}
          >
            SYNC: {formattedTime}
          </span>

          <div className="flex items-center gap-2">
            {isOperationalNode ? (
              <>
                <button
                  onClick={generateBrief}
                  disabled={loadingBrief}
                  className="rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-white/5 focus:outline-none disabled:opacity-40"
                  style={{
                    background: "var(--wp-bg-panel)",
                    color: "var(--wp-text-secondary)",
                    border: "1px solid var(--wp-border-hover)",
                  }}
                >
                  {loadingBrief ? "THINKING…" : "COPILOT"}
                </button>

                {props.is_hotspot && (
                  <button
                    onClick={createTicket}
                    className="rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all hover:brightness-110 focus:outline-none"
                    style={{
                      background: "var(--wp-severe)",
                      color: "#fff",
                      border: "1px solid var(--wp-severe-border)",
                    }}
                  >
                    RAISE TICKET
                  </button>
                )}
              </>
            ) : (
              <span
                className="rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest"
                style={{
                  background: "var(--wp-bg-base)",
                  color: "var(--wp-text-muted)",
                  border: "1px solid var(--wp-border-hover)",
                }}
              >
                Monitoring
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}