"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ChronicNode = {
  node_id: string;
  location_name: string;
  ward_id: string;
  current_pm25: number;
  current_pm10: number;
  severity: string;
  recurrence_count: number;
  dominant_source: string;
  priority_score: number;
  priority_level: string;
  escalation_required: boolean;
  sensitive_zone: boolean;
  chronic_recommendation: string;
};

type ChronicRiskData = {
  total_chronic_nodes: number;
  critical_chronic_nodes: number;
  chronic_nodes: ChronicNode[];
};

type ChronicRiskPanelProps = {
  data: ChronicRiskData;
  onSelectNode: (nodeId: string) => void;
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

export default function ChronicRiskPanel({ data, onSelectNode }: ChronicRiskPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Recurring Hotspot Memory</CardTitle>
        <p className="mt-1 text-sm text-slate-500">
          Historical risk intelligence tracking repeated failures and systemic intervention needs.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        
        {/* Memory Overview Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100">
            <p className="text-xs font-medium text-slate-500">Total Chronic Nodes</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
              {data.total_chronic_nodes}
            </p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 transition-colors hover:bg-rose-100">
            <p className="text-xs font-medium text-rose-600">Critical Interventions</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-rose-700">
              {data.critical_chronic_nodes}
            </p>
          </div>
        </div>

        {/* Chronic Nodes List */}
        <div className="flex flex-col gap-4">
          {data.chronic_nodes.map((node) => (
            <button
              key={node.node_id}
              type="button"
              onClick={() => onSelectNode(node.node_id)}
              className="group flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              
              {/* Header & Tags */}
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {node.location_name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">ID: {node.node_id}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  <Badge variant="neutral">{node.recurrence_count}x Recurrence</Badge>
                  {node.sensitive_zone && (
                    <Badge className="bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20">
                      Sensitive Zone
                    </Badge>
                  )}
                  {node.escalation_required && (
                    <Badge variant="critical">Escalate</Badge>
                  )}
                </div>
              </div>

              {/* Flattened Data Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-100 pt-3 md:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dominant Source</p>
                  <p className="text-sm font-semibold capitalize text-slate-900 truncate">
                    {formatSource(node.dominant_source)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</p>
                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {node.severity}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PM 2.5</p>
                  <p className={`text-sm font-semibold ${node.current_pm25 > 60 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {node.current_pm25}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority Score</p>
                  <p className="text-sm font-semibold text-slate-900">{node.priority_score}/100</p>
                </div>
              </div>

              {/* Copilot Systemic Recommendation */}
              <div className="rounded-md border-l-2 border-indigo-400 bg-indigo-50/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                  Systemic Mitigation Strategy
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {node.chronic_recommendation}
                </p>
              </div>

            </button>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}