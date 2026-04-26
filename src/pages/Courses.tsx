import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { courses as seed, lecturers, Course } from "@/lib/mockData";
import { toast } from "sonner";

const PAGE_SIZE = 5;

const Courses = () => {
  const [items, setItems] = useState<Course[]>(seed);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ code: "", name: "", lecturerId: "", credits: 3, department: "Software", level: "300" });

  const filtered = useMemo(
    () => items.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const view = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setForm({ code: "", name: "", lecturerId: "", credits: 3, department: "Software", level: "300" });
    setEditing(null);
  };

  const submit = () => {
    if (!form.code || !form.name || !form.lecturerId) return toast.error("Please fill all required fields");
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
    setForm({ code: c.code, name: c.name, lecturerId: c.lecturerId, credits: c.credits, department: c.department, level: c.level });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Management"
        description="Add, edit, and assign courses to lecturers."
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
                <DialogDescription>Fill in the course details below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Course Code</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CSC301" className="mt-1.5 rounded-xl" />
                  </div>
                  <div>
                    <Label>Credits</Label>
                    <Input type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} className="mt-1.5 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label>Course Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Data Structures" className="mt-1.5 rounded-xl" />
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
                    <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
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
                <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={submit}>
                  {editing ? "Save changes" : "Add course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search courses…" className="h-10 rounded-xl pl-9" />
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} courses</p>
        </div>

        {view.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Code</th>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Lecturer</th>
                  <th className="px-5 py-3 text-left font-medium">Credits</th>
                  <th className="px-5 py-3 text-left font-medium">Level</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {view.map((c) => {
                  const lec = lecturers.find((l) => l.id === c.lecturerId);
                  return (
                    <tr key={c.id} className="transition-smooth hover:bg-secondary/30">
                      <td className="px-5 py-4 font-mono font-semibold text-primary">{c.code}</td>
                      <td className="px-5 py-4 font-medium">{c.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{lec?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{c.credits}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{c.level}L</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => startEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => remove(c.id)}>
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

        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" className="rounded-lg" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
      <BookOpen className="h-6 w-6 text-primary" />
    </div>
    <p className="font-medium">No courses found</p>
    <p className="text-sm text-muted-foreground">Try adjusting your search or add a new course.</p>
  </div>
);

export default Courses;
