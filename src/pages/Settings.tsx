import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users as seed, User } from "@/lib/mockData";
import { Pencil, Trash2, UserPlus, Save } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [list, setList] = useState<User[]>(seed);
  const [view, setView] = useState("Weekly");
  const [aiOpt, setAiOpt] = useState(true);
  const [maxClasses, setMaxClasses] = useState(4);
  const [academic, setAcademic] = useState({ year: "2024/2025", semester: "First", start: "2024-09-01", end: "2025-01-30" });

  const removeUser = (id: string) => {
    setList((p) => p.filter((u) => u.id !== id));
    toast.success("User removed");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Users" description="Manage users, system, and academic preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Management */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h3 className="font-display text-base font-semibold">User Management</h3>
              <p className="text-xs text-muted-foreground">{list.length} users</p>
            </div>
            <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => toast.info("Add user (mock)")}>
              <UserPlus className="mr-2 h-4 w-4" /> Add user
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((u) => (
                  <tr key={u.id} className="transition-smooth hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-xs font-bold text-primary-foreground">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        u.role === "Admin" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => removeUser(u.id)}>
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

        {/* System Preferences */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold">System Preferences</h3>
          <div className="mt-5 space-y-5">
            <div>
              <Label>Default timetable view</Label>
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">AI Optimization</p>
                <p className="text-xs text-muted-foreground">Auto-suggest improvements</p>
              </div>
              <Switch checked={aiOpt} onCheckedChange={setAiOpt} />
            </div>
            <div>
              <Label>Max classes per day</Label>
              <Input type="number" min={1} max={10} value={maxClasses} onChange={(e) => setMaxClasses(+e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Academic Setup */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Academic Setup</h3>
            <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => toast.success("Settings saved")}>
              <Save className="mr-2 h-4 w-4" /> Save changes
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <Label>Academic Year</Label>
              <Input value={academic.year} onChange={(e) => setAcademic({ ...academic, year: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Current Semester</Label>
              <Select value={academic.semester} onValueChange={(v) => setAcademic({ ...academic, semester: v })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester Start</Label>
              <Input type="date" value={academic.start} onChange={(e) => setAcademic({ ...academic, start: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Semester End</Label>
              <Input type="date" value={academic.end} onChange={(e) => setAcademic({ ...academic, end: e.target.value })} className="mt-1.5 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
