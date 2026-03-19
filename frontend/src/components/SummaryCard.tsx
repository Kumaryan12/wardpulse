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
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--wp-bg-panel)",
        border: "1px solid var(--wp-border)",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Premium Linear-style hover glow */}
      <div 
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ 
          background: `radial-gradient(circle at top right, ${dim}, transparent 60%)` 
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <span 
            className="text-[11px] font-medium uppercase tracking-widest"
            style={{ color: "var(--wp-text-muted)" }}
          >
            {title}
          </span>
          {status && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md"
              style={{ background: dim, color, border: `1px solid ${border}` }}
            >
              {status}
            </span>
          )}
        </div>

        <div>
          <div 
            className="font-mono text-3xl font-semibold tracking-tight"
            style={{ color: "var(--wp-text-primary)" }}
          >
            {value}
          </div>
          {trend && (
            <p 
              className="mt-2 text-[11px] font-medium tracking-wide"
              style={{ color: "var(--wp-text-muted)" }}
            >
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}