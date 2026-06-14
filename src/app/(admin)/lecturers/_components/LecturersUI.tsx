"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Search, Users, AlertTriangle, ClipboardList,
  Filter, Download, DoorOpen, AlertCircle, Sparkles, Mail, History as HistoryIcon, RefreshCw,
} from "lucide-react";
import { lecturers as seed, Lecturer } from "@/lib/mockData";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";

const Lecturers = () => {
  const [items, setItems] = useState<Lecturer[]>(seed);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", title: "Lecturer", email: "", department: "Computer Science" });

  const filtered = items.filter((l) => `${l.name} ${l.email} ${l.department}`.toLowerCase().includes(q.toLowerCase()));

  const add = () => {
    if (!form.name || !form.email) return toast.error("Please fill all fields");
    setItems((p) => [{
      id: `l${Date.now()}`,
      name: form.name, title: form.title, email: form.email, department: form.department,
      status: "online", available: true, courses: [], preferredRoom: "Hall A",
      constraints: ["Mon-Fri"], avatarSeed: form.name,
    }, ...p]);
    toast.success("Lecturer added");
    setOpen(false);
    setForm({ name: "", title: "Lecturer", email: "", department: "Computer Science" });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <span className="font-display text-lg font-bold text-primary hidden md:block">Scholarly AI</span>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search faculty..."
              className="h-11 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="rounded-xl text-primary hover:bg-primary-soft" onClick={() => toast.info("Faculty import")}>
            Import Faculty
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl gradient-deep px-5 text-primary-foreground shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Add New Lecturer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Add Lecturer</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1.5 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Title</Label>
                    <Input className="mt-1.5 rounded-xl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input className="mt-1.5 rounded-xl" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1.5 rounded-xl" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="j.doe@scholarly.edu" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={add}>
                  Add lecturer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Lecturer Management Hub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review faculty profiles and availability constraints.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Lecturers" value={items.length} icon={Users} accent="primary" trend="Overview" />
        <StatCard title="Availability Conflicts" value={items.filter((l) => l.hasOverlap).length} icon={AlertTriangle} accent="warning" trend="Action Required" trendTone="warning" />
        <StatCard title="Pending Constraints" value={5} icon={ClipboardList} accent="info" trend="Workflow" />
      </div>

      {/* Faculty masonry */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Faculty Directory</h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><Filter className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No lecturers match your search.
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
          {filtered.map((l, i) => {
            const tall = i % 5 === 0 || l.hasOverlap;
            return (
              <article
                key={l.id}
                className={cn(
                  "group break-inside-avoid rounded-3xl border p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant",
                  l.hasOverlap ? "border-warning/40 bg-warning-soft/40" : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <InitialsAvatar seed={l.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold leading-tight">{l.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{l.title}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {l.department}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    <DoorOpen className="h-3 w-3" /> {l.preferredRoom}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {l.constraints.map((c, idx) => (
                    <span key={idx} className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>

                {l.courses.length > 0 && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Teaches: <span className="font-medium text-foreground">{l.courses.join(", ")}</span>
                  </p>
                )}

                {tall && l.hasOverlap && (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive">
                    <AlertCircle className="h-3 w-3" /> Overlap detected — review schedule
                  </p>
                )}

                <div className="mt-4 flex items-center justify-end opacity-60 transition-smooth group-hover:opacity-100">
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary hover:bg-primary-soft" onClick={() => toast.info("Edit lecturer")}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* AI recommendation + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-soft via-card to-primary-soft/40 p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">AI Smart Recommendation</p>
          <h3 className="mt-2 font-display text-2xl font-bold">Optimize Humanities Allocation</h3>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Based on historical student density and Prof. Michael Chen's recent sabbaticals, the AI suggests
            re-allocating <span className="font-semibold text-foreground">Room 402</span> to History modules for the next semester
            to reduce travel time for elderly faculty.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Button className="rounded-2xl gradient-deep text-primary-foreground shadow-glow" onClick={() => toast.success("Reviewing proposal…")}>
              Review Proposal
            </Button>
            <button className="text-sm font-semibold text-muted-foreground hover:text-foreground">Dismiss</button>
          </div>
          <Sparkles className="pointer-events-none absolute right-6 top-6 h-20 w-20 text-primary/15" strokeWidth={1} />
          <Sparkles className="pointer-events-none absolute right-24 bottom-4 h-10 w-10 text-primary/20" strokeWidth={1} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Quick Actions</h3>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: "Email Faculty Reminders", icon: Mail },
              { label: "Audit Availability Changes", icon: HistoryIcon },
              { label: "Sync with HR Database", icon: RefreshCw },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => toast.success(label)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-sm font-medium transition-smooth hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Lecturer["status"] }) => {
  const map = {
    online: { label: "Online", cls: "bg-success-soft text-success", dot: "bg-success" },
    busy: { label: "Busy", cls: "bg-warning-soft text-warning", dot: "bg-warning" },
    sabbatical: { label: "Sabbatical", cls: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};

export default Lecturers;

