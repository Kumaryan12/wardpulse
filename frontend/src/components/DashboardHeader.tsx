import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
      {/* Left Side: Branding & Context */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            WardPulse
          </h1>
          <span className="text-slate-300">/</span>
          <span className="text-lg font-medium text-slate-600">
            Command Center
          </span>
          {/* Mock Ward Selector - Shows judges the tool scales */}
          <span className="ml-1 hidden rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 md:inline-block">
            Ward 42 (Okhla)
          </span>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Hyperlocal Pollution Attribution & Mitigation Copilot
        </p>
      </div>

      {/* Right Side: Status & Navigation */}
      <div className="flex flex-col items-start gap-4 md:items-end">
        {/* Live Pulse Indicator (Hackathon Demo Magic) */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Live Monitoring Active
          </span>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          
          <Link
            href="/tickets"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-sm"
          >
            Action Tickets
          </Link>
        </div>
      </div>
    </header>
  );
}