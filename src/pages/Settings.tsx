import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users as seed, User } from "@/lib/mockData";
import { Pencil, Trash2, UserPlus, Save, BarChart3, CalendarCheck, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [list, setList] = useState<User[]>(seed);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [aiOpt, setAiOpt] = useState(true);
  const [maxClasses, setMaxClasses] = useState(6);
  const [tolerance, setTolerance] = useState([15]);
  const [academic, setAcademic] = useState({ year: "2023 / 2024", semester: "Second Semester", start: "2024-01-15", end: "2024-06-12" });

  const removeUser = (id: string) => {
    setList((p) => p.filter((u) => u.id !== id));
    toast.success("User removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">System Control Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configure platform parameters and manage user access permissions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Management */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card shadow-card">
          <div className="flex items-start justify-between gap-3 p-6">
            <div>
              <h3 className="font-display text-lg font-bold">Administrative User Management</h3>
              <p className="mt-1 text-sm text-muted-foreground">Control system access levels and roles.</p>
            </div>
            <Button className="rounded-2xl gradient-deep text-primary-foreground shadow-glow" onClick={() => toast.info("Add user (mock)")}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </div>

          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 text-left font-semibold">User Identity</th>
                  <th className="px-6 py-4 text-left font-semibold">Username</th>
                  <th className="px-6 py-4 text-left font-semibold">Assigned Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((u) => (
                  <tr key={u.id} className="transition-smooth hover:bg-primary-soft/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar seed={u.email} size={40} />
                        <div>
                          <p className="font-semibold leading-tight">
                            {u.role === "Admin" ? `Dr. ${u.username.split("_")[0].replace(/^\w/, c => c.toUpperCase())}` :
                              `Prof. ${u.username.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase())}`}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        u.role === "Admin" ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
                      )}>{u.role.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider",
                        u.status === "active" ? "text-success" : "text-muted-foreground"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "active" ? "bg-success" : "bg-muted-foreground")} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary-soft"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeUser(u.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Algorithm & View Configurations */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-bold">Algorithm &amp; View Configurations</h3>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default Timetable View</Label>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-secondary/40 p-1">
                <button
                  onClick={() => setView("weekly")}
                  className={cn("rounded-xl py-2.5 text-sm font-semibold", view === "weekly" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                >
                  Weekly Grid
                </button>
                <button
                  onClick={() => setView("monthly")}
                  className={cn("rounded-xl py-2.5 text-sm font-semibold", view === "monthly" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                >
                  Monthly Overview
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary-soft/40 p-4">
              <div>
                <p className="text-sm font-semibold">AI Optimization Engine</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Enable/Disable Genetic Algorithm</p>
              </div>
              <Switch checked={aiOpt} onCheckedChange={setAiOpt} />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Maximum Classes Per Day</Label>
              <Input type="number" min={1} max={10} value={maxClasses} onChange={(e) => setMaxClasses(+e.target.value)} className="mt-2 h-11 rounded-xl" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conflict Tolerance Level</Label>
                <span className="text-xs font-bold text-primary">
                  {tolerance[0] < 25 ? "Strict" : tolerance[0] < 60 ? "Balanced" : "Relaxed"} ({tolerance[0]}%)
                </span>
              </div>
              <Slider value={tolerance} onValueChange={setTolerance} max={100} step={1} className="mt-3" />
            </div>

            <Button className="w-full rounded-2xl bg-foreground text-background hover:bg-foreground/90" onClick={() => toast.success("All changes saved")}>
              <Save className="mr-2 h-4 w-4" /> Save All Changes
            </Button>
          </div>
        </div>

        {/* Curriculum & Term Scheduling */}
        <div className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <h3 className="font-display text-lg font-bold">Curriculum &amp; Term Scheduling</h3>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Field label="Academic Year">
              <Select value={academic.year} onValueChange={(v) => setAcademic({ ...academic, year: v })}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022 / 2023">2022 / 2023</SelectItem>
                  <SelectItem value="2023 / 2024">2023 / 2024</SelectItem>
                  <SelectItem value="2024 / 2025">2024 / 2025</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Current Semester">
              <Select value={academic.semester} onValueChange={(v) => setAcademic({ ...academic, semester: v })}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Semester">First Semester</SelectItem>
                  <SelectItem value="Second Semester">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Term Start">
              <Input type="date" value={academic.start} onChange={(e) => setAcademic({ ...academic, start: e.target.value })} className="mt-2 h-11 rounded-xl" />
            </Field>
            <Field label="Term End">
              <Input type="date" value={academic.end} onChange={(e) => setAcademic({ ...academic, end: e.target.value })} className="mt-2 h-11 rounded-xl" />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border-l-4 border-success bg-success-soft/40 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-sm">
              <BadgeCheck className="h-4 w-4 text-success" />
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Configuration</p>
              <p className="mt-1 font-display text-base font-bold">Term: 2023/24, 2nd Semester</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining Days</p>
              <p className="font-display text-xl font-bold">142 Days</p>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Courses</p>
              <p className="font-display text-xl font-bold">84</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default Settings;
