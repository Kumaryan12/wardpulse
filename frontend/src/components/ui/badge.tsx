import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "critical" | "warning" | "stable" | "neutral" | "default";
}

const variantStyles: Record<string, React.CSSProperties> = {
  default:  { background: "var(--wp-bg-overlay)",   color: "var(--wp-text-secondary)", border: "0.5px solid var(--wp-border-hover)" },
  critical: { background: "var(--wp-severe-dim)",   color: "var(--wp-severe)",         border: "0.5px solid var(--wp-severe-border)" },
  warning:  { background: "var(--wp-poor-dim)",     color: "var(--wp-poor)",           border: "0.5px solid var(--wp-poor-border)" },
  stable:   { background: "var(--wp-good-dim)",     color: "var(--wp-good)",           border: "0.5px solid var(--wp-good-border)" },
  neutral:  { background: "var(--wp-bg-overlay)",   color: "var(--wp-text-muted)",     border: "0.5px solid var(--wp-border)" },
};

function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest transition-colors",
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}

export { Badge };