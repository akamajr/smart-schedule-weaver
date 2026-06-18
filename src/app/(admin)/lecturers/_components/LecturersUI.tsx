"use client";

import { useEffect, useMemo, useDeferredValue, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, List, LayoutGrid,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  User, Mail, Phone, CheckCircle2, XCircle, BookOpen, Building2
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ──────────────────────────────────────────────────────────────────────
type Lecturer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: "lecturer";
  department_id?: string;
  faculty_id?: string;
  assigned_courses?: string[];
};
type SortKey = "full_name" | "email" | "is_active";
type SortDir = "asc" | "desc";

const STORAGE_KEY = "lecturers_view_mode";
const PAGE_SIZE = 20;

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" /> : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Lecturers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "table";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "grid" || v === "table" ? v : "table";
  });

  const [items, setItems] = useState<Lecturer[]>([]);
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; faculty_id: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; course_code: string; course_title: string; department_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", is_active: true, faculty_id: "", department_id: "" });
  
  const [assignForm, setAssignForm] = useState<{ faculty_id: string; department_id: string; selected_courses: string[] }>({
    faculty_id: "",
    department_id: "",
    selected_courses: [],
  });
  
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    
    // Fetch all needed data in parallel
    const [
      { data: profiles },
      { data: facs },
      { data: depts },
      { data: crses },
      { data: lects },
      { data: assigns }
    ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, is_active, role").eq("role", "lecturer").order("full_name"),
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
      supabase.from("courses").select("id, course_code, course_title, department_id"),
      supabase.from("lecturers").select("id, department_id"),
      supabase.from("course_lecturer_assignments").select("id, course_id, lecturer_id")
    ]);

    if (facs) setFaculties(facs);
    if (depts) setDepartments(depts);
    if (crses) setCourses(crses);

    // Map departments to faculties for easy lookup
    const deptToFac = new Map(depts?.map(d => [d.id, d.faculty_id]) ?? []);
    const lectToDept = new Map(lects?.map(l => [l.id, l.department_id]) ?? []);
    
    // Group assignments by lecturer
    const assignsByLec = new Map<string, string[]>();
    assigns?.forEach(a => {
      const courses = assignsByLec.get(a.lecturer_id) || [];
      courses.push(a.course_id);
      assignsByLec.set(a.lecturer_id, courses);
    });

    if (profiles) {
      const enriched = profiles.map(p => {
        const d_id = lectToDept.get(p.id) || undefined;
        return {
          ...p,
          department_id: d_id,
          faculty_id: d_id ? deptToFac.get(d_id) : undefined,
          assigned_courses: assignsByLec.get(p.id) || []
        };
      });
      setItems(enriched as Lecturer[]);
    }

    setLoading(false);
  };
  
  useEffect(() => { load(); }, []);

  // ── Filter → sort → paginate ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? items.filter((d) => 
          d.full_name.toLowerCase().includes(q) || 
          d.email.toLowerCase().includes(q)
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
      setForm({ full_name: "", email: "", phone: "", is_active: true, faculty_id: "", department_id: "" }); 
    }
  };

  const openEdit = (l: Lecturer) => {
    setEditingId(l.id);
    setForm({ 
      full_name: l.full_name, 
      email: l.email, 
      phone: l.phone || "", 
      is_active: l.is_active,
      faculty_id: l.faculty_id || "",
      department_id: l.department_id || ""
    });
    setOpen(true);
  };

  const openAssign = (l: Lecturer) => {
    setAssigningId(l.id);
    setAssignForm({
      faculty_id: "",
      department_id: "",
      selected_courses: l.assigned_courses || []
    });
    setAssignOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.full_name.trim()) return toast.error("Full name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    
    setSaving(true);

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      is_active: form.is_active,
      role: "lecturer" as const
    };

    let savedLecturer: Lecturer;

    if (editingId) {
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", editingId)
        .select("id, full_name, email, phone, is_active, role")
        .single();
        
      if (error) { setSaving(false); return toast.error(error.message); }
      savedLecturer = data as Lecturer;
      
      if (form.department_id) {
        await supabase.from("lecturers").upsert({ id: editingId, department_id: form.department_id });
      }
      toast.success("Lecturer updated");
    } else {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("profiles")
        .insert({ ...payload, id })
        .select("id, full_name, email, phone, is_active, role")
        .single();
        
      if (error) { setSaving(false); return toast.error(error.message); }
      savedLecturer = data as Lecturer;
      
      if (form.department_id) {
        await supabase.from("lecturers").upsert({ id, department_id: form.department_id });
      }
      toast.success("Lecturer added");
    }

    // Refresh data fully so everything is in sync
    await load();
    setSaving(false);
    handleOpenChange(false);
  };

  const saveAssignments = async () => {
    if (!assigningId) return;
    setSaving(true);

    // Delete existing assignments for this lecturer
    await supabase.from("course_lecturer_assignments").delete().eq("lecturer_id", assigningId);

    // Insert new ones
    if (assignForm.selected_courses.length > 0) {
      const inserts = assignForm.selected_courses.map(cId => {
        const course = courses.find(c => c.id === cId);
        const dept = departments.find(d => d.id === course?.department_id);
        return {
          lecturer_id: assigningId,
          course_id: cId,
          department_id: dept?.id || "",
          faculty_id: dept?.faculty_id || ""
        };
      }).filter(i => i.department_id && i.faculty_id);

      if (inserts.length > 0) {
        const { error } = await supabase.from("course_lecturer_assignments").insert(inserts);
        if (error) {
          setSaving(false);
          return toast.error("Failed to save assignments: " + error.message);
        }
      }
    }

    toast.success("Course assignments updated");
    await load();
    setSaving(false);
    setAssignOpen(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (l: Lecturer) => {
    if (!confirm(`Remove "${l.full_name}"? This may fail if they are assigned to courses or timetables.`)) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== l.id));
    const { error } = await supabase.from("profiles").delete().eq("id", l.id);
    if (error) { setItems(prev); toast.error(error.message); }
    else toast.success(`${l.full_name} removed`);
  };

  // ── Form Fields ────────────────────────────────────────────────────────────
  const FormFields = () => {
    const filteredDepartments = departments.filter(d => d.faculty_id === form.faculty_id);

    return (
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1.5 rounded-xl" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Dr. Jane Doe" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5 rounded-xl" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. j.doe@university.edu" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Phone (Optional)</Label>
            <Input className="mt-1.5 rounded-xl" type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +1 234 567 890" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <Label className="text-base">Active Status</Label>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Primary Faculty (Optional)</Label>
            <Select value={form.faculty_id} onValueChange={(v) => setForm({ ...form, faculty_id: v, department_id: "" })}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Primary Department (Optional)</Label>
            <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })} disabled={!form.faculty_id}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {filteredDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Lecturers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage academic staff profiles.{isAdmin && " Add or edit below."}
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
                  <Plus className="mr-2 h-4 w-4" /> Add Lecturer
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader><DialogTitle>New Lecturer</DialogTitle></DialogHeader>
                <FormFields />
                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Lecturer"}
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
        <Input className="rounded-xl pl-9" placeholder="Search by name or email…"
          value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {search ? `No lecturers match "${search}".` : `No lecturers yet.${isAdmin ? " Click \"Add Lecturer\" to get started." : ""}`}
        </div>
      ) : viewMode === "table" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("full_name")}>
                    Name <SortIcon col="full_name" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("email")}>
                    Email <SortIcon col="email" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("is_active")}>
                    Status <SortIcon col="is_active" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium font-display">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar seed={l.full_name} size={32} />
                        {l.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.email}</TableCell>
                    <TableCell>
                      {l.department_id ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{departments.find(d => d.id === l.department_id)?.name || "—"}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {l.assigned_courses && l.assigned_courses.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{l.assigned_courses.length}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {l.is_active ? (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Dialog open={open && editingId === l.id} onOpenChange={(v) => { if (editingId === l.id || !v) handleOpenChange(v); }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" onClick={() => openEdit(l)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-md">
                            <DialogHeader><DialogTitle>Edit Lecturer</DialogTitle></DialogHeader>
                            <FormFields />
                            <DialogFooter>
                              <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
                              <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => openAssign(l)} title="Assign Courses">
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(l)}>
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
            {paginated.map((l) => (
              <div key={l.id} className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-glow">
                {isAdmin && (
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(l)} title="Edit Lecturer">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg text-primary hover:text-primary" onClick={() => openAssign(l)} title="Assign Courses">
                      <BookOpen className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive" onClick={() => remove(l)} title="Remove Lecturer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <InitialsAvatar seed={l.full_name} size={64} className="text-xl" />
                    <div className={cn(
                      "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card",
                      l.is_active ? "bg-success" : "bg-destructive"
                    )} />
                  </div>
                  <h3 className="font-display text-lg font-bold">{l.full_name}</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{l.email}</span>
                    </div>
                    {l.department_id && (
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-xs">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{departments.find(d => d.id === l.department_id)?.name || "—"}</span>
                      </div>
                    )}
                    {l.assigned_courses && l.assigned_courses.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-xs font-medium text-primary">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{l.assigned_courses.length} Course{l.assigned_courses.length !== 1 ? 's' : ''} Assigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PaginationBar />
        </div>
      )}

      {/* Assign Courses Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Courses to {items.find(i => i.id === assigningId)?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Filter by Faculty</Label>
                <Select value={assignForm.faculty_id} onValueChange={(v) => setAssignForm({ ...assignForm, faculty_id: v, department_id: "" })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Faculties" /></SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Filter by Department</Label>
                <Select value={assignForm.department_id} onValueChange={(v) => setAssignForm({ ...assignForm, department_id: v })} disabled={!assignForm.faculty_id}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d.faculty_id === assignForm.faculty_id).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Select Courses ({assignForm.selected_courses.length} selected)</Label>
              <ScrollArea className="h-[200px] rounded-xl border border-border p-2">
                {assignForm.department_id ? (
                  courses.filter(c => c.department_id === assignForm.department_id).length > 0 ? (
                    <div className="space-y-1">
                      {courses.filter(c => c.department_id === assignForm.department_id).map(c => {
                        const checked = assignForm.selected_courses.includes(c.id);
                        return (
                          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-accent">
                            <Checkbox 
                              checked={checked} 
                              onCheckedChange={(v) => {
                                setAssignForm(prev => ({
                                  ...prev,
                                  selected_courses: v 
                                    ? [...prev.selected_courses, c.id]
                                    : prev.selected_courses.filter(id => id !== c.id)
                                }));
                              }} 
                            />
                            <span className="text-sm font-medium">{c.course_code}</span>
                            <span className="text-xs text-muted-foreground truncate ml-1">- {c.course_title}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No courses in this department.</div>
                  )
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Select a department to view courses.</div>
                )}
              </ScrollArea>
              
              {assignForm.selected_courses.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Currently Assigned:</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {assignForm.selected_courses.map(id => {
                      const c = courses.find(x => x.id === id);
                      if (!c) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {c.course_code}
                          <button onClick={() => setAssignForm(p => ({ ...p, selected_courses: p.selected_courses.filter(x => x !== id) }))} className="ml-1 hover:text-destructive">
                            <XCircle className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={saveAssignments} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
