"use client";

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
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

export default function SituationRoomPanel({
  data,
}: SituationRoomPanelProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Situation Room</h2>
        <p className="mt-1 text-sm text-gray-600">
          Real-time operational summary for ward-level pollution response
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-sm text-gray-600">Active Hotspots</p>
          <p className="text-2xl font-bold text-red-700">{data.active_hotspots}</p>
        </div>

        <div className="rounded-xl bg-orange-50 p-4">
          <p className="text-sm text-gray-600">Severe Nodes</p>
          <p className="text-2xl font-bold text-orange-700">{data.severe_nodes}</p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm text-gray-600">Sensitive Zone Risk</p>
          <p className="text-2xl font-bold text-purple-700">{data.sensitive_zone_count}</p>
        </div>

        <div className="rounded-xl bg-red-100 p-4">
          <p className="text-sm text-gray-600">Escalations Required</p>
          <p className="text-2xl font-bold text-red-800">
            {data.escalation_required_count}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Open Tickets</p>
          <p className="text-2xl font-bold text-blue-700">{data.open_tickets}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-gray-600">Total Tickets</p>
          <p className="text-2xl font-bold text-slate-800">{data.total_tickets}</p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm text-gray-600">Resolved Tickets</p>
          <p className="text-2xl font-bold text-green-700">{data.resolved_tickets}</p>
        </div>

        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-sm text-gray-600">Top Source Type</p>
          <p className="text-lg font-bold capitalize text-purple-700">
            {formatSource(data.top_source)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.top_priority_node && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-sm text-gray-600">Top Priority Node</p>
            <p className="mt-1 text-lg font-bold text-red-800">
              {data.top_priority_node.node_id} — {data.top_priority_node.location_name}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">Priority</p>
                <p className="font-semibold capitalize text-gray-900">
                  {data.top_priority_node.priority_level}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Score</p>
                <p className="font-semibold text-gray-900">
                  {data.top_priority_node.priority_score}/100
                </p>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-semibold capitalize text-gray-900">
                  {formatSource(data.top_priority_node.likely_source)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Recurrence</p>
                <p className="font-semibold text-gray-900">
                  {data.top_priority_node.recurrence_count}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {data.top_priority_node.sensitive_zone && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  Sensitive Zone
                  {data.top_priority_node.sensitive_zone_type
                    ? `: ${data.top_priority_node.sensitive_zone_type}`
                    : ""}
                </span>
              )}
              {data.top_priority_node.escalation_required && (
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                  Escalation Required
                </span>
              )}
            </div>
          </div>
        )}

        {data.highest_risk_node && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-gray-600">Highest PM2.5 Node</p>
            <p className="mt-1 text-lg font-bold text-orange-800">
              {data.highest_risk_node.node_id} — {data.highest_risk_node.location_name}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">PM2.5</p>
                <p className="font-semibold text-gray-900">{data.highest_risk_node.pm25}</p>
              </div>
              <div>
                <p className="text-gray-500">PM10</p>
                <p className="font-semibold text-gray-900">{data.highest_risk_node.pm10}</p>
              </div>
              <div>
                <p className="text-gray-500">Severity</p>
                <p className="font-semibold capitalize text-gray-900">
                  {data.highest_risk_node.severity}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-semibold capitalize text-gray-900">
                  {formatSource(data.highest_risk_node.likely_source)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}