"use client";

import Link from "next/link";
import WardPulseLogo from "./WardPulseLogo";

type DashboardHeaderProps = {
  simulationActive?: boolean;
  simulationBusy?: boolean;
  simulationError?: string | null;
  onToggleSimulation?: () => void;
};

export default function DashboardHeader({
  simulationActive = false,
  simulationBusy = false,
  simulationError,
  onToggleSimulation,
}: DashboardHeaderProps) {
  return (
    <header className="relative z-50 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 px-6 py-4 backdrop-blur-xl shadow-2xl overflow-hidden">
      
      {/* Subtle background ceiling light sweep */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-80" />
      
      {/* Glowing bottom edge */}
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* ── LEFT: BRAND & CONTEXT ── */}
      <div className="flex items-center gap-5 relative z-10">
        
        {/* Ultra-Premium Hardware Logo Wrapper (Scaled up to h-14 w-14) */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_4px_10px_rgba(0,0,0,0.5)]">
          {/* Recessed well */}
          <div className="absolute inset-[3.5px] rounded-lg bg-zinc-950 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]" />
          
          {/* The actual SVG Logo (Scaled up to w-10 h-10) */}
          <WardPulseLogo className="w-10 h-10 relative z-10" />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            {/* Title text bumped to 18px */}
            <span className="text-[18px] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 drop-shadow-sm">
              WardPulse
            </span>
            <span className="text-zinc-700 font-light">/</span>
            {/* Subtitle bumped to 14px */}
            <span className="text-[14px] font-semibold tracking-wide text-zinc-300">
              Command Center
            </span>
            <span className="ml-1 flex items-center gap-1.5 rounded-md border border-zinc-700/50 bg-zinc-900/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400 shadow-inner backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
              Ward 42 · Okhla
            </span>
          </div>
          <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Hyperlocal Pollution Attribution & Mitigation Copilot
          </p>
        </div>
      </div>

      {/* ── RIGHT: STATUS & ACTIONS ── */}
      <div className="flex items-center gap-6 relative z-10">
        
       

        <div className="h-10 w-px bg-gradient-to-b from-transparent via-zinc-700/60 to-transparent" />

        {onToggleSimulation && (
          <button
            type="button"
            onClick={onToggleSimulation}
            disabled={simulationBusy}
            className="group relative overflow-hidden rounded-lg border px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: simulationActive
                ? "linear-gradient(180deg, rgba(226,75,74,0.18), rgba(226,75,74,0.08))"
                : "linear-gradient(180deg, rgba(29,158,117,0.16), rgba(29,158,117,0.06))",
              borderColor: simulationActive
                ? "var(--wp-severe-border)"
                : "var(--wp-good-border)",
              color: simulationActive ? "var(--wp-severe)" : "var(--wp-good)",
            }}
            aria-pressed={simulationActive}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative z-10 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: simulationActive
                    ? "var(--wp-severe)"
                    : "var(--wp-good)",
                  boxShadow: simulationActive
                    ? "0 0 8px rgba(226,75,74,0.8)"
                    : "0 0 8px rgba(29,158,117,0.8)",
                }}
              />
              {simulationBusy
                ? "Syncing"
                : simulationActive
                ? "Stop Sim"
                : "Start Sim"}
            </span>
          </button>
        )}

        {simulationError && (
          <span className="max-w-44 truncate font-mono text-[9px] font-bold uppercase tracking-widest text-red-400">
            {simulationError}
          </span>
        )}

        {/* Premium Acrylic Action Button */}
        <Link
          href="/tickets"
          className="group relative overflow-hidden rounded-lg border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-indigo-500/5 px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-indigo-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_0_15px_-3px_rgba(99,102,241,0.2)] transition-all hover:border-indigo-400/50 hover:bg-indigo-500/20 hover:text-white focus:outline-none"
        >
          {/* Shimmer light beam */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          
          <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
            Action Tickets 
            <span className="text-indigo-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
              →
            </span>
          </span>
        </Link>

      </div>
    </header>
  );
}
