"use client";

import { useState } from "react";
import api from "@/lib/api";
import AIBriefPanel from "@/components/AIBriefPanel";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

export default function NodeCard(props: NodeCardProps) {
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formattedTime = props.timestamp
    ? new Date(props.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "--:--";

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

  // Determine border color based on severity to give subtle context
  const cardBorderClass = 
    props.severity === 'severe' ? 'border-rose-300' :
    props.severity === 'poor' ? 'border-orange-300' :
    props.severity === 'moderate' ? 'border-amber-300' : 'border-slate-200';

  return (
    <Card className={`flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md ${cardBorderClass}`}>
      
      {/* HEADER: Identification & Status */}
      <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {props.node_id}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ward {props.ward_id}
              </span>
            </div>
            <CardTitle className="text-base truncate" title={props.location_name}>
              {props.location_name}
            </CardTitle>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={props.severity === 'severe' ? 'critical' : props.severity === 'good' ? 'stable' : 'warning'} className="capitalize">
              {props.severity}
            </Badge>
            {props.is_hotspot && (
              <Badge variant="critical" className="animate-pulse">
                Hotspot
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-5 pt-5">
        
        {/* ROW 1: Core Vitals (Always visible) */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">PM 2.5</p>
            <p className={`text-xl font-bold tracking-tight ${props.pm25 > 60 ? 'text-rose-600' : 'text-slate-900'}`}>
              {props.pm25}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Likely Source</p>
            <p className="text-sm font-semibold text-slate-900 capitalize truncate" title={formatSource(props.likely_source)}>
              {formatSource(props.likely_source)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Priority</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold tracking-tight text-slate-900">{props.priority_score}</p>
              <span className="text-xs font-medium text-slate-500">/100</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Context Tags */}
        <div className="flex flex-wrap gap-1.5">
            <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">
              Urgency: <span className="capitalize ml-1">{props.urgency}</span>
            </Badge>
            {props.escalation_required && (
              <Badge variant="critical" className="text-[10px] px-1.5 py-0.5">Escalation Req</Badge>
            )}
            {props.sensitive_zone && (
              <Badge className="bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 text-[10px] px-1.5 py-0.5">
                Sensitive Zone
              </Badge>
            )}
            {props.recurrence_count > 0 && (
              <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">
                {props.recurrence_count}x Recurrence
              </Badge>
            )}
        </div>

        {/* EXPANDABLE SECTION: Deep Analytics */}
        <div className="border-t border-slate-100 pt-3">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 w-full text-left flex items-center justify-between focus:outline-none"
          >
            {showDetails ? "Hide Telemetry & Attribution" : "View Telemetry & Attribution"}
            <span className="text-slate-400">{showDetails ? "▲" : "▼"}</span>
          </button>
          
          {showDetails && (
            <div className="mt-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
              
              {/* Telemetry Row */}
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase text-slate-400">PM 10</p>
                  <p className="text-xs font-semibold text-slate-700">{props.pm10}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-slate-400">Temp</p>
                  <p className="text-xs font-semibold text-slate-700">{props.temperature}°C</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-slate-400">Hum</p>
                  <p className="text-xs font-semibold text-slate-700">{props.humidity}%</p>
                </div>
              </div>

              {/* Attribution */}
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                  Source Attribution 
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded">
                    {Math.round(props.confidence_score * 100)}% Confidence
                  </span>
                </p>
                <div className="space-y-1.5 mt-2">
                  {Object.entries(props.source_scores).map(([source, score]) => (
                    <div key={source} className="flex items-center gap-2">
                      <p className="text-[10px] w-20 truncate capitalize text-slate-600">{formatSource(source)}</p>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${Math.round(score * 100)}%` }} />
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 w-6 text-right">{Math.round(score * 100)}%</p>
                    </div>
                  ))}
                </div>
                {props.attribution_reasons.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-0.5">
                    {props.attribution_reasons.slice(0, 2).map((reason, idx) => (
                       <li key={idx} className="text-[10px] text-slate-500 leading-tight">{reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Target Team & Actions */}
              <div>
                 <p className="text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                  Action Protocol
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1 rounded capitalize">
                    {props.target_team}
                  </span>
                 </p>
                 {props.recommended_actions.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {props.recommended_actions.map((action, idx) => (
                       <li key={idx} className="text-[10px] text-slate-700 leading-tight">{action}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-slate-100 flex flex-col gap-3 py-3">
        {briefData && (
          <div className="w-full mb-2">
            <AIBriefPanel data={briefData} onClose={() => setBriefData(null)} />
          </div>
        )}
        
        <div className="flex items-center justify-between w-full">
          <p className="text-[10px] font-medium text-slate-400">Sync: {formattedTime}</p>
          <div className="flex gap-2">
            <button
              onClick={generateBrief}
              disabled={loadingBrief}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {loadingBrief ? "Thinking..." : "Copilot"}
            </button>
            {props.is_hotspot && (
              <button
                onClick={createTicket}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors shadow-sm"
              >
                Ticket
              </button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}