"use client";

import { useEffect, useState } from "react";
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
  highest_risk_node: {
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
  } | null;
  top_priority_node: {
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
  } | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hotspotNodes = latestReadings.filter((reading) => reading.is_hotspot);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-lg text-gray-700">Loading WardPulse dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <DashboardHeader />
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-700">
          <h2 className="text-xl font-semibold">Dashboard Error</h2>
          <p className="mt-2">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <DashboardHeader />

      {hotspotNodes.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5">
          <h2 className="text-xl font-semibold text-red-800">
            Active Hotspots: {hotspotNodes.length}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {hotspotNodes.map((node) => (
              <span
                key={node.node_id}
                className="rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white"
              >
                {node.node_id} — {node.location_name} —{" "}
                {node.likely_source.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {situationRoom && (
        <div className="mb-8">
          <SituationRoomPanel data={situationRoom} />
        </div>
      )}

      <div className="mb-8">
        <WardMapPanel nodes={latestReadings} />
      </div>

      {summary && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Nodes" value={summary.total_nodes} />
          <SummaryCard title="Total Readings" value={summary.total_readings} />
          <SummaryCard title="Average PM2.5" value={summary.average_pm25} />
          <SummaryCard title="Average PM10" value={summary.average_pm10} />
        </div>
      )}

      <div className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Latest Node Readings
        </h2>

        {latestReadings.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-gray-600">No readings available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestReadings.map((reading) => (
              <NodeCard key={reading.node_id} {...reading} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Live Pollution Trends
        </h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {latestReadings.map((reading) => (
            <NodeTrendChart
              key={reading.node_id}
              title={`${reading.node_id} — ${reading.location_name}`}
              data={nodeHistories[reading.node_id] || []}
            />
          ))}
        </div>
      </div>
    </main>
  );
}