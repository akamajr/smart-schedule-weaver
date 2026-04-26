import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  DoorOpen,
  CalendarCheck,
  Sparkles,
  AlertTriangle,
  Plus,
  Wand2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { courses, lecturers, classrooms, recentActivity, conflicts } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here’s what’s happening across your timetable."
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/courses")}>
              <Plus className="mr-2 h-4 w-4" /> Add course
            </Button>
            <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => navigate("/generator")}>
              <Wand2 className="mr-2 h-4 w-4" /> Generate timetable
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Courses" value={courses.length} icon={BookOpen} accent="primary" trend="+2 this week" />
        <StatCard title="Total Lecturers" value={lecturers.length} icon={Users} accent="info" trend="+1 this month" />
        <StatCard title="Classrooms" value={classrooms.length} icon={DoorOpen} accent="success" />
        <StatCard title="Active Timetables" value={3} icon={CalendarCheck} accent="warning" trend="2 published" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* AI Assistant */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Smart alerts & optimizations</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => navigate("/ai")}>
              Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-3 p-5">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3 transition-smooth hover:bg-secondary/60"
              >
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                  c.severity === "high" ? "bg-destructive/10 text-destructive" :
                  c.severity === "medium" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.description}</p>
                  <p className="text-xs text-muted-foreground">{c.details} · {c.day} {c.time}</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => navigate("/conflicts")}>
                  Resolve
                </Button>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft p-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <div className="text-sm">
                <span className="font-medium">Optimization tip:</span>{" "}
                <span className="text-muted-foreground">Move CSC205 to Wednesday 14:00 to free Hall B and reduce 2 conflicts.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold">Recent Activity</h3>
          </div>
          <ul className="divide-y divide-border">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-4 transition-smooth hover:bg-secondary/40">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.user} · {a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
