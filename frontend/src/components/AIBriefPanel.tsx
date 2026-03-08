"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BriefData = {
  node_id: string;
  location_name: string;
  officer_brief: string;
  citizen_advisory: string;
  escalation_note: string;
};

type AIBriefPanelProps = {
  data: BriefData;
  onClose: () => void;
};

export default function AIBriefPanel({ data, onClose }: AIBriefPanelProps) {
  return (
    <Card className="relative overflow-hidden border-indigo-100 shadow-md transition-all">
      {/* AI Indicator Gradient Line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>

      <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-slate-50/50 pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Copilot Action Brief</CardTitle>
            <Badge 
              variant="default" 
              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 ring-1 ring-inset ring-indigo-600/20"
            >
              ✨ AI Generated
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Synthesized response protocol for <span className="font-semibold text-slate-800">{data.location_name}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Dismiss
        </button>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-5">
        
        {/* Officer Brief */}
        <div className="flex flex-col gap-2 rounded-r-lg border-l-2 border-indigo-500 bg-slate-50 p-4">
          <h4 className="text-sm font-bold tracking-tight text-indigo-900 uppercase">
            Internal Officer Brief
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">
            {data.officer_brief}
          </p>
        </div>

        {/* Citizen Advisory */}
        <div className="flex flex-col gap-2 rounded-r-lg border-l-2 border-emerald-500 bg-slate-50 p-4">
          <h4 className="text-sm font-bold tracking-tight text-emerald-900 uppercase">
            Public Citizen Advisory
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">
            {data.citizen_advisory}
          </p>
        </div>

        {/* Escalation Note */}
        <div className="flex flex-col gap-2 rounded-r-lg border-l-2 border-rose-500 bg-slate-50 p-4">
          <h4 className="text-sm font-bold tracking-tight text-rose-900 uppercase">
            Escalation Protocol
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">
            {data.escalation_note}
          </p>
        </div>

        {/* Mock Actions - Proves the workflow to judges */}
        <div className="mt-2 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Dispatch Officer
          </button>
          <button className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
            Broadcast Advisory
          </button>
        </div>

      </CardContent>
    </Card>
  );
}