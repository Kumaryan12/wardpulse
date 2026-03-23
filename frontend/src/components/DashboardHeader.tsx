import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="relative z-50 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
      
      {/* Subtle bottom edge glow */}
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* ── LEFT: BRAND & CONTEXT ── */}
      <div className="flex items-center gap-4">
        
        {/* Animated Sensor Logo */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 shadow-inner">
          <span className="absolute h-3 w-3 animate-ping rounded-full bg-indigo-500 opacity-40 duration-1000"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-wide text-zinc-100">WardPulse</span>
            <span className="text-zinc-700">/</span>
            <span className="text-[14px] font-medium text-zinc-400">Command Center</span>
            <span className="ml-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500 shadow-inner">
              Ward 42 · Okhla
            </span>
          </div>
          <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            Hyperlocal Pollution Attribution & Mitigation Copilot
          </p>
        </div>
      </div>

      {/* ── RIGHT: STATUS & ACTIONS ── */}
      <div className="flex items-center gap-6">
        
        

        <div className="h-5 w-px bg-zinc-800" />

        {/* Action Button with Shimmer Hover */}
        <Link
          href="/tickets"
          className="group relative overflow-hidden rounded border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400 shadow-sm transition-all hover:bg-indigo-500/20 hover:text-indigo-300 focus:outline-none"
        >
          {/* Shimmer light beam */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          
          <span className="relative z-10 flex items-center gap-2">
            Action Tickets 
            <span className="text-indigo-500 transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>

      </div>
    </header>
  );
}