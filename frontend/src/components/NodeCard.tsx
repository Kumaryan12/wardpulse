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
  officer_brief: string;
  citizen_advisory: string;
  escalation_note: string;
};

const severityStyles: Record<string, string> = {
  good: "border-green-400 bg-green-50",
  moderate: "border-yellow-400 bg-yellow-50",
  poor: "border-orange-400 bg-orange-50",
  severe: "border-red-500 bg-red-50",
};

const badgeStyles: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
  severe: "bg-red-100 text-red-700",
};

const urgencyStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-600 text-white",
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

export default function NodeCard(props: NodeCardProps) {
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  const formattedTime = props.timestamp
    ? new Date(props.timestamp).toLocaleString()
    : "No timestamp";

  const cardStyle = severityStyles[props.severity] || "border-gray-200 bg-white";
  const badgeStyle = badgeStyles[props.severity] || "bg-gray-100 text-gray-700";
  const urgencyStyle = urgencyStyles[props.urgency] || "bg-gray-100 text-gray-700";
  const priorityStyle = priorityStyles[props.priority_level] || "bg-gray-100 text-gray-700";

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
    } catch (error) {
      console.error("Ticket creation failed:", error);
      alert("Failed to create ticket");
    }
  };

  const generateBrief = async () => {
    try {
      setLoadingBrief(true);
      const res = await api.get(`/briefs/${props.node_id}`);
      setBriefData(res.data);
    } catch (error) {
      console.error("Brief generation failed:", error);
      alert("Failed to generate AI brief");
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm ${cardStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{props.node_id}</h3>
          <p className="mt-1 text-sm text-gray-600">{props.location_name}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {props.ward_id}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeStyle}`}>
            {props.severity}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${urgencyStyle}`}>
            {props.urgency} urgency
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${priorityStyle}`}>
            {props.priority_level} priority
          </span>
          {props.is_hotspot && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              Hotspot
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Priority Shield Score</p>
            <p className="text-2xl font-bold text-gray-900">{props.priority_score}/100</p>
          </div>
          {props.escalation_required && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              Escalation Required
            </span>
          )}
        </div>

        <div className="mt-3 h-3 rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-slate-800"
            style={{ width: `${props.priority_score}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {props.sensitive_zone && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              Sensitive Zone{props.sensitive_zone_type ? `: ${props.sensitive_zone_type}` : ""}
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Recurrence Count: {props.recurrence_count}
          </span>
        </div>

        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-800">
          {props.priority_reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-gray-600">PM2.5</p>
          <p className="text-lg font-bold text-gray-900">{props.pm25}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-gray-600">PM10</p>
          <p className="text-lg font-bold text-gray-900">{props.pm10}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-gray-600">Temp</p>
          <p className="text-lg font-bold text-gray-900">{props.temperature}°C</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-gray-600">Humidity</p>
          <p className="text-lg font-bold text-gray-900">{props.humidity}%</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-sm text-gray-600">Likely Source</p>
          <p className="text-base font-semibold capitalize text-gray-900">
            {formatSource(props.likely_source)}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-base font-semibold text-gray-900">
            {Math.round(props.confidence_score * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 p-3">
        <p className="text-sm text-gray-600">Attribution Rationale</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
          {props.attribution_reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 p-3">
        <p className="text-sm text-gray-600">Source Score Breakdown</p>
        <div className="mt-2 space-y-2">
          {Object.entries(props.source_scores).map(([source, score]) => (
            <div key={source}>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-700">
                <span className="capitalize">{formatSource(source)}</span>
                <span>{Math.round(score * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-slate-700"
                  style={{ width: `${Math.round(score * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 p-3">
        <p className="text-sm text-gray-600">Target Team</p>
        <p className="text-base font-semibold text-gray-900">{props.target_team}</p>
      </div>

      <div className="mt-4 rounded-xl bg-white/70 p-3">
        <p className="text-sm font-semibold text-gray-700">Recommended Actions</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
          {props.recommended_actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={generateBrief}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          disabled={loadingBrief}
        >
          {loadingBrief ? "Generating Brief..." : "Generate AI Brief"}
        </button>

        {props.is_hotspot && (
          <button
            onClick={createTicket}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Create Action Ticket
          </button>
        )}
      </div>

      {briefData && (
        <AIBriefPanel
          data={briefData}
          onClose={() => setBriefData(null)}
        />
      )}

      <p className="mt-4 text-xs text-gray-500">Updated: {formattedTime}</p>
    </div>
  );
}