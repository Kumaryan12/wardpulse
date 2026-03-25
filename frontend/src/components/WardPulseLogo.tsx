export default function WardPulseLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          {/* Neon gradient for the pulse line */}
          <linearGradient id="pulse-gradient" x1="12" y1="32" x2="52" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* ── OUTER RADAR RING (Rotating) ── */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="#4f46e5"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          className="origin-center animate-[spin_12s_linear_infinite] opacity-40"
        />

        {/* ── INNER TACTICAL RING ── */}
        <circle 
          cx="32" 
          cy="32" 
          r="18" 
          stroke="#3730a3" 
          strokeWidth="1" 
          opacity="0.6" 
        />
        
        {/* Horizontal Meridian Line */}
        <line x1="8" y1="32" x2="56" y2="32" stroke="#3730a3" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />

        {/* ── THE "W" PULSE WAVEFORM ── */}
        {/* Shadow/Glow layer */}
        <path
          d="M10 32 L 20 44 L 32 16 L 44 44 L 54 32"
          stroke="url(#pulse-gradient)"
          strokeWidth="6"
          strokeLinejoin="bevel"
          className="opacity-40 blur-[4px]"
        />
        {/* Crisp core line */}
        <path
          d="M10 32 L 20 44 L 32 16 L 44 44 L 54 32"
          stroke="url(#pulse-gradient)"
          strokeWidth="2.5"
          strokeLinejoin="bevel"
        />

        {/* ── THE EMERALD ANOMALY CORE (At the peak of the 'W') ── */}
        <circle
          cx="32"
          cy="16"
          r="3.5"
          className="fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,1)]"
        />
        {/* Ping animation on the core */}
        <circle
          cx="32"
          cy="16"
          r="3.5"
          className="fill-emerald-400 animate-ping opacity-60 origin-center"
          style={{ animationDuration: '2s' }}
        />
      </svg>
    </div>
  );
}