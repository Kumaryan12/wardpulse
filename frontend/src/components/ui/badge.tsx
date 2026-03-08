import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "critical" | "warning" | "stable" | "neutral" | "default"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-900 text-slate-50",
    critical: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    stable: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    neutral: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }