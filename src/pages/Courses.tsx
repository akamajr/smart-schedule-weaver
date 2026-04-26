import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, Search, BookOpen, Shield, ChevronLeft, ChevronRight,
  Sparkles, ArrowRight,
} from "lucide-react";
import { courses as seed, lecturers, Course } from "@/lib/mockData";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const Courses = () => {
  const [items, setItems] = useState<Course[]>(seed);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ code: "", name: "", lecturerId: "", credits: 3, department: "Computer Science", level: "300", status: "pending" as Course["status"] });

  const departments = useMemo(
    () => Array.from(new Set(items.map((c) => c.department))),
    [items]
  );

  const filtered = useMemo(() => items.filter((c) => {
    const matchesQ = `${c.code} ${c.name}`.toLowerCase().includes(q.toLowerCase());
    const matchesD = dept === "all" || c.department === dept;
    return matchesQ && matchesD;
  }), [items, q, dept]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const view = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setForm({ code: "", name: "", lecturerId: "", credits: 3, department: "Computer Science", level: "300", status: "pending" });
    setEditing(null);
  };

  const submit = () => {
    if (!form.code || !form.name || !form.lecturerId) return toast.error("Fill all required fields");
    if (editing) {
      setItems((p) => p.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)));
      toast.success("Course updated");
    } else {
      setItems((p) => [{ id: `c${Date.now()}`, ...form }, ...p]);
      toast.success("Course added");
    }
    setOpen(false);
    reset();
  };

  const remove = (id: string) => {
    setItems((p) => p.filter((c) => c.id !== id));
    toast.success("Course deleted");
  };

  const startEdit = (c: Course) => {
    setEditing(c);
    setForm({ code: c.code, name: c.name, lecturerId: c.lecturerId, credits: c.credits, department: c.department, level: c.level, status: c.status });
    setOpen(true);
  };

  const totalCredits = items.reduce((s, c) => s + c.credits, 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Course<br className="hidden md:block" /> Optimization Hub
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Manage academic curriculum and constraint data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by Code/Name"
              className="h-11 w-full min-w-[220px] rounded-2xl border-transparent bg-primary-soft/60 pl-10 sm:w-64"
            />
          </div>
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="h-11 w-44 rounded-2xl border-transparent bg-primary-soft/60">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl gradient-deep px-5 text-primary-foreground shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Add New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Course" : "Add New Course"}</DialogTitle>
                <DialogDescription>Fill in the course details below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Course Code</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CS101" className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Credits</Label>
                    <Input type="number" min={1} max={6} step={0.5} value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label>Course Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Intro to Computer Science" className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label>Lecturer</Label>
                  <Select value={form.lecturerId} onValueChange={(v) => setForm({ ...form, lecturerId: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select lecturer" /></SelectTrigger>
                    <SelectContent>
                      {lecturers.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Department</Label>
                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit}>
                  {editing ? "Save changes" : "Add course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-card">
        {view.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 text-left font-semibold">Course Code</th>
                  <th className="px-6 py-4 text-left font-semibold">Course Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Department</th>
                  <th className="px-6 py-4 text-left font-semibold">Credits</th>
                  <th className="px-6 py-4 text-left font-semibold">Lecturer</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {view.map((c) => {
                  const lec = lecturers.find((l) => l.id === c.lecturerId);
                  return (
                    <tr key={c.id} className="transition-smooth hover:bg-primary-soft/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-mono font-bold">{c.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.department}</td>
                      <td className="px-6 py-4 font-medium">{c.credits.toFixed(1)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar seed={lec?.name || "?"} size={28} />
                          <span className="text-muted-foreground">{lec?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary-soft" onClick={() => startEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} courses
          </p>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(pages, 4) }).map((_, i) => {
              const n = i + 1;
              const active = n === page;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-8 min-w-[32px] rounded-lg px-2 text-sm font-semibold transition-smooth",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary-soft"
                  )}
                >
                  {n}
                </button>
              );
            })}
            {pages > 4 && <span className="px-1 text-muted-foreground">…</span>}
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom row: Schedule analysis + Quick stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-soft via-card to-card p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold">Automated Schedule Analysis</h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Our engine has identified <span className="font-semibold text-foreground">4 potential room conflicts</span> for the upcoming semester.
            We recommend re-allocating <span className="font-semibold text-foreground">'Quantum Mechanics II'</span> to a larger lecture hall.
          </p>
          <Button className="mt-5 rounded-2xl gradient-deep text-primary-foreground shadow-glow" onClick={() => toast.success("Opening optimization suggestions…")}>
            <Sparkles className="mr-2 h-4 w-4" />
            View Optimization Suggestions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Credits</span>
              <span className="font-display text-lg font-bold">{totalCredits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Instructors</span>
              <span className="font-display text-lg font-bold">{lecturers.filter((l) => l.available).length * 7}</span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Efficiency Score</span>
                <span className="font-display text-lg font-bold text-primary">92%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[92%] gradient-deep" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusPill = ({ status }: { status: Course["status"] }) => {
  const map = {
    optimized: { label: "Optimized", cls: "bg-success-soft text-success", dot: "bg-success" },
    conflicts: { label: "Conflicts Detected", cls: "bg-destructive-soft text-destructive", dot: "bg-destructive" },
    pending: { label: "Pending Review", cls: "bg-warning-soft text-warning", dot: "bg-warning" },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
      <BookOpen className="h-6 w-6 text-primary" />
    </div>
    <p className="font-medium">No courses found</p>
    <p className="text-sm text-muted-foreground">Try adjusting your search filters.</p>
  </div>
);

export default Courses;
