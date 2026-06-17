"use client";

import { useEffect, useMemo, useDeferredValue, useState } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Search, List, LayoutGrid,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  User, Mail, Phone, CheckCircle2, XCircle
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

// ── Types ──────────────────────────────────────────────────────────────────────
type Lecturer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: "lecturer";
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
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", is_active: true });
  
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, is_active, role")
      .eq("role", "lecturer")
      .order("full_name");

    if (error) toast.error(error.message);
    else setItems((data ?? []) as Lecturer[]);

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
      setForm({ full_name: "", email: "", phone: "", is_active: true }); 
    }
  };

  const openEdit = (l: Lecturer) => {
    setEditingId(l.id);
    setForm({ 
      full_name: l.full_name, 
      email: l.email, 
      phone: l.phone || "", 
      is_active: l.is_active 
    });
    setOpen(true);
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

    if (editingId) {
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", editingId)
        .select("id, full_name, email, phone, is_active, role")
        .single();
        
      setSaving(false);
      if (error) return toast.error(error.message);
      
      setItems((p) =>
        p.map((x) => x.id === editingId ? (data as Lecturer) : x)
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
      );
      toast.success("Lecturer updated");
    } else {
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("profiles")
        .insert({ ...payload, id })
        .select("id, full_name, email, phone, is_active, role")
        .single();
        
      setSaving(false);
      if (error) return toast.error(error.message);
      
      setItems((p) => [...p, data as Lecturer].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      toast.success("Lecturer added");
    }
    handleOpenChange(false);
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
    return (
      <div className="grid gap-4 py-2">
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

        <div>
          <Label>Phone (Optional)</Label>
          <Input className="mt-1.5 rounded-xl" type="tel" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. +1 234 567 890" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <Label className="text-base">Active Status</Label>
            <p className="text-xs text-muted-foreground">If disabled, lecturer cannot be assigned to new timetables.</p>
          </div>
          <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
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
                  <TableHead>Phone</TableHead>
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
                    <TableCell className="text-muted-foreground">{l.phone || "—"}</TableCell>
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
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(l)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive" onClick={() => remove(l)}>
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
                    {l.phone && (
                      <div className="flex items-center justify-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{l.phone}</span>
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
    </div>
  );
}
