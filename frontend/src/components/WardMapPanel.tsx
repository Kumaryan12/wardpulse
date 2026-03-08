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

// Upgraded semantic color palette
const markerColors: Record<string, string> = {
  good: "bg-emerald-500",
  moderate: "bg-amber-400",
  poor: "bg-orange-500",
  severe: "bg-rose-600",
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
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Ward Zone Map</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Live spatial distribution of nodes, hotspots, and severity.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Increased height and made it responsive */}
        <div className="relative h-[450px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          
          {/* Blueprint Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-slate-200/50" />
            ))}
          </div>

          {/* Central Crosshairs */}
          <div className="absolute left-[12%] top-[48%] h-[2px] w-[76%] bg-slate-200" />
          <div className="absolute left-[48%] top-[12%] h-[76%] w-[2px] bg-slate-200" />

          {/* Glassmorphic Zone Labels */}
          <div className="absolute left-4 top-4 rounded-md border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
            Zone Alpha
          </div>
          <div className="absolute right-4 top-4 rounded-md border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
            Zone Bravo
          </div>
          <div className="absolute left-4 bottom-4 rounded-md border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur-sm">
            Zone Charlie
          </div>

          {/* Render Nodes */}
          {positionedNodes.map((node) => {
            const markerColor = markerColors[node.severity] || "bg-slate-500";
            const isSelected = selectedNodeId === node.node_id;

            return (
              <button
                key={node.node_id}
                type="button"
                className="absolute z-10 focus:outline-none"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => onSelectNode(node.node_id)}
              >
                <div className="group relative flex flex-col items-center">
                  
                  {/* Outer pulsing ring for hotspots */}
                  {node.is_hotspot && (
                    <div className="absolute -inset-2 animate-pulse rounded-full bg-rose-400/30" />
                  )}

                  {/* Core Marker */}
                  <div
                    className={`relative h-4 w-4 rounded-full border-2 border-white shadow-md transition-transform ${markerColor} ${
                      isSelected ? "scale-150 ring-4 ring-indigo-500/30" : "group-hover:scale-125"
                    }`}
                  />

                  {/* ID Label */}
                  <div className="mt-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-0">
                    {node.node_id}
                  </div>

                  {/* Premium Hover Tooltip */}
                  <div className="pointer-events-none absolute left-1/2 top-6 z-50 hidden w-64 -translate-x-1/2 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl group-hover:flex">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold tracking-tight text-slate-900 leading-tight">
                        {node.location_name}
                      </p>
                      <Badge variant={node.severity === 'severe' ? 'critical' : node.severity === 'good' ? 'stable' : 'warning'} className="ml-2 capitalize shrink-0">
                        {node.severity}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase text-slate-500">Source</p>
                        <p className="text-xs font-medium capitalize text-slate-900 truncate">
                          {node.likely_source.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-slate-500">Status</p>
                        <p className={`text-xs font-bold ${node.is_hotspot ? 'text-rose-600' : 'text-slate-600'}`}>
                          {node.is_hotspot ? 'Active Hotspot' : 'Monitoring'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Severity Index</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-xs font-medium text-slate-700">Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm" />
                <span className="text-xs font-medium text-slate-700">Mod</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-sm" />
                <span className="text-xs font-medium text-slate-700">Poor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shadow-sm" />
                <span className="text-xs font-medium text-slate-700">Severe</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}