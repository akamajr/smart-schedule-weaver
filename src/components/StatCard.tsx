import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendIcon?: LucideIcon;
  trendTone?: "positive" | "warning" | "neutral";
  accent?: "primary" | "success" | "warning" | "info" | "violet" | "indigo";
  variant?: "default" | "filled";
};

const accents: Record<NonNullable<Props["accent"]>, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  violet: "bg-[hsl(270_100%_96%)] text-[hsl(270_75%_55%)]",
  indigo: "bg-primary-soft text-primary",
};

export const StatCard = ({
  title, value, icon: Icon, trend, trendIcon: TrendIcon, trendTone = "positive",
  accent = "primary", variant = "default",
}: Props) => {
  if (variant === "filled") {
    return (
      <div className="relative overflow-hidden rounded-2xl gradient-deep p-5 text-primary-foreground shadow-glow">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{trend}</span>
        </div>
        <p className="mt-6 font-display text-4xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-white/80">{title}</p>
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>
    );
  }

  const trendColor =
    trendTone === "warning" ? "text-destructive" :
    trendTone === "neutral" ? "text-muted-foreground" : "text-success";

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-smooth group-hover:scale-110", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && !TrendIcon && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{trend}</span>
        )}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-3xl font-bold tracking-tight">{value}</p>
      {trend && TrendIcon && (
        <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3 w-3" /> {trend}
        </p>
      )}
    </div>
  );
};
