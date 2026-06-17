"use client";

import { useEffect, useMemo, useDeferredValue, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, List, LayoutGrid,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Faculty = { id: string; name: string };
type Department = { id: string; name: string; faculty_id: string };
type Course = {
  id: string;
  course_code: string;
  course_title: string;
  is_compulsory: boolean;
  department_id: string;
  faculty_id: string;
  department_name?: string;
  faculty_name?: string;
};
type SortKey = "course_code" | "course_title" | "department_name";
type SortDir = "asc" | "desc";

const STORAGE_KEY = "courses_view_mode";
const PAGE_SIZE = 20;

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" /> : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Courses() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "table";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "grid" || v === "table" ? v : "table";
  });

  const [items, setItems] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ course_code: "", course_title: "", is_compulsory: true, department_id: "", faculty_id: "" });
  
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);
  const [sortKey, setSortKey] = useState<SortKey>("course_code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [coursesRes, facRes, deptRes] = await Promise.all([
      supabase.from("courses").select("id, course_code, course_title, is_compulsory, department_id, faculty_id, faculties(name), departments(name)").order("course_code"),
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
    ]);

    if (coursesRes.error) toast.error(coursesRes.error.message);
    else {
      const mapped = (coursesRes.data ?? []).map((d: any) => ({
        id: d.id,
        course_code: d.course_code,
        course_title: d.course_title,
        is_compulsory: d.is_compulsory,
        department_id: d.department_id,
        faculty_id: d.faculty_id,
        faculty_name: d.faculties?.name ?? "Unknown",
        department_name: d.departments?.name ?? "Unknown",
      }));
      setItems(mapped);
    }

    if (facRes.error) toast.error(facRes.error.message);
    else setFaculties((facRes.data ?? []) as Faculty[]);

    if (deptRes.error) toast.error(deptRes.error.message);
    else setDepartments((deptRes.data ?? []) as Department[]);

    setLoading(false);
  };
  
  useEffect(() => { load(); }, []);

  // ── Filter → sort → paginate ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? items.filter((d) => 
          d.course_code.toLowerCase().includes(q) || 
          (d.course_title?.toLowerCase() || "").includes(q) ||
          d.department_name?.toLowerCase().includes(q)
        )
      : items;
  }, [items, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(col); setSortDir("asc"); }
  };

  const changeView = (m: "grid" | "table") => {
    setViewMode(m);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, m);
    setPage(1);
  };

  // ── Dialog ─────────────────────────────────────────────────────────────────
  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) { 
      setEditingId(null); 
      setForm({ course_code: "", course_title: "", is_compulsory: true, department_id: "", faculty_id: "" }); 
    }
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({ 
      course_code: c.course_code, 
      course_title: c.course_title || "", 
      is_compulsory: c.is_compulsory, 
      department_id: c.department_id, 
      faculty_id: c.faculty_id 
    });
    setOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.course_code.trim()) return toast.error("Course code is required");
    if (!form.course_title.trim()) return toast.error("Course title is required");
    if (!form.faculty_id) return toast.error("Please select a faculty");
    if (!form.department_id) return toast.error("Please select a department");
    
    setSaving(true);

    const faculty_name = faculties.find((f) => f.id === form.faculty_id)?.name ?? "Unknown";
    const department_name = departments.find((d) => d.id === form.department_id)?.name ?? "Unknown";

    const payload = {
      course_code: form.course_code.trim(),
      course_title: form.course_title.trim(),
      is_compulsory: form.is_compulsory,
      department_id: form.department_id,
      faculty_id: form.faculty_id
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("courses")
        .update(payload)
        .eq("id", editingId)
        .select("id, course_code, course_title, is_compulsory, department_id, faculty_id")
        .single();
        
      setSaving(false);
      if (error) return toast.error(error.message);
      
      setItems((p) =>
        p.map((x) => x.id === editingId ? { ...(data as Course), faculty_name, department_name } : x)
          .sort((a, b) => a.course_code.localeCompare(b.course_code))
      );
      toast.success("Course updated");
    } else {
      const { data, error } = await supabase
        .from("courses")
        .insert(payload)
        .select("id, course_code, course_title, is_compulsory, department_id, faculty_id")
        .single();
        
      setSaving(false);
      if (error) return toast.error(error.message);
      
      setItems((p) => [...p, { ...(data as Course), faculty_name, department_name }].sort((a, b) => a.course_code.localeCompare(b.course_code)));
      toast.success("Course added");
    }
    handleOpenChange(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (c: Course) => {
    if (!confirm(`Remove "${c.course_code}"? This may affect timetables and lecturer assignments.`)) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== c.id));
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    if (error) { setItems(prev); toast.error(error.message); }
    else toast.success(`${c.course_code} removed`);
  };

  // ── Form Fields ────────────────────────────────────────────────────────────
  const FormFields = () => {
    const filteredDepartments = departments.filter(d => d.faculty_id === form.faculty_id);
    return (
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Course Code</Label>
            <Input className="mt-1.5 rounded-xl" value={form.course_code}
              onChange={(e) => setForm({ ...form, course_code: e.target.value })}
              placeholder="e.g. CS101" />
          </div>
          <div>
            <Label>Course Title</Label>
            <Input className="mt-1.5 rounded-xl" value={form.course_title}
              onChange={(e) => setForm({ ...form, course_title: e.target.value })}
              placeholder="e.g. Intro to CS" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Faculty / School</Label>
            <Select value={form.faculty_id} onValueChange={(v) => setForm({ ...form, faculty_id: v, department_id: "" })}>
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })} disabled={!form.faculty_id}>
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {filteredDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <Label className="text-base">Compulsory Course</Label>
            <p className="text-xs text-muted-foreground">If true, this course is mandatory for students.</p>
          </div>
          <Switch checked={form.is_compulsory} onCheckedChange={(v) => setForm({ ...form, is_compulsory: v })} />
        </div>
      </div>
    );
  };

  const PaginationBar = () => (
    <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of{" "}
        <span className="font-medium">{sorted.length}</span>{search && " result" + (sorted.length !== 1 ? "s" : "")}
      </p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg p-0" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
        <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg p-0" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="min-w-[6ch] text-center text-sm font-medium">{page} / {totalPages}</span>
        <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg p-0" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg p-0" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Courses</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All academic courses across faculties.{isAdmin && " Add or edit below."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-border bg-card p-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-8 rounded-lg px-2.5" onClick={() => changeView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" className="h-8 rounded-lg px-2.5" onClick={() => changeView("table")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Dialog open={open && !editingId} onOpenChange={(v) => { if (!editingId) handleOpenChange(v); }}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-2xl gradient-deep px-5 text-primary-foreground shadow-glow">
                  <Plus className="mr-2 h-4 w-4" /> Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader><DialogTitle>New Course</DialogTitle></DialogHeader>
                <FormFields />
                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Course"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="rounded-xl pl-9" placeholder="Search by code, title, or dept…"
          value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {search ? `No courses match "${search}".` : `No courses yet.${isAdmin ? " Click \"Add Course\" to get started." : ""}`}
        </div>
      ) : viewMode === "table" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("course_code")}>
                    Course Code <SortIcon col="course_code" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("course_title")}>
                    Course Title <SortIcon col="course_title" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("department_name")}>
                    Department <SortIcon col="department_name" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium font-display">{c.course_code}</TableCell>
                    <TableCell className="font-medium text-muted-foreground">{c.course_title}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {c.department_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.is_compulsory ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">Core</span>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Elective</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Dialog open={open && editingId === c.id} onOpenChange={(v) => { if (editingId === c.id || !v) handleOpenChange(v); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-md">
                            <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
                            <FormFields />
                            <DialogFooter>
                              <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
                              <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((c) => (
              <div key={c.id} className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-glow">
                {isAdmin && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive" onClick={() => remove(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-4">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold">{c.course_code}</h3>
                  <p className="mt-1 text-sm font-medium leading-tight text-muted-foreground line-clamp-2">{c.course_title}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.department_name}
                  </span>
                  {c.is_compulsory ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">Core</span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Elective</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <PaginationBar />
        </div>
      )}
    </div>
  );
}
