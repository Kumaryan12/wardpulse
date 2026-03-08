"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SituationNode = {
  node_id: string;
  location_name: string;
  pm25: number;
  pm10: number;
  severity: string;
  is_hotspot: boolean;
  likely_source: string;
  priority_score: number;
  priority_level: string;
  escalation_required: boolean;
  sensitive_zone: boolean;
  sensitive_zone_type?: string | null;
  recurrence_count: number;
};

type SituationRoomData = {
  active_hotspots: number;
  severe_nodes: number;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  top_source: string;
  escalation_required_count: number;
  sensitive_zone_count: number;
  highest_risk_node: SituationNode | null;
  top_priority_node: SituationNode | null;
};

type SituationRoomPanelProps = {
  data: SituationRoomData;
  onSelectNode: (nodeId: string) => void;
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

// A local helper component to keep the grid extremely clean
function MetricItem({ 
  label, 
  value, 
  valueColor = "text-slate-900" 
}: { 
  label: string; 
  value: string | number; 
  valueColor?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

export default function SituationRoomPanel({
  data,
  onSelectNode,
}: SituationRoomPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Situation Room</CardTitle>
        <p className="text-sm text-slate-500">
          Real-time operational summary for ward-level pollution response.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Level Metrics */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricItem 
            label="Active Hotspots" 
            value={data.active_hotspots} 
            valueColor={data.active_hotspots > 0 ? "text-rose-600" : "text-slate-900"} 
          />
          <MetricItem 
            label="Severe Nodes" 
            value={data.severe_nodes} 
            valueColor={data.severe_nodes > 0 ? "text-rose-600" : "text-slate-900"} 
          />
          <MetricItem 
            label="Sensitive Zone Risk" 
            value={data.sensitive_zone_count} 
            valueColor={data.sensitive_zone_count > 0 ? "text-amber-600" : "text-slate-900"} 
          />
          <MetricItem 
            label="Escalations Req." 
            value={data.escalation_required_count} 
            valueColor={data.escalation_required_count > 0 ? "text-rose-600" : "text-slate-900"} 
          />
          <MetricItem label="Open Tickets" value={data.open_tickets} valueColor="text-indigo-600" />
          <MetricItem label="Total Tickets" value={data.total_tickets} />
          <MetricItem label="Resolved Tickets" value={data.resolved_tickets} valueColor="text-emerald-600" />
          <MetricItem label="Top Source" value={formatSource(data.top_source)} className="capitalize text-lg" />
        </div>

        {/* Actionable Nodes */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.top_priority_node && (
            <button
              type="button"
              onClick={() => onSelectNode(data.top_priority_node!.node_id)}
              className="group flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Action Required: Top Priority</span>
                <Badge variant="critical">Critical</Badge>
              </div>
              
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {data.top_priority_node.location_name}
                </p>
                <p className="text-xs font-mono text-slate-500">ID: {data.top_priority_node.node_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-100 pt-3 md:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Score</p>
                  <p className="font-semibold text-slate-900">{data.top_priority_node.priority_score}/100</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Source</p>
                  <p className="font-semibold capitalize text-slate-900 truncate">
                    {formatSource(data.top_priority_node.likely_source)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Recurrence</p>
                  <p className="font-semibold text-slate-900">{data.top_priority_node.recurrence_count}x</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Zone</p>
                  <p className="font-semibold capitalize text-slate-900 truncate">
                    {data.top_priority_node.sensitive_zone ? "Sensitive" : "Standard"}
                  </p>
                </div>
              </div>
            </button>
          )}

          {data.highest_risk_node && (
            <button
              type="button"
              onClick={() => onSelectNode(data.highest_risk_node!.node_id)}
              className="group flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Observation: Highest PM2.5</span>
                <Badge variant={data.highest_risk_node.severity === 'hazardous' ? 'critical' : 'warning'} className="capitalize">
                  {data.highest_risk_node.severity}
                </Badge>
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {data.highest_risk_node.location_name}
                </p>
                <p className="text-xs font-mono text-slate-500">ID: {data.highest_risk_node.node_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-100 pt-3 md:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">PM2.5</p>
                  <p className="font-semibold text-rose-600">{data.highest_risk_node.pm25} µg/m³</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">PM10</p>
                  <p className="font-semibold text-slate-900">{data.highest_risk_node.pm10} µg/m³</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500">Likely Source</p>
                  <p className="font-semibold capitalize text-slate-900 truncate">
                    {formatSource(data.highest_risk_node.likely_source)}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}