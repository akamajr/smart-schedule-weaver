"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, X, Wand2, Pencil, Lightbulb, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/StatCard";
import { useGlobalConflicts } from "@/hooks/useGlobalConflicts";
import { GlobalConflict } from "@/lib/conflicts";

const Conflicts = () => {
  const { conflicts: items, isLoading, error, dismissConflict } = useGlobalConflicts();

  const dismiss = (id: string) => {
    dismissConflict(id);
    toast.success("Conflict dismissed");
  };
  const accept = (id: string) => {
    dismissConflict(id);
    toast.success("Recommendation applied");
  };

  const critical = items.filter((c) => c.severity === "critical").length;
  const medium = items.filter((c) => c.severity === "medium").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">AI Conflict Resolution Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review and resolve scheduling optimization errors.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Hard Conflicts" value={critical} icon={AlertCircle} accent="primary" trend="Critical" />
        <StatCard title="Medium Conflicts" value={medium} icon={AlertTriangle} accent="warning" trend="Medium" />
        <div className="relative overflow-hidden rounded-2xl gradient-deep p-5 text-primary-foreground shadow-glow">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Real-Time</span>
          </div>
          <p className="mt-6 font-display text-4xl font-bold">98%</p>
          <p className="mt-1 text-sm text-white/85">System Status: Optimized</p>
          <ShieldCheck className="pointer-events-none absolute -right-4 -bottom-4 h-32 w-32 text-white/10" strokeWidth={1} />
        </div>
      </div>

      {/* Live update header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Active Conflict Decision Feed</h2>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Live update
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {items.map((c) => <ConflictCard key={c.id} c={c} onDismiss={dismiss} onAccept={accept} />)}
        </div>
      )}

      {/* Smart Tip */}
      <div className="rounded-3xl border border-primary/20 bg-primary-soft/60 p-5 shadow-card">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Smart Tip</p>
              <p className="mt-1 max-w-2xl text-sm font-medium text-foreground">
                Our AI suggests moving CS301 to the Main Library Annex (Room B). It has the same seating
                capacity and is currently free during that time slot.
              </p>
            </div>
          </div>
          <Button className="rounded-2xl gradient-deep text-primary-foreground shadow-glow" onClick={() => toast.success("Quick Apply executed")}>
            Quick Apply
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Last synced: Today, 11:42 AM • Conflict engine version 2.4.1
      </p>
    </div>
  );
};

const ConflictCard = ({
  c, onDismiss, onAccept,
}: { c: GlobalConflict; onDismiss: (id: string) => void; onAccept: (id: string) => void }) => {
  const isCritical = c.severity === "critical";
  return (
    <div className={cn(
      "overflow-hidden rounded-3xl border bg-card shadow-card",
      isCritical ? "border-destructive/20" : "border-warning/20"
    )}>
      <div className={cn("flex border-l-4", isCritical ? "border-destructive" : "border-warning")}>
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              isCritical ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
            )}>
              {c.category}
            </span>
            <span className="text-xs text-muted-foreground">Detected {c.detectedAgo}</span>
          </div>

          <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">{c.title}</h3>

          <div className="mt-4 rounded-2xl border-l-4 border-primary/40 bg-primary-soft/50 p-4">
            <p className="text-sm italic leading-relaxed text-muted-foreground">"{c.description}"</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button className="rounded-xl bg-success text-success-foreground hover:bg-success/90" onClick={() => onAccept(c.id)}>
              <Wand2 className="mr-2 h-4 w-4" /> System Recommendation
            </Button>
            <Button variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary-soft" onClick={() => toast.info("Open editor")}>
              <Pencil className="mr-2 h-4 w-4" /> Manual Edit
            </Button>
            <Button variant="ghost" className="rounded-xl text-muted-foreground hover:bg-secondary" onClick={() => onDismiss(c.id)}>
              Ignore Warning
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-end p-5">
          <button
            onClick={() => onDismiss(c.id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-smooth",
              isCritical ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-warning/15 text-warning hover:bg-warning/25"
            )}
          >
            {isCritical ? <X className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card py-16 text-center shadow-card">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
      <ShieldCheck className="h-6 w-6" />
    </div>
    <p className="font-display text-lg font-semibold">All clear!</p>
    <p className="text-sm text-muted-foreground">No active conflicts in the queue.</p>
  </div>
);

export default Conflicts;

