import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, ShieldAlert, UserPlus } from "lucide-react";
import { lecturers as seed, Lecturer } from "@/lib/mockData";
import { toast } from "sonner";

const Lecturers = () => {
  const [items, setItems] = useState<Lecturer[]>(seed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  const toggle = (id: string) => {
    setItems((p) => p.map((l) => (l.id === id ? { ...l, available: !l.available } : l)));
  };

  const add = () => {
    if (!form.name || !form.email) return toast.error("Please fill all fields");
    setItems((p) => [{ id: `l${Date.now()}`, name: form.name, email: form.email, available: true, courses: [] }, ...p]);
    toast.success("Lecturer added");
    setOpen(false);
    setForm({ name: "", email: "" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecturer Management"
        description="View availability and assigned courses."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Lecturer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Add Lecturer</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1.5 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1.5 rounded-xl" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="j.doe@uni.edu" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={add}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add lecturer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((l) => (
          <div key={l.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground">
                  {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.email}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                l.available ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              }`}>
                {l.available ? "Available" : "Busy"}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Courses</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {l.courses.length ? l.courses.map((c) => (
                  <span key={c} className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">{c}</span>
                )) : <span className="text-xs text-muted-foreground">No courses assigned</span>}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={l.available} onCheckedChange={() => toggle(l.id)} />
                <span className="text-xs text-muted-foreground">Toggle availability</span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => toast.info("Edit lecturer (mock)")}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => toast.success("Conflict ignored")}>
                  <ShieldAlert className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lecturers;
