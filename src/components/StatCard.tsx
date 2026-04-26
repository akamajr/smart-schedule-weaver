import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "primary" | "success" | "warning" | "info";
};

const accents = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export const StatCard = ({ title, value, icon: Icon, trend, accent = "primary" }: Props) => (
  <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</p>
        {trend && <p className="mt-1 text-xs text-success">{trend}</p>}
      </div>
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-smooth group-hover:scale-110", accents[accent])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);
