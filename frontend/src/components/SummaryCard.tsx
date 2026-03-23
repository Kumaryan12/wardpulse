type SummaryCardProps = {
  title: string;
  value: string | number;
  trend?: string;
  status?: "critical" | "warning" | "stable" | "neutral" | "default";
};

const statusColor: Record<string, string> = {
  critical: "var(--wp-severe)",
  warning:  "var(--wp-poor)",
  stable:   "var(--wp-good)",
  neutral:  "var(--wp-text-muted)",
  default:  "var(--wp-text-muted)",
};

const statusDim: Record<string, string> = {
  critical: "var(--wp-severe-dim)",
  warning:  "var(--wp-poor-dim)",
  stable:   "var(--wp-good-dim)",
  neutral:  "var(--wp-bg-overlay)",
  default:  "var(--wp-bg-overlay)",
};

const statusBorder: Record<string, string> = {
  critical: "var(--wp-severe-border)",
  warning:  "var(--wp-poor-border)",
  stable:   "var(--wp-good-border)",
  neutral:  "var(--wp-border-hover)",
  default:  "var(--wp-border-hover)",
};

export default function SummaryCard({ title, value, trend, status }: SummaryCardProps) {
  const color  = status ? statusColor[status]  : "var(--wp-text-muted)";
  const dim    = status ? statusDim[status]    : "transparent";
  const border = status ? statusBorder[status] : "transparent";

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
        /* The Glass Lip & Heavy Shadow */
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 30px -10px rgba(0,0,0,0.5)",
      }}
    >
      {/* Faint Perforated Metal/Dot Grid Background */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: 'radial-gradient(var(--wp-border-hover) 1px, transparent 1px)', 
          backgroundSize: '12px 12px' 
        }} 
      />

      {/* Premium Radial Hover Glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{ 
          background: `radial-gradient(circle at top right, ${dim}, transparent 75%)` 
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <span 
            className="font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "var(--wp-text-muted)" }}
          >
            {title}
          </span>
          {status && (
            <span
              className="flex items-center gap-1.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md"
              style={{ background: dim, color, border: `1px solid ${border}` }}
            >
              {/* Pulsing LED for Critical, Static LED for others (except neutral) */}
              {status === "critical" && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: color }}></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }}></span>
                </span>
              )}
              {(status === "warning" || status === "stable") && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
              )}
              
              {status}
            </span>
          )}
        </div>

        <div className="mt-1">
          <div 
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--wp-text-primary)" }}
          >
            {value}
          </div>
          {trend && (
            <p 
              className="mt-2 font-mono text-[9px] font-bold uppercase tracking-widest"
              style={{ color: status === "critical" ? color : "var(--wp-text-secondary)" }}
            >
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}