"use client";
import { useEffect, useMemo, useDeferredValue, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, List, LayoutGrid,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// ── Types ──────────────────────────────────────────────────────────────────────
type Faculty = { id: string; name: string };
type Department = { id: string; name: string; faculty_id: string; created_at: string | null; faculty_name?: string };
type SortKey = "name" | "faculty_name" | "created_at";
type SortDir = "asc" | "desc";

const STORAGE_KEY = "departments_view_mode";
const PAGE_SIZE = 20;

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" /> : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Departments() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "table";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "grid" || v === "table" ? v : "table";
  });

  const [items, setItems] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", faculty_id: "" });
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [deptRes, facRes] = await Promise.all([
      supabase.from("departments").select("id, name, faculty_id, created_at, faculties(name)").order("name"),
      supabase.from("faculties").select("id, name").order("name"),
    ]);
    if (deptRes.error) toast.error(deptRes.error.message);
    else {
      const mapped = (deptRes.data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        faculty_id: d.faculty_id,
        created_at: d.created_at,
        faculty_name: d.faculties?.name ?? "Unknown",
      }));
      setItems(mapped);
    }
    if (facRes.error) toast.error(facRes.error.message);
    else setFaculties((facRes.data ?? []) as Faculty[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Filter → sort → paginate ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? items.filter((d) => d.name.toLowerCase().includes(q) || d.faculty_name?.toLowerCase().includes(q))
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
    if (!v) { setEditingId(null); setForm({ name: "", faculty_id: "" }); }
  };

  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({ name: d.name, faculty_id: d.faculty_id });
    setOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.name.trim()) return toast.error("Department name is required");
    if (!form.faculty_id) return toast.error("Please select a faculty");
    setSaving(true);

    const faculty_name = faculties.find((f) => f.id === form.faculty_id)?.name ?? "Unknown";

    if (editingId) {
      const { data, error } = await supabase
        .from("departments")
        .update({ name: form.name.trim(), faculty_id: form.faculty_id })
        .eq("id", editingId)
        .select("id, name, faculty_id, created_at")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setItems((p) =>
        p.map((x) => x.id === editingId ? { ...(data as Department), faculty_name } : x)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Department updated");
    } else {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name: form.name.trim(), faculty_id: form.faculty_id })
        .select("id, name, faculty_id, created_at")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setItems((p) => [...p, { ...(data as Department), faculty_name }].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Department added");
    }
    handleOpenChange(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (d: Department) => {
    if (!confirm(`Remove "${d.name}"? This may affect linked courses.`)) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== d.id));
    const { error } = await supabase.from("departments").delete().eq("id", d.id);
    if (error) { setItems(prev); toast.error(error.message); }
    else toast.success(`${d.name} removed`);
  };

  // ── Shared form fields ─────────────────────────────────────────────────────
  const FormFields = () => (
    <div className="grid gap-4 py-2">
      <div>
        <Label>Department Name</Label>
        <Input className="mt-1.5 rounded-xl" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Computer Science" />
      </div>
      <div>
        <Label>Faculty / School</Label>
        <Select value={form.faculty_id} onValueChange={(v) => setForm({ ...form, faculty_id: v })}>
          <SelectTrigger className="mt-1.5 rounded-xl">
            <SelectValue placeholder="Select a faculty…" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

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
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Departments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All academic departments grouped by faculty.{isAdmin && " Add or edit below."}
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
                  <Plus className="mr-2 h-4 w-4" /> Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
                <FormFields />
                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
                  <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Add Department"}
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
        <Input id="dept-search" className="rounded-xl pl-9" placeholder="Search by name or faculty…"
          value={searchRaw} onChange={(e) => setSearchRaw(e.target.value)} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {search ? `No departments match "${search}".` : `No departments yet.${isAdmin ? " Click \"Add Department\" to get started." : ""}`}
        </div>
      ) : viewMode === "table" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>
                    Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("faculty_name")}>
                    Faculty <SortIcon col="faculty_name" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                    Created <SortIcon col="created_at" sortKey={sortKey} sortDir={sortDir} />
                  </TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium font-display">{d.name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {d.faculty_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" /><span className="sr-only">Edit</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(d)}>
                          <Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span>
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
        <div className="space-y-3">
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
            {paginated.map((d) => (
              <div key={d.id} className="group break-inside-avoid rounded-3xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary text-lg font-bold">
                    {d.name.charAt(0)}
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground max-w-[140px] truncate">
                    {d.faculty_name}
                  </span>
                </div>
                <p className="mt-4 font-display text-base font-bold leading-snug">{d.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Added {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                </p>
                {isAdmin && (
                  <div className="mt-4 flex justify-end gap-2 opacity-0 transition-smooth group-hover:opacity-100">
                    <Button size="sm" variant="ghost" className="rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(d)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => remove(d)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <PaginationBar />
        </div>
      )}

      {/* Edit dialog (programmatic) */}
      {editingId && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
