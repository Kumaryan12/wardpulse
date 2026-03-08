"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import SummaryCard from "@/components/SummaryCard";
import NodeCard from "@/components/NodeCard";
import DashboardHeader from "@/components/DashboardHeader";
import NodeTrendChart from "@/components/NodeChartTrend";
import WardMapPanel from "@/components/WardMapPanel";
import SituationRoomPanel from "@/components/SituationRoomPanel";
import ChronicRiskPanel from "@/components/ChronicRiskPanel";
import AIBriefPanel from "@/components/AIBriefPanel";

// ... [Keep all your existing type definitions here exactly as they are] ...
type DashboardSummary = {
  total_nodes: number;
  total_readings: number;
  average_pm25: number;
  average_pm10: number;
};

type LatestReading = {
  node_id: string;
  location_name: string;
  ward_id: string;
  latitude?: number;
  longitude?: number;
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

type SituationRoomData = {
  active_hotspots: number;
  severe_nodes: number;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  top_source: string;
  escalation_required_count: number;
  sensitive_zone_count: number;
  highest_risk_node: any | null;
  top_priority_node: any | null;
};

type ChronicRiskData = {
  total_chronic_nodes: number;
  critical_chronic_nodes: number;
  chronic_nodes: any[];
};

type TrendPoint = {
  timestamp: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
};

export default function HomePage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [latestReadings, setLatestReadings] = useState<LatestReading[]>([]);
  const [nodeHistories, setNodeHistories] = useState<Record<string, TrendPoint[]>>({});
  const [situationRoom, setSituationRoom] = useState<SituationRoomData | null>(null);
  const [chronicRisk, setChronicRisk] = useState<ChronicRiskData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Smooth scroll only if it's on mobile, otherwise keep the bento box in view
    if (window.innerWidth < 1024) {
      const target = nodeRefs.current[nodeId];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);

      const [summaryRes, readingsRes, situationRes, chronicRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/readings/latest"),
        api.get("/dashboard/situation-room"),
        api.get("/memory/chronic-risk"),
      ]);

      setSummary(summaryRes.data);
      setLatestReadings(readingsRes.data);
      setSituationRoom(situationRes.data);
      setChronicRisk(chronicRes.data);

      const historyResults = await Promise.all(
        readingsRes.data.map(async (reading: LatestReading) => {
          const res = await api.get(`/readings/history/${reading.node_id}?limit=12`);
          return { node_id: reading.node_id, data: res.data as TrendPoint[] };
        })
      );

      const historyMap: Record<string, TrendPoint[]> = {};
      historyResults.forEach((item) => {
        historyMap[item.node_id] = item.data;
      });

      setNodeHistories(historyMap);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const hotspotNodes = latestReadings.filter((reading) => reading.is_hotspot);

  // Dynamically map standard reading data into the format the AI Brief expects
  const selectedReading = latestReadings.find((r) => r.node_id === selectedNodeId);
  const aiBriefData = selectedReading ? {
    node_id: selectedReading.node_id,
    location_name: selectedReading.location_name,
    officer_brief: selectedReading.recommended_actions.join(". ") || "Standard monitoring protocol initiated.",
    citizen_advisory: `Warning: Elevated pollution detected due to ${selectedReading.likely_source.replaceAll("_", " ")}. Vulnerable groups should limit outdoor exertion.`,
    escalation_note: selectedReading.priority_reasons.join(". ") || "No immediate escalation required."
  } : null;


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Initializing WardPulse Copilot...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 max-w-[1600px] mx-auto">
        <DashboardHeader />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-800">System Telemetry Error</h2>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500">
            Retry Connection
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] flex flex-col gap-6">
        
        {/* Global Navigation */}
        <DashboardHeader />

        {/* Tactical Alert Banner (Only shows if there are hotspots) */}
        {hotspotNodes.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 animate-ping rounded-full bg-rose-500"></span>
              <h2 className="text-sm font-bold tracking-tight text-rose-900 uppercase">
                {hotspotNodes.length} Active Hotspots Detected
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotspotNodes.map((node) => (
                <button
                  key={node.node_id}
                  onClick={() => handleSelectNode(node.node_id)}
                  className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 shadow-sm transition-colors hover:bg-rose-600 hover:text-white"
                >
                  Focus {node.node_id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ROW 1: System Summaries */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <SummaryCard title="Total Monitored Nodes" value={summary.total_nodes} status="neutral" />
            <SummaryCard title="Live Telemetry Readings" value={summary.total_readings} />
            <SummaryCard title="Citywide Average PM2.5" value={`${summary.average_pm25.toFixed(1)} µg/m³`} trend={summary.average_pm25 > 60 ? "Elevated" : "Stable"} />
            <SummaryCard title="Citywide Average PM10" value={`${summary.average_pm10.toFixed(1)} µg/m³`} />
          </div>
        )}

        {/* ROW 2: The Situation Room Console (Full Width) */}
        {situationRoom && (
          <section>
            <SituationRoomPanel data={situationRoom} onSelectNode={handleSelectNode} />
          </section>
        )}

        {/* ROW 3: Main Tactical Bento Box (Map + Copilot Insights) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Side: Map (Spans 7/12 columns on large screens) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <WardMapPanel
              nodes={latestReadings}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNodeId}
            />
          </div>

          {/* Right Side: Copilot Intelligence (Spans 5/12 columns) */}
          <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
            {aiBriefData ? (
              <AIBriefPanel data={aiBriefData} onClose={() => setSelectedNodeId(null)} />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center min-h-[200px]">
                <p className="text-sm font-medium text-slate-500">
                  Select a node on the map to generate an AI Copilot action brief.
                </p>
              </div>
            )}

            {chronicRisk && (
              <div className="flex-1">
                <ChronicRiskPanel data={chronicRisk} onSelectNode={handleSelectNode} />
              </div>
            )}
          </div>
        </section>

        {/* DIVIDER */}
        <div className="my-4 h-px w-full bg-slate-200"></div>

        {/* ROW 4: Deep Analytics Grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Node Telemetry Cards</h2>
            <span className="text-xs font-semibold text-slate-500 uppercase">System Logs</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestReadings.map((reading) => (
              <div
                key={reading.node_id}
                ref={(el) => {
                  nodeRefs.current[reading.node_id] = el;
                }}
                className={`transition-all ${selectedNodeId === reading.node_id ? "ring-2 ring-indigo-500 ring-offset-2 rounded-xl" : ""}`}
              >
                <NodeCard {...reading} />
              </div>
            ))}
          </div>
        </section>

        {/* ROW 5: Trends Grid */}
        <section className="pb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Live Pollution Trends</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {latestReadings.map((reading) => (
              <div
                key={`trend-${reading.node_id}`}
                className={`transition-all ${selectedNodeId === reading.node_id ? "ring-2 ring-indigo-500 ring-offset-2 rounded-xl" : ""}`}
              >
                <NodeTrendChart
                  title={`${reading.node_id} — ${reading.location_name}`}
                  data={nodeHistories[reading.node_id] || []}
                />
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}