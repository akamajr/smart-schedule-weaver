import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Users, DoorOpen, PieChart, Sparkles, AlertTriangle, AlertCircle,
  Download, RefreshCw, BarChart3, Compass, TrendingUp, Brain,
} from "lucide-react";
import { courses, lecturers, classrooms } from "@/lib/mockData";
import { toast } from "sonner";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Welcome back, Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Operational Overview &amp; Institutional Health</p>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Courses" value={courses.length * 15} icon={BookOpen} accent="primary" trend="+4 this semester" trendIcon={TrendingUp} />
        <StatCard title="Active Lecturers" value={45} icon={Users} accent="success" trend="Fully deployed" trendIcon={TrendingUp} />
        <StatCard title="Available Classrooms" value={30} icon={DoorOpen} accent="violet" trend="High demand" trendIcon={AlertCircle} trendTone="warning" />
        <StatCard title="Total Allocation" value="92%" icon={PieChart} accent="warning" trend="Capacity Utilization" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Assistant Real-Time alerts */}
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
                  <AlertTriangle className="h-4 w-4" />
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
              <h3 className="font-display text-base font-semibold">Generation Status</h3>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-3xl font-bold text-primary">85%</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In Progress</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[85%] gradient-deep transition-all" />
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              {[
                { label: "Optimizing Constraints", sub: "Faculty availability & travel time", done: true },
                { label: "Room Sequencing", sub: "Lab accessibility checks", done: true },
                { label: "Final Validation", sub: "Institutional policy compliance", done: false },
              ].map((s) => (
                <li key={s.label} className="flex items-start gap-2.5">
                  <span className={`mt-1 h-2 w-2 rounded-full ${s.done ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium leading-tight">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="mt-5 w-full rounded-xl bg-primary-soft border-transparent text-primary hover:bg-primary-soft/80">
              View Live Logs
            </Button>
          </div>

          {/* Capacity dark card */}
          <div className="relative overflow-hidden rounded-2xl gradient-dark p-5 text-primary-foreground shadow-elegant">
            <h3 className="font-display text-lg font-semibold">Academic Capacity</h3>
            <p className="mt-2 text-sm text-white/80">
              You are nearing maximum capacity for Science Laboratory Block B.
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
