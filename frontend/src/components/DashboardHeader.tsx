import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3" style={{ background: "var(--wp-bg-panel)", borderColor: "var(--wp-border)" }}>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="block h-2 w-2 rounded-full" style={{ background: "var(--wp-severe)", boxShadow: "0 0 8px var(--wp-severe)" }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--wp-text-primary)" }}>WardPulse</span>
            <span style={{ color: "var(--wp-text-ghost)" }}>/</span>
            <span className="text-sm" style={{ color: "var(--wp-text-secondary)" }}>Command Center</span>
            <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--wp-bg-overlay)", color: "var(--wp-text-muted)", border: "0.5px solid var(--wp-border-hover)" }}>
              Ward 42 · Okhla
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--wp-text-muted)" }}>
            Hyperlocal Pollution Attribution & Mitigation Copilot
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="wp-live-dot" />
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--wp-good)" }}>
            Live Monitoring
          </span>
        </div>

        <div className="h-4 w-px" style={{ background: "var(--wp-border)" }} />

        <Link
          href="/tickets"
          className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--wp-moderate-dim)", color: "var(--wp-moderate)", border: "0.5px solid var(--wp-moderate-border)" }}
        >
          Action Tickets
        </Link>
      </div>
    </header>
  );
}