"use client";

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
};

const markerColors: Record<string, string> = {
  good: "bg-green-500",
  moderate: "bg-yellow-500",
  poor: "bg-orange-500",
  severe: "bg-red-600",
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

export default function WardMapPanel({ nodes }: WardMapPanelProps) {
  const positionedNodes = normalizeNodes(nodes);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Ward Zone View</h2>
        <p className="mt-1 text-sm text-gray-600">
          Live hyperlocal node map with hotspot and severity indicators
        </p>
      </div>

      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-slate-200/70" />
          ))}
        </div>

        {/* Zone labels */}
        <div className="absolute left-3 top-3 rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow">
          Zone A
        </div>
        <div className="absolute right-3 top-3 rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow">
          Zone B
        </div>
        <div className="absolute left-3 bottom-3 rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow">
          Zone C
        </div>
        <div className="absolute right-3 bottom-3 rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow">
          Zone D
        </div>

        {/* Road strokes / ward paths */}
        <div className="absolute left-[12%] top-[48%] h-[3px] w-[76%] bg-slate-300" />
        <div className="absolute left-[48%] top-[12%] h-[76%] w-[3px] bg-slate-300" />

        {/* Node markers */}
        {positionedNodes.map((node) => {
          const markerColor = markerColors[node.severity] || "bg-gray-500";

          return (
            <div
              key={node.node_id}
              className="absolute"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="group relative flex flex-col items-center">
                <div
                  className={`relative h-5 w-5 rounded-full border-2 border-white shadow-lg ${markerColor} ${
                    node.is_hotspot ? "ring-4 ring-red-200" : ""
                  }`}
                />

                <div className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow">
                  {node.node_id}
                </div>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-1/2 top-10 z-20 hidden w-56 -translate-x-1/2 rounded-xl border bg-white p-3 text-xs shadow-xl group-hover:block">
                  <p className="font-semibold text-gray-900">{node.location_name}</p>
                  <p className="mt-1 text-gray-600">Severity: {node.severity}</p>
                  <p className="text-gray-600">
                    Source: {node.likely_source.replaceAll("_", " ")}
                  </p>
                  {node.is_hotspot && (
                    <p className="mt-1 font-semibold text-red-600">Active Hotspot</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-700">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-gray-700">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-gray-700">Poor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-gray-700">Severe</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600 ring-2 ring-red-200" />
          <span className="text-gray-700">Hotspot</span>
        </div>
      </div>
    </div>
  );
}