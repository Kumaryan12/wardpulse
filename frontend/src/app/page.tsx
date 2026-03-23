"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import SummaryCard from "@/components/SummaryCard";
import NodeCard from "@/components/NodeCard";
import DashboardHeader from "@/components/DashboardHeader";
import NodeTrendChart from "@/components/NodeChartTrend";
import WardMapPanel from "@/components/WardMapPanel";
import SituationRoomPanel from "@/components/SituationRoomPanel";

type DashboardSummary = {
  total_nodes: number;
  total_readings: number;
  average_pm25: number;
  average_pm10: number;
  average_noise:number;
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
  noise_db: number;
  noise_status: string;
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
  high_noise_nodes:number;
  average_noise: number;
};

type TrendPoint = {
  timestamp: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  noise_db: number;
};

type ChronicRiskData = {
  total_chronic_nodes: number;
  critical_chronic_nodes: number;
  chronic_nodes: any[];
};

export default function HomePage() {
  const [summary, setSummary]               = useState<DashboardSummary | null>(null);
  const [latestReadings, setLatestReadings] = useState<LatestReading[]>([]);
  const [nodeHistories, setNodeHistories]   = useState<Record<string, TrendPoint[]>>({});
  const [situationRoom, setSituationRoom]   = useState<SituationRoomData | null>(null);
  const [chronicRisk, setChronicRisk]       = useState<ChronicRiskData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    
    const target = nodeRefs.current[nodeId];
    if (target) {
      target.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [summaryRes, readingsRes, situationRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/readings/latest"),
        api.get("/dashboard/situation-room"),
      ]);

      setSummary(summaryRes.data);
      setLatestReadings(readingsRes.data);
      setSituationRoom(situationRes.data);

      try {
        const chronicRes = await api.get("/dashboard/chronic-risk");
        setChronicRisk(chronicRes.data);
      } catch {
        // chronic risk endpoint optional
      }

      const historyMap: Record<string, TrendPoint[]> = {};
      for (const reading of readingsRes.data) {
        try {
          const res = await api.get(`/readings/history/${reading.node_id}?limit=12`);
          historyMap[reading.node_id] = res.data as TrendPoint[];
        } catch {
          historyMap[reading.node_id] = [];
        }
      }
      setNodeHistories(historyMap);
    } catch (err: any) {
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

  const hotspotNodes    = latestReadings.filter((r) => r.is_hotspot);

  /* ── Loading ── */
  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--wp-bg-base)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: "var(--wp-border)",
              borderTopColor: "var(--wp-moderate)",
            }}
          />
          <p className="wp-label">Initializing telemetry…</p>
        </div>
      </main>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <main
        className="flex min-h-screen flex-col"
        style={{ background: "var(--wp-bg-base)" }}
      >
        <DashboardHeader />
        <div className="mx-auto w-full max-w-[1600px] p-6">
          <div
            className="rounded p-5"
            style={{
              background: "var(--wp-severe-dim)",
              border: "0.5px solid var(--wp-severe-border)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--wp-severe)" }}>
              System telemetry error
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--wp-text-muted)" }}>
              {error}
            </p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 rounded px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest transition-colors"
              style={{
                background: "var(--wp-severe-dim)",
                color: "var(--wp-severe)",
                border: "0.5px solid var(--wp-severe-border)",
              }}
            >
              Retry connection
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ── Main ── */
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--wp-bg-base)" }}
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
        <DashboardHeader />
      </div>

      <div className="mx-auto max-w-[1600px] flex flex-col gap-0">

        {/* ── Hotspot alert banner ── */}
        {hotspotNodes.length > 0 && (
          <div
            className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between animate-in slide-in-from-top-2 fade-in duration-500 delay-100 fill-mode-both"
            style={{
              background: "var(--wp-severe-dim)",
              borderBottom: "0.5px solid var(--wp-severe-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="wp-ping-ring" style={{ background: "var(--wp-severe)" }} />
                <span
                  className="relative block h-2 w-2 rounded-full"
                  style={{ background: "var(--wp-severe)" }}
                />
              </span>
              <span
                className="text-[11px] font-medium uppercase tracking-widest"
                style={{ color: "var(--wp-severe)" }}
              >
                {hotspotNodes.length} active hotspot{hotspotNodes.length > 1 ? "s" : ""} detected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotspotNodes.map((node) => (
                <button
                  key={node.node_id}
                  onClick={() => handleSelectNode(node.node_id)}
                  className="rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest transition-colors hover:brightness-110"
                  style={{
                    background: "var(--wp-bg-panel)",
                    color: "var(--wp-severe)",
                    border: "0.5px solid var(--wp-severe-border)",
                  }}
                >
                  Focus {node.node_id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 p-6">

          {summary && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 fill-mode-both">
              <SummaryCard
                title="Monitored nodes"
                value={summary.total_nodes}
                status="neutral"
              />
              <SummaryCard
                title="Live readings"
                value={summary.total_readings}
              />
              <SummaryCard
                title="Avg PM2.5"
                value={`${summary.average_pm25.toFixed(1)} µg/m³`}
                trend={summary.average_pm25 > 60 ? "Above safe limit" : "Within safe limit"}
                status={summary.average_pm25 > 60 ? "critical" : "stable"}
              />
              <SummaryCard
                title="Avg PM10"
                value={`${summary.average_pm10.toFixed(1)} µg/m³`}
                status={summary.average_pm10 > 100 ? "warning" : "stable"}
              />
              <SummaryCard
                title="Avg Noise"
                value={`${summary.average_noise.toFixed(1)} dB`}
                trend={
                  summary.average_noise >= 85
                    ? "Critical acoustic stress"
                    : summary.average_noise >= 70
                    ? "High urban noise"
                    : summary.average_noise >= 55
                    ? "Elevated noise"
                    : "Acceptable noise"
                }
                status={
                  summary.average_noise >= 85
                    ? "critical"
                    : summary.average_noise >= 70
                    ? "warning"
                    : "stable"
                }
              />
            </div>
          )}

          {/* ── Situation Room ── */}
          {situationRoom && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-both">
              <SituationRoomPanel
                data={situationRoom}
                onSelectNode={handleSelectNode}
              />
            </div>
          )}

          {/* ── Full Width Radar Map ── */}
          <div className="w-full flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">
            <WardMapPanel
              nodes={latestReadings}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNodeId}
            />
          </div>

          {/* ── Section divider ── */}
          <div
            className="flex items-center gap-3 animate-in fade-in duration-700 delay-500 fill-mode-both"
            style={{ borderTop: "0.5px solid var(--wp-border)", paddingTop: "1.5rem" }}
          >
            <span className="wp-label">Node telemetry</span>
            <div className="flex-1" style={{ height: "0.5px", background: "var(--wp-border)" }} />
            <span className="wp-label">{latestReadings.length} nodes active</span>
          </div>

          {/* ── Node cards ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 fill-mode-both">
            {latestReadings.map((reading) => (
              <div
                key={reading.node_id}
                ref={(el) => { nodeRefs.current[reading.node_id] = el; }}
                className="transition-all duration-300"
                style={
                  selectedNodeId === reading.node_id
                    ? { outline: `2px solid var(--wp-moderate)`, outlineOffset: 4, borderRadius: 12 }
                    : {}
                }
              >
                <NodeCard {...reading} />
              </div>
            ))}
          </div>

          {/* ── Section divider ── */}
          <div
            className="flex items-center gap-3"
            style={{ borderTop: "0.5px solid var(--wp-border)", paddingTop: "1.5rem" }}
          >
            <span className="wp-label">Live pollution trends</span>
            <div className="flex-1" style={{ height: "0.5px", background: "var(--wp-border)" }} />
          </div>

          {/* ── Trend charts ── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {latestReadings.map((reading) => (
              <div
                key={`trend-${reading.node_id}`}
                className="transition-all duration-300"
                style={
                  selectedNodeId === reading.node_id
                    ? { outline: `2px solid var(--wp-moderate)`, outlineOffset: 4, borderRadius: 12 }
                    : {}
                }
              >
                <NodeTrendChart
                  title={`${reading.node_id} — ${reading.location_name}`}
                  data={nodeHistories[reading.node_id] || []}
                />
              </div>
            ))}
          </div>

          {/* ── Chronic risk (if available) ── */}
          {chronicRisk && chronicRisk.chronic_nodes.length > 0 && (
            <>
              <div
                className="flex items-center gap-3"
                style={{ borderTop: "0.5px solid var(--wp-border)", paddingTop: "1.5rem" }}
              >
                <span className="wp-label">Recurring hotspot memory</span>
                <div className="flex-1" style={{ height: "0.5px", background: "var(--wp-border)" }} />
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "var(--wp-severe-dim)",
                    color: "var(--wp-severe)",
                    border: "0.5px solid var(--wp-severe-border)",
                  }}
                >
                  {chronicRisk.critical_chronic_nodes} critical
                </span>
              </div>
            </>
          )}

          {/* Bottom padding */}
          <div className="h-12" />

        </div>
      </div>
    </main>
  );
}