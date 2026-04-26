import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { conflicts as seed, Conflict } from "@/lib/mockData";
import { AlertTriangle, Users, DoorOpen, BookOpen, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeMap = {
  lecturer: { icon: Users, label: "Lecturer Conflict", color: "destructive" as const },
  room: { icon: DoorOpen, label: "Room Conflict", color: "warning" as const },
  course: { icon: BookOpen, label: "Course Overlap", color: "info" as const },
};

const colorClasses = {
  destructive: { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/20" },
  warning: { bg: "bg-warning/10", text: "text-warning", ring: "ring-warning/20" },
  info: { bg: "bg-info/10", text: "text-info", ring: "ring-info/20" },
};

const Conflicts = () => {
  const [items, setItems] = useState<Conflict[]>(seed);
  const [filter, setFilter] = useState<"all" | "lecturer" | "room" | "course">("all");

  const visible = filter === "all" ? items : items.filter((c) => c.type === filter);

  const resolve = (id: string) => {
    setItems((p) => p.filter((c) => c.id !== id));
    toast.success("Conflict resolved");
  };
  const ignore = (id: string) => {
    setItems((p) => p.filter((c) => c.id !== id));
    toast.info("Conflict ignored");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflict Management"
        description="Review and resolve scheduling conflicts in one place."
      />

      <div className="flex flex-wrap gap-2">
        {[
          { k: "all", label: "All", count: items.length },
          { k: "lecturer", label: "Lecturer", count: items.filter((c) => c.type === "lecturer").length },
          { k: "room", label: "Room", count: items.filter((c) => c.type === "room").length },
          { k: "course", label: "Course", count: items.filter((c) => c.type === "course").length },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k as any)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-smooth",
              filter === t.k
                ? "border-primary bg-primary text-primary-foreground shadow-glow"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            {t.label} <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <Check className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-semibold">All clear!</p>
          <p className="text-sm text-muted-foreground">No conflicts in this category.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((c) => {
            const meta = typeMap[c.type];
            const Icon = meta.icon;
            const cc = colorClasses[meta.color];
            return (
              <div
                key={c.id}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-smooth hover:shadow-elegant md:flex-row md:items-center",
                  "ring-1", cc.ring
                )}
              >
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", cc.bg, cc.text)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", cc.bg, cc.text)}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.day} · {c.time}</span>
                  </div>
                  <p className="mt-1 font-semibold">{c.description}</p>
                  <p className="text-sm text-muted-foreground">{c.details}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => ignore(c.id)}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Ignore
                  </Button>
                  <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => resolve(c.id)}>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Resolve
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Conflicts;
