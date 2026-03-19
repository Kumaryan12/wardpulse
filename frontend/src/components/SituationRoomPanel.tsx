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
  onSelectNode: (nodeId: string) => void;
};

function formatSource(source: string) {
  return source.replaceAll("_", " ");
}

function StatCell({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: "severe" | "poor" | "good" | "moderate" | "muted";
  sub?: string;
}) {
  const colorMap = {
    severe:   "var(--wp-severe)",
    poor:     "var(--wp-poor)",
    good:     "var(--wp-good)",
    moderate: "var(--wp-moderate)",
    muted:    "var(--wp-text-muted)",
  };

  const activeColor = colorMap[color];

  return (
    <div 
      className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-white/5"
      style={{ background: "var(--wp-bg-panel)" }}
    >
      <div className="flex items-center gap-1.5">
        {/* Tiny status dot instead of coloring the whole number */}
        {color !== "muted" && (
          <span 
            className="h-1.5 w-1.5 rounded-full shadow-sm" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}80` }} 
          />
        )}
        <span className="wp-label truncate">{label}</span>
      </div>
      
      <div>
        <span
          className="font-mono text-2xl font-semibold tracking-tight"
          style={{ color: "var(--wp-text-primary)" }}
        >
          {value}
        </span>
        {sub && <p className="wp-caption mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function NodeActionCard({
  tag,
  tagColor,
  node,
  metaRows,
  onClick,
  accentColor,
}: {
  tag: string;
  tagColor: string;
  node: SituationNode;
  metaRows: { label: string; value: string; highlight?: boolean }[];
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col gap-0 overflow-hidden rounded-xl text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none"
      style={{
        background: "var(--wp-bg-panel)",
        border: `1px solid var(--wp-border)`,
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Premium Linear-style hover glow */}
      <div 
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ 
          background: `radial-gradient(circle at top right, ${accentColor}15, transparent 60%)` 
        }}
      />

      <div className="relative z-10 flex flex-col gap-4 p-5">
        {/* Tag row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}40` }}
              >
                {tag}
              </span>
              {node.escalation_required && (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ background: "var(--wp-severe-dim)", color: "var(--wp-severe)", border: "1px solid var(--wp-severe-border)" }}
                >
                  Escalation Req.
                </span>
              )}
            </div>
            
            <p className="mt-2 text-base font-semibold tracking-tight transition-colors" style={{ color: "var(--wp-text-primary)" }}>
              {node.location_name}
            </p>
            <p className="font-mono text-[10px]" style={{ color: "var(--wp-text-muted)" }}>
              {node.node_id}
            </p>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="h-px w-full" style={{ background: "var(--wp-border)" }} />

        {/* Meta grid - Stark white values, monospace where applicable */}
        <div className="grid grid-cols-4 gap-3">
          {metaRows.map((m) => (
            <div key={m.label}>
              <p className="wp-label mb-1">{m.label}</p>
              <p
                className={`text-xs font-medium capitalize truncate ${m.label === 'Score' || m.label === 'PM2.5' || m.label === 'PM10' ? 'font-mono' : ''}`}
                style={{ color: "var(--wp-text-primary)" }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Priority bar - Muted but elegant */}
        <div className="mt-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="wp-label">Priority Index</span>
            <span className="font-mono text-[10px] font-medium" style={{ color: accentColor }}>
              {node.priority_score}<span style={{ color: "var(--wp-text-muted)" }}>/100</span>
            </span>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: "var(--wp-bg-overlay)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${node.priority_score}%`, background: accentColor }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SituationRoomPanel({ data, onSelectNode }: SituationRoomPanelProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl shadow-sm"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--wp-border)", background: "var(--wp-bg-overlay)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--wp-text-muted)" }}>
            Situation Room
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--wp-text-muted)" }}>
          Real-time · Ward 42
        </span>
      </div>

      {/* Stat strip - Uses grid gap to create perfect 1px inner borders */}
      <div 
        className="grid grid-cols-2 gap-px md:grid-cols-4 lg:grid-cols-8"
        style={{ background: "var(--wp-border)", borderBottom: "1px solid var(--wp-border)" }}
      >
        <StatCell
          label="Active Hotspots"
          value={data.active_hotspots}
          color={data.active_hotspots > 0 ? "severe" : "muted"}
          sub={data.active_hotspots > 0 ? "Immediate action" : "All clear"}
        />
        <StatCell
          label="Severe Nodes"
          value={data.severe_nodes}
          color={data.severe_nodes > 0 ? "severe" : "muted"}
        />
        <StatCell
          label="Sensitive Zones"
          value={data.sensitive_zone_count}
          color={data.sensitive_zone_count > 0 ? "poor" : "muted"}
          sub="At risk"
        />
        <StatCell
          label="Escalations"
          value={data.escalation_required_count}
          color={data.escalation_required_count > 0 ? "severe" : "muted"}
        />
        <StatCell
          label="Open Tickets"
          value={data.open_tickets}
          color="moderate"
        />
        <StatCell
          label="Resolved"
          value={data.resolved_tickets}
          color="good"
        />
        <StatCell
          label="Total Tickets"
          value={data.total_tickets}
          color="muted"
        />
        {/* Custom Stat Cell for Text */}
        <div 
          className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-white/5"
          style={{ background: "var(--wp-bg-panel)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="wp-label truncate">Top Source</span>
          </div>
          <div>
            <span
              className="text-sm font-semibold capitalize tracking-tight"
              style={{ color: "var(--wp-text-primary)" }}
            >
              {formatSource(data.top_source)}
            </span>
            <p className="wp-caption mt-1">Dominant signal</p>
          </div>
        </div>
      </div>

      {/* Node action cards */}
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 bg-zinc-950/20">
        {data.top_priority_node && (
          <NodeActionCard
            tag="Top priority node"
            tagColor="var(--wp-severe)"
            accentColor="var(--wp-severe)"
            node={data.top_priority_node}
            onClick={() => onSelectNode(data.top_priority_node!.node_id)}
            metaRows={[
              { label: "Score", value: `${data.top_priority_node.priority_score}` },
              { label: "Source", value: formatSource(data.top_priority_node.likely_source) },
              { label: "Recurrence", value: `${data.top_priority_node.recurrence_count}×` },
              { label: "Zone", value: data.top_priority_node.sensitive_zone ? (data.top_priority_node.sensitive_zone_type ?? "Sensitive") : "Standard" },
            ]}
          />
        )}

        {data.highest_risk_node && (
          <NodeActionCard
            tag="Highest PM2.5"
            tagColor="var(--wp-poor)"
            accentColor="var(--wp-poor)"
            node={data.highest_risk_node}
            onClick={() => onSelectNode(data.highest_risk_node!.node_id)}
            metaRows={[
              { label: "PM2.5", value: `${data.highest_risk_node.pm25}` },
              { label: "PM10", value: `${data.highest_risk_node.pm10}` },
              { label: "Severity", value: data.highest_risk_node.severity },
              { label: "Source", value: formatSource(data.highest_risk_node.likely_source) },
            ]}
          />
        )}
      </div>
    </div>
  );
}