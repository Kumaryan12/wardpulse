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
      className="group relative flex flex-col justify-between gap-2 p-4 transition-all duration-300 hover:bg-white/[0.02]"
      style={{ background: "var(--wp-bg-panel)" }}
    >
      {/* Subtle LED Bottom Glow on Hover */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)` }}
      />

      <div className="flex items-center gap-2">
        {color !== "muted" && (
          <span 
            className="h-1.5 w-1.5 rounded-full" 
            style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}80` }} 
          />
        )}
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 truncate">
          {label}
        </span>
      </div>
      
      <div>
        <span
          className="font-mono text-2xl font-bold tracking-tight"
          style={{ color: color === "muted" ? "var(--wp-text-primary)" : activeColor }}
        >
          {value}
        </span>
        {sub && <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-zinc-600">{sub}</p>}
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
      className="group relative flex w-full flex-col gap-0 overflow-hidden rounded-xl text-left transition-all duration-300 hover:-translate-y-1 focus:outline-none"
      style={{
        background: "var(--wp-bg-panel)",
        border: `1px solid var(--wp-border)`,
        boxShadow: "0 8px 30px -10px rgba(0,0,0,0.6)",
      }}
    >
      {/* Dossier Blueprint Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dossier-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dossier-grid)" />
      </svg>

      {/* Premium Radial Hover Glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}15, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col gap-5 p-5">
        {/* Tag & Status Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: accentColor }}></span>
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accentColor }}></span>
              </span>
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {tag}
              </span>
            </div>
            
            <p className="mt-1 text-base font-bold tracking-wide text-zinc-100 transition-colors">
              {node.location_name}
            </p>
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800 self-start px-1.5 py-0.5 rounded shadow-sm">
              {node.node_id}
            </p>
          </div>

          {node.escalation_required && (
            <span
              className="shrink-0 rounded bg-red-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse"
            >
              Escalation Req
            </span>
          )}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-3 backdrop-blur-sm">
          {metaRows.map((m, idx) => (
            <div key={m.label} className={`${idx !== 0 ? 'sm:border-l border-zinc-800/50 sm:pl-4' : ''}`}>
              <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{m.label}</p>
              <p
                className={`text-xs font-semibold capitalize truncate ${m.label === 'Score' || m.label === 'PM2.5' || m.label === 'PM10' ? 'font-mono text-[13px]' : ''}`}
                style={{ color: m.highlight ? accentColor : "var(--wp-text-primary)" }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Segmented LCD Priority Bar */}
        <div className="mt-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500">Threat Index</span>
            <span className="font-mono text-[10px] font-bold" style={{ color: accentColor }}>
              {node.priority_score}<span className="text-zinc-600">/100</span>
            </span>
          </div>
          <div className="flex h-1.5 w-full gap-[2px]">
            {Array.from({ length: 20 }).map((_, i) => {
              const isActive = (i / 20) * 100 < node.priority_score;
              return (
                <div
                  key={i}
                  className="h-full flex-1 rounded-sm transition-colors duration-500"
                  style={{
                    background: isActive ? accentColor : "var(--wp-bg-overlay)",
                    opacity: isActive ? 1 : 0.3,
                    boxShadow: isActive ? `0 0 4px ${accentColor}80` : "none"
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SituationRoomPanel({ data, onSelectNode }: SituationRoomPanelProps) {
  const isEmergency = data.active_hotspots > 0;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl shadow-2xl relative"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
      }}
    >
      {/* Subtle Top Edge Glow */}
      <div 
        className="absolute inset-x-0 top-0 h-[1px] w-full opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, ${isEmergency ? 'var(--wp-severe)' : 'var(--wp-moderate)'}, transparent)` }}
      />

      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/60 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--wp-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isEmergency ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isEmergency ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-100">
            Tactical Situation Room
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded shadow-inner">
            Real-Time
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded shadow-inner">
            Ward 42
          </span>
        </div>
      </div>

      {/* Stat strip - Uses grid gap to create perfect 1px inner borders */}
      <div 
        className="grid grid-cols-2 gap-px md:grid-cols-4 lg:grid-cols-8 relative z-10"
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
          className="group relative flex flex-col justify-between gap-2 p-4 transition-all duration-300 hover:bg-white/[0.02]"
          style={{ background: "var(--wp-bg-panel)" }}
        >
          <div className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, var(--wp-poor), transparent)` }} />
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 truncate">Top Signal</span>
          </div>
          <div>
            <span
              className="text-[13px] font-bold capitalize tracking-wide text-zinc-100"
            >
              {formatSource(data.top_source)}
            </span>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-zinc-600">Dominant Source</p>
          </div>
        </div>
      </div>

      {/* Node action cards */}
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 relative z-10" style={{ background: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')" }}>
        {/* Faint dotted background pattern for the dossier area */}
        
        {data.top_priority_node && (
          <NodeActionCard
            tag="Priority Alpha"
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
            tag="Critical PM2.5 Anomaly"
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