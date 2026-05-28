import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Users, DoorOpen, PieChart, AlertCircle,
  Download, RefreshCw, BarChart3, Compass, TrendingUp, Brain,
  School, Building2, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Counts = {
  courses: number;
  lecturers: number;
  halls: number;
  faculties: number;
  departments: number;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCounts(true);
      const [courses, lecturers, halls, faculties, departments] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("halls").select("id", { count: "exact", head: true }),
        supabase.from("faculties").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        courses: courses.count ?? 0,
        lecturers: lecturers.count ?? 0,
        halls: halls.count ?? 0,
        faculties: faculties.count ?? 0,
        departments: departments.count ?? 0,
      });
      setLoadingCounts(false);
    };
    fetchCounts();
  }, []);

  const stat = (n: number | undefined) => (loadingCounts ? "…" : n ?? 0);

  const displayName = user?.displayName || user?.username || "Admin";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {greeting}, {displayName.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Operational Overview &amp; Institutional Health
            <span className="ml-2 text-[11px] text-muted-foreground/60">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Generating PDF…")}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button className="rounded-xl gradient-deep text-primary-foreground shadow-glow" onClick={() => toast.success("Recalculating timetable…")}>
            <RefreshCw className="mr-2 h-4 w-4" /> Force Recalculation
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Courses" value={stat(counts?.courses)} icon={BookOpen} accent="primary" trend="Registered this semester" trendIcon={TrendingUp} />
        <StatCard title="Active Lecturers" value={stat(counts?.lecturers)} icon={Users} accent="success" trend="Fully deployed" trendIcon={TrendingUp} />
        <StatCard title="Exam Halls" value={stat(counts?.halls)} icon={DoorOpen} accent="violet" trend="Available for scheduling" trendIcon={AlertCircle} trendTone="neutral" />
        <StatCard title="Faculties" value={stat(counts?.faculties)} icon={School} accent="info" trend="Active schools" />
        <StatCard title="Departments" value={stat(counts?.departments)} icon={Building2} accent="warning" trend="Academic units" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Alerts panel */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-start justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">AI Assistant: Real-Time Scheduler Alerts</h3>
              </div>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Neural Engine Live
            </span>
          </div>

          <div className="space-y-3 p-5">
            {/* Critical */}
            <div className="overflow-hidden rounded-2xl border border-destructive/20 bg-destructive-soft/60">
              <div className="flex items-start gap-3 border-l-4 border-destructive p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">Room Conflict Detected</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">2 mins ago</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CS301 (Algorithms) &amp; ME202 (Thermodynamics) assigned to <span className="font-semibold text-foreground">Room 101, Monday 10:00 AM</span>.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="h-8 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toast.success("Auto-resolved")}>
                      Auto-Resolve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => toast.info("Ignored")}>
                      Ignore
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="overflow-hidden rounded-2xl border border-warning/20 bg-warning-soft/60">
              <div className="flex items-start gap-3 border-l-4 border-warning p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">Lecturer Conflict</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">15 mins ago</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dr. A. Smith assigned two concurrent lectures, <span className="font-semibold text-foreground">Tuesday 02:00 PM</span>.
                  </p>
                  <div className="mt-3">
                    <Button size="sm" className="h-8 rounded-lg bg-foreground text-background hover:bg-foreground/90" onClick={() => toast.success("Suggesting alternative…")}>
                      Suggest Alternative
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info: data populated */}
            {!loadingCounts && counts && (
              <div className="overflow-hidden rounded-2xl border border-success/20 bg-success-soft/40">
                <div className="flex items-start gap-3 border-l-4 border-success p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Database Ready</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {counts.courses} courses across {counts.departments} departments in {counts.faculties} faculties. All {counts.halls} halls available.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Generation Status */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-semibold">Data Coverage</h3>
            </div>

            {loadingCounts ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-end justify-between">
                  <p className="font-display text-3xl font-bold text-primary">
                    {counts && counts.faculties > 0 ? Math.round(((counts.departments + counts.courses) / ((counts.faculties * 10) + 1)) * 10) + "%" : "0%"}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coverage</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full gradient-deep transition-all"
                    style={{ width: counts && counts.faculties > 0 ? `${Math.min(100, Math.round(((counts.departments + counts.courses) / ((counts.faculties * 10) + 1)) * 10))}%` : "0%" }}
                  />
                </div>
                <ul className="mt-5 space-y-3 text-sm">
                  {[
                    { label: "Faculties", val: counts?.faculties, icon: School },
                    { label: "Departments", val: counts?.departments, icon: Building2 },
                    { label: "Courses", val: counts?.courses, icon: BookOpen },
                    { label: "Halls", val: counts?.halls, icon: DoorOpen },
                    { label: "Lecturers", val: counts?.lecturers, icon: Users },
                  ].map(({ label, val, icon: Icon }) => (
                    <li key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium leading-tight">{label}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">{val ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Dark promo card */}
          <div className="relative overflow-hidden rounded-2xl gradient-dark p-5 text-primary-foreground shadow-elegant">
            <h3 className="font-display text-lg font-semibold">Academic Capacity</h3>
            <p className="mt-2 text-sm text-white/80">
              {loadingCounts ? "Loading capacity data…" :
                counts && counts.halls > 0
                  ? `${counts.halls} halls configured for ${counts.courses} courses. Run the AI generator when ready.`
                  : "No halls configured yet. Add halls to begin scheduling."}
            </p>
            <button
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
              onClick={() => toast.info("Resource expansion request filed")}
            >
              Request Resource Expansion →
            </button>
            <Compass className="pointer-events-none absolute -right-4 -bottom-4 h-32 w-32 text-white/10" strokeWidth={1} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
