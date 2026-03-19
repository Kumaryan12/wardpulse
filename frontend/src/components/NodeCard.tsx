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
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--wp-bg-panel)",
        border: `1px solid var(--wp-border)`,
        borderRadius: 12,
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
                className="font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--wp-bg-overlay)",
                  color: "var(--wp-text-secondary)",
                  border: "1px solid var(--wp-border-hover)",
                }}
              >
                {props.node_id}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                Ward {props.ward_id}
              </span>
            </div>
            <p
              className="truncate text-base font-semibold leading-tight"
              style={{ color: "var(--wp-text-primary)" }}
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
          className="grid grid-cols-3 gap-0"
          style={{ borderBottom: "1px solid var(--wp-border)" }}
        >
          <div
            className="flex flex-col justify-between gap-1 p-4"
            style={{ borderRight: "1px solid var(--wp-border)" }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--wp-text-muted)" }}
            >
              PM 2.5
            </span>
            <div>
              <span
                className="font-mono text-2xl font-semibold tracking-tight"
                style={{ color }}
              >
                {props.pm25}
              </span>
              <span
                className="ml-1 text-[10px] font-medium"
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
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "var(--wp-text-muted)" }}
            >
              Source
            </span>
            <div className="flex flex-col">
              <span
                className="truncate text-xs font-semibold capitalize"
                style={{ color: "var(--wp-text-primary)" }}
              >
                {formatSource(props.likely_source)}
              </span>
              <span
                className="mt-0.5 font-mono text-[9px]"
                style={{ color: "var(--wp-text-ghost)" }}
              >
                {Math.round(props.confidence_score * 100)}% CONF.
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2 p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "var(--wp-text-muted)" }}
              >
                Priority
              </span>
              <span
                className="font-mono text-[10px]"
                style={{ color: "var(--wp-text-primary)" }}
              >
                {props.priority_score}
                <span style={{ color: "var(--wp-text-ghost)" }}>/100</span>
              </span>
            </div>
            <div
              className="h-[3px] w-full overflow-hidden rounded-full"
              style={{ background: "var(--wp-bg-overlay)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${props.priority_score}%`,
                  background: color,
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
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
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
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
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
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
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
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{
              background: "var(--wp-bg-base)",
              color: "var(--wp-text-secondary)",
              border: "1px solid var(--wp-border-hover)",
            }}
          >
            {props.urgency} Urgency
          </span>
        </div>

        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-white/5 focus:outline-none"
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
            <div className="animate-in slide-in-from-top-2 flex flex-col gap-5 px-5 pb-5 duration-200">
              <div
                className="grid grid-cols-3 gap-0 overflow-hidden rounded-md"
                style={{ border: "1px solid var(--wp-border)" }}
              >
                {[
                  { label: "PM10", value: `${props.pm10}` },
                  { label: "Temp", value: `${props.temperature}°C` },
                  { label: "Hum", value: `${props.humidity}%` },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center gap-1 py-2"
                    style={{
                      background: "var(--wp-bg-overlay)",
                      borderRight:
                        i < 2 ? "1px solid var(--wp-border)" : "none",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--wp-text-muted)" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ color: "var(--wp-text-primary)" }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--wp-text-secondary)" }}
                  >
                    Source Probability
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {Object.entries(props.source_scores).map(([source, score]) => (
                    <div key={source} className="flex items-center gap-3">
                      <span
                        className="w-20 truncate text-[10px] font-medium capitalize"
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
                          }}
                        />
                      </div>
                      <span
                        className="w-8 text-right font-mono text-[9px] font-medium"
                        style={{ color: "var(--wp-text-muted)" }}
                      >
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  ))}
                </div>

                {props.attribution_reasons.length > 0 && (
                  <ul
                    className="mt-4 flex flex-col gap-1.5 border-l-2 pl-3"
                    style={{ borderColor: "var(--wp-border-hover)" }}
                  >
                    {props.attribution_reasons.slice(0, 2).map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-[10px] leading-snug"
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
                  className="rounded-lg p-3"
                  style={{
                    background: "var(--wp-bg-overlay)",
                    border: "1px solid var(--wp-border)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--wp-text-primary)" }}
                    >
                      Action Protocol
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        background: "var(--wp-bg-base)",
                        color: "var(--wp-text-secondary)",
                        border: "1px solid var(--wp-border-hover)",
                      }}
                    >
                      {props.target_team}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {props.recommended_actions.map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[10px] leading-snug"
                        style={{ color: "var(--wp-text-secondary)" }}
                      >
                        <span
                          className="mt-0.5 font-mono font-bold"
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
                  className="rounded-lg p-3"
                  style={{
                    background: "var(--wp-bg-overlay)",
                    border: "1px solid var(--wp-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--wp-text-primary)" }}
                    >
                      Monitoring Status
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        background: "var(--wp-good-dim)",
                        color: "var(--wp-good)",
                        border: "1px solid var(--wp-good-border)",
                      }}
                    >
                      Stable
                    </span>
                  </div>
                  <p
                    className="mt-2 text-[10px] leading-snug"
                    style={{ color: "var(--wp-text-secondary)" }}
                  >
                    Passive telemetry monitoring active. No immediate
                    intervention required for this node.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {briefData && (
          <div style={{ borderTop: "1px solid var(--wp-border)" }}>
            <AIBriefPanel
              data={briefData}
              onClose={() => setBriefData(null)}
            />
          </div>
        )}

        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            borderTop: "1px solid var(--wp-border)",
            background: "var(--wp-bg-overlay)",
          }}
        >
          <span
            className="font-mono text-[9px] font-medium tracking-widest"
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
                  className="rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 focus:outline-none"
                  style={{
                    background: "var(--wp-moderate-dim)",
                    color: "var(--wp-moderate)",
                    border: "1px solid var(--wp-moderate-border)",
                  }}
                >
                  {loadingBrief ? "THINKING…" : "COPILOT"}
                </button>

                {props.is_hotspot && (
                  <button
                    onClick={createTicket}
                    className="rounded px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all hover:brightness-110 focus:outline-none shadow-sm"
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
                Monitoring only
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}