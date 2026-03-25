"use client";

import { useState } from "react";
import api from "@/lib/api";

type BriefData = {
  node_id: string;
  location_name: string;
  officer_brief: string;
  citizen_advisory: string;
  escalation_note: string;
  ward_id?: string;
  likely_source?: string;
  urgency?: string;
  target_team?: string;
  severity?: string;
};

type AIBriefPanelProps = {
  data: BriefData;
  onClose: () => void;
};

const sections = [
  {
    key: "officer_brief" as const,
    label: "Officer brief",
    sublabel: "Internal · Restricted",
    color: "var(--wp-moderate)",
    dimColor: "var(--wp-moderate-dim)",
    borderColor: "var(--wp-moderate-border)",
  },
  {
    key: "citizen_advisory" as const,
    label: "Citizen advisory",
    sublabel: "Public broadcast",
    color: "var(--wp-good)",
    dimColor: "var(--wp-good-dim)",
    borderColor: "var(--wp-good-border)",
  },
  {
    key: "escalation_note" as const,
    label: "Escalation protocol",
    sublabel: "Command · Urgent",
    color: "var(--wp-severe)",
    dimColor: "var(--wp-severe-dim)",
    borderColor: "var(--wp-severe-border)",
  },
];

type ActionState = "idle" | "loading" | "success" | "error";

export default function AIBriefPanel({ data, onClose }: AIBriefPanelProps) {
  const [dispatchState, setDispatchState] = useState<ActionState>("idle");
  const [broadcastState, setBroadcastState] = useState<ActionState>("idle");
  const [escalateState, setEscalateState] = useState<ActionState>("idle");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const isBusy =
    dispatchState === "loading" ||
    broadcastState === "loading" ||
    escalateState === "loading";

  const setSuccess = (message: string) => {
    setFeedback({ type: "success", message });
  };

  const setError = (message: string) => {
    setFeedback({ type: "error", message });
  };

  const clearFeedback = () => {
    setFeedback({ type: null, message: "" });
  };

  const handleDispatchOfficer = async () => {
    try {
      clearFeedback();
      setDispatchState("loading");

      await api.post("/tickets", {
        node_id: data.node_id,
        location_name: data.location_name,
        ward_id: data.ward_id || "WARD_UNKNOWN",
        likely_source: data.likely_source || "mixed_uncertain",
        urgency: data.urgency || "medium",
        target_team: data.target_team || "Field Response Team",
        assigned_to: data.target_team || "Field Response Team",
        remarks: "Dispatched from AI Brief Panel",
      });

      await api.post("/notifications/dispatch-email", {
        node_id: data.node_id,
        location_name: data.location_name,
        ward_id: data.ward_id || "WARD_UNKNOWN",
        severity: data.severity || "moderate",
        likely_source: data.likely_source || "mixed_uncertain",
        urgency: data.urgency || "medium",
        target_team: data.target_team || "Field Response Team",
        officer_brief: data.officer_brief,
      });

      setDispatchState("success");
      setSuccess("Officer dispatched, ticket created, and email sent.");
    } catch (error) {
      console.error("Dispatch failed:", error);
      setDispatchState("error");
      setError("Dispatch failed. Ticket or email could not be completed.");
    }
  };

  const handleBroadcastAdvisory = async () => {
    try {
      clearFeedback();
      setBroadcastState("loading");

      const message = [
        "WardPulse Public Advisory",
        "",
        `Location: ${data.location_name}`,
        data.ward_id ? `Ward: ${data.ward_id}` : null,
        data.likely_source
          ? `Likely Source: ${data.likely_source.replaceAll("_", " ")}`
          : null,
        "",
        data.citizen_advisory,
        "",
        "— WardPulse",
      ]
        .filter(Boolean)
        .join("\n");

      await api.post("/advisories/whatsapp", {
        node_id: data.node_id,
        location_name: data.location_name,
        ward_id: data.ward_id || "WARD_UNKNOWN",
        likely_source: data.likely_source || "mixed_uncertain",
        message,
      });

      setBroadcastState("success");
      setSuccess("Citizen advisory sent on WhatsApp.");
    } catch (error) {
      console.error("Broadcast advisory failed:", error);
      setBroadcastState("error");
      setError("Failed to send WhatsApp advisory.");
    }
  };

  const handleEscalateNow = async () => {
    try {
      clearFeedback();
      setEscalateState("loading");

      await api.post("/tickets", {
        node_id: data.node_id,
        location_name: data.location_name,
        ward_id: data.ward_id || "WARD_UNKNOWN",
        likely_source: data.likely_source || "mixed_uncertain",
        urgency: "critical",
        target_team: "Escalation Response Team",
        assigned_to: "Escalation Response Team",
        remarks: "Escalated from AI Brief Panel due to urgent risk condition",
      });

      setEscalateState("success");
      setSuccess("Critical escalation ticket created successfully.");
    } catch (error) {
      console.error("Escalation failed:", error);
      setEscalateState("error");
      setError("Failed to escalate this case.");
    }
  };

  const getButtonLabel = (
    baseLabel: string,
    state: ActionState,
    loadingLabel: string,
    successLabel: string
  ) => {
    if (state === "loading") return loadingLabel;
    if (state === "success") return successLabel;
    return baseLabel;
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        background: "var(--wp-bg-panel)",
        border: "0.5px solid var(--wp-border)",
        borderRadius: 8,
      }}
    >
      <div className="flex h-[2px] w-full shrink-0">
        <div className="flex-1" style={{ background: "var(--wp-moderate)" }} />
        <div className="flex-1" style={{ background: "var(--wp-good)" }} />
        <div className="flex-1" style={{ background: "var(--wp-severe)" }} />
      </div>

      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--wp-border)" }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--wp-text-muted)" }}
            >
              Copilot Action Brief
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest"
              style={{
                background: "var(--wp-moderate-dim)",
                color: "var(--wp-moderate)",
                border: "0.5px solid var(--wp-moderate-border)",
              }}
            >
              AI generated
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--wp-text-secondary)" }}>
            Synthesized protocol ·{" "}
            <span style={{ color: "var(--wp-text-primary)" }}>
              {data.location_name}
            </span>
          </p>
        </div>

        <button
          onClick={onClose}
          disabled={isBusy}
          className="shrink-0 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest transition-colors disabled:opacity-50"
          style={{
            background: "var(--wp-bg-overlay)",
            color: "var(--wp-text-muted)",
            border: "0.5px solid var(--wp-border-hover)",
          }}
        >
          Dismiss
        </button>
      </div>

      {feedback.type && (
        <div
          className="px-4 py-2 text-[11px]"
          style={{
            borderBottom: "0.5px solid var(--wp-border)",
            background:
              feedback.type === "success"
                ? "var(--wp-good-dim)"
                : "var(--wp-severe-dim)",
            color:
              feedback.type === "success"
                ? "var(--wp-good)"
                : "var(--wp-severe)",
          }}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col divide-y" style={{ borderColor: "var(--wp-border)" }}>
        {sections.map((s, i) => (
          <div
            key={s.key}
            className="flex gap-3 px-4 py-3"
            style={{
              borderBottom:
                i < sections.length - 1 ? "0.5px solid var(--wp-border)" : "none",
            }}
          >
            <div
              className="mt-0.5 shrink-0 rounded-full"
              style={{ width: 2, background: s.color, minHeight: 16, alignSelf: "stretch" }}
            />

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: s.color }}
                >
                  {s.label}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px]"
                  style={{
                    background: s.dimColor,
                    color: s.color,
                    border: `0.5px solid ${s.borderColor}`,
                  }}
                >
                  {s.sublabel}
                </span>
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: "var(--wp-text-secondary)" }}
              >
                {data[s.key]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: "0.5px solid var(--wp-border)", background: "var(--wp-bg-base)" }}
      >
        <button
          onClick={handleDispatchOfficer}
          disabled={isBusy}
          className="flex-1 rounded px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--wp-moderate-dim)",
            color: "var(--wp-moderate)",
            border: "0.5px solid var(--wp-moderate-border)",
          }}
        >
          {getButtonLabel(
            "Dispatch officer",
            dispatchState,
            "Dispatching...",
            "Officer emailed"
          )}
        </button>

        <button
          onClick={handleBroadcastAdvisory}
          disabled={isBusy}
          className="flex-1 rounded px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--wp-good-dim)",
            color: "var(--wp-good)",
            border: "0.5px solid var(--wp-good-border)",
          }}
        >
          {getButtonLabel(
            "Broadcast advisory",
            broadcastState,
            "Sending...",
            "Advisory sent"
          )}
        </button>

        <button
          onClick={handleEscalateNow}
          disabled={isBusy}
          className="flex-1 rounded px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--wp-severe-dim)",
            color: "var(--wp-severe)",
            border: "0.5px solid var(--wp-severe-border)",
          }}
        >
          {getButtonLabel(
            "Escalate now",
            escalateState,
            "Escalating...",
            "Escalated"
          )}
        </button>
      </div>
    </div>
  );
}