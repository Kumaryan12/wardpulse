"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NodeMapData = {
  node_id: string;
  location_name: string;
  ward_id: string;
  latitude?: number;
  longitude?: number;
  severity: string;
  is_hotspot: boolean;
  likely_source: string;
};

type WardMapPanelProps = {
  nodes: NodeMapData[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId?: string | null;
};

// High-contrast semantic palette for dark mode
const markerColors: Record<string, string> = {
  good: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  moderate: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  poor: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
  severe: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
};

function normalizeNodes(nodes: NodeMapData[]) {
  const validNodes = nodes.filter(
    (n) => typeof n.latitude === "number" && typeof n.longitude === "number"
  );

  if (validNodes.length === 0) return [];

  const minLat = Math.min(...validNodes.map((n) => n.latitude as number));
  const maxLat = Math.max(...validNodes.map((n) => n.latitude as number));
  const minLng = Math.min(...validNodes.map((n) => n.longitude as number));
  const maxLng = Math.max(...validNodes.map((n) => n.longitude as number));

  return validNodes.map((node) => {
    const lat = node.latitude as number;
    const lng = node.longitude as number;

    const x =
      maxLng === minLng ? 50 : ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    const y =
      maxLat === minLat ? 50 : 90 - ((lat - minLat) / (maxLat - minLat)) * 80;

    return {
      ...node,
      x,
      y,
    };
  });
}

export default function WardMapPanel({
  nodes,
  onSelectNode,
  selectedNodeId,
}: WardMapPanelProps) {
  const positionedNodes = normalizeNodes(nodes);

  return (
    <Card 
      className="flex h-full flex-col relative overflow-hidden transition-all duration-300"
      style={{
        /* The Glass Lip: 1px inner white highlight at the top */
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      <CardHeader className="pb-4 border-b border-zinc-800/60 bg-zinc-900/40 relative z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <CardTitle className="text-lg text-zinc-100 uppercase tracking-wide text-[13px]">Live Radar</CardTitle>
            </div>
            <p className="text-xs text-zinc-500">
              Spatial distribution of monitoring nodes and severity zones.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="relative h-[450px] w-full overflow-hidden bg-zinc-950">
          
          {/* Subtle CRT Monitor Center Glow */}
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)" }} 
          />

          {/* ── TRUE POLAR RADAR GRID ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.2 }}>
            {/* Concentric Rings */}
            <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#52525b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#52525b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="50%" fill="none" stroke="#52525b" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Angled Crosshairs */}
            <line x1="15%" y1="15%" x2="85%" y2="85%" stroke="#3f3f46" strokeWidth="1" opacity="0.5" />
            <line x1="15%" y1="85%" x2="85%" y2="15%" stroke="#3f3f46" strokeWidth="1" opacity="0.5" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#3f3f46" strokeWidth="1" opacity="0.8" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3f3f46" strokeWidth="1" opacity="0.8" />
            
            {/* Center Radar Hub */}
            <circle cx="50%" cy="50%" r="3" fill="#52525b" />
            <circle cx="50%" cy="50%" r="8" fill="none" stroke="#52525b" strokeWidth="1" />
          </svg>

          {/* Glassmorphic Zone Labels */}
          <div className="absolute left-4 top-4 rounded-md border border-zinc-800/60 bg-zinc-950/80 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 backdrop-blur-sm z-10">
            Sector A
          </div>
          <div className="absolute right-4 top-4 rounded-md border border-zinc-800/60 bg-zinc-950/80 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 backdrop-blur-sm z-10">
            Sector B
          </div>
          <div className="absolute left-4 bottom-4 rounded-md border border-zinc-800/60 bg-zinc-950/80 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 backdrop-blur-sm z-10">
            Sector C
          </div>

          {/* ── RENDER NODES ── */}
          {positionedNodes.map((node) => {
            const markerColor = markerColors[node.severity] || "bg-zinc-500";
            const isSelected = selectedNodeId === node.node_id;

            return (
              <div
                key={node.node_id}
                className="absolute z-20 group flex flex-col items-center"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* ── FIXED HOTSPOT RING (Perfect Circle, strict dimensions) ── */}
                {node.is_hotspot && (
                  <div 
                    className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-red-500/50 bg-red-500/10 animate-[spin_6s_linear_infinite] pointer-events-none" 
                  />
                )}

                {/* Clickable Core Marker */}
                <button
                  type="button"
                  className="relative z-30 flex h-8 w-8 items-center justify-center focus:outline-none"
                  onClick={() => onSelectNode(node.node_id)}
                >
                  <div
                    className={`h-3 w-3 rounded-full border border-zinc-950 transition-transform duration-300 ${markerColor} ${
                      isSelected ? "scale-150 ring-2 ring-zinc-100 ring-offset-2 ring-offset-zinc-950" : "group-hover:scale-125"
                    }`}
                  />
                </button>

                {/* ID Label (Hides on hover) */}
                <div className="absolute top-8 mt-1 rounded border border-zinc-800 bg-zinc-900/90 px-1 py-0.5 text-[9px] font-mono text-zinc-300 backdrop-blur-sm transition-opacity group-hover:opacity-0 pointer-events-none">
                  {node.node_id}
                </div>

                {/* Premium Dark Mode Tooltip (Shows on hover) */}
                <div className="pointer-events-none absolute left-1/2 top-8 z-50 hidden w-64 -translate-x-1/2 flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-md group-hover:flex animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
                    <p className="font-semibold tracking-tight text-zinc-100 leading-tight">
                      {node.location_name}
                    </p>
                    <Badge variant={node.severity === 'severe' ? 'critical' : node.severity === 'good' ? 'stable' : 'warning'} className="shrink-0 text-[9px] px-1.5 py-0.5">
                      {node.severity}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Source</p>
                      <p className="text-xs font-mono capitalize text-zinc-300 truncate">
                        {node.likely_source.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
                      <p className={`text-xs font-mono font-bold ${node.is_hotspot ? 'text-red-400' : 'text-zinc-400'}`}>
                        {node.is_hotspot ? 'ACTIVE HOTSPOT' : 'MONITORING'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Floating Map Legend - Dark Mode */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/90 p-3 shadow-md backdrop-blur-sm z-30">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Threat Level</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Nominal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Elevated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Severe</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}