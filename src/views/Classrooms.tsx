import { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  DoorOpen, Users, Building2, Plus, Trash2, Loader2,
  LayoutGrid, List, Pencil, Search, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Classroom = {
  id: string;
  name: string;
  capacity: number;
  type: string;
  location: string;
};

type SortKey = keyof Omit<Classroom, "id">;
type SortDir = "asc" | "desc";

const STORAGE_VIEW_KEY = "classrooms_view_mode";
const PAGE_SIZE = 20;


const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
    : <ChevronDown className="ml-1 inline h-3.5 w-3.5" />;
};


const Classrooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";


  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem(STORAGE_VIEW_KEY);
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });

  const [items, setItems] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  const [searchRaw, setSearchRaw] = useState("");
  const search = useDeferredValue(searchRaw);


  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");


  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    capacity: 50,
    type: "Lecture Hall",
    location: "",
  });

  const changeView = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_VIEW_KEY, mode);
    setPage(1);
  };


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("halls")
      .select("id, name, capacity, type, location")
      .order("name");
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Classroom[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);


  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);


  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  const handleSort = (col: SortKey) => {
    if (col === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  };


  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      setForm({ name: "", capacity: 50, type: "Lecture Hall", location: "" });
    }
  };

  const openEdit = (room: Classroom) => {
    setEditingId(room.id);
    setForm({ name: room.name, capacity: room.capacity, type: room.type, location: room.location || "" });
    setOpen(true);
  };

 
  const submit = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      return toast.error("Name and location are required");
    }
    setSaving(true);

    if (editingId) {
      const { data, error } = await supabase
        .from("halls")
        .update({
          name: form.name.trim(),
          capacity: Number(form.capacity) || 0,
          type: form.type.trim() || "Lecture Hall",
          location: form.location.trim(),
        })
        .eq("id", editingId)
        .select("id, name, capacity, type, location")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setItems((p) =>
        p.map((item) => (item.id === editingId ? (data as Classroom) : item)).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`${data!.name} updated`);
    } else {
      const { data, error } = await supabase
        .from("halls")
        .insert({
          name: form.name.trim(),
          capacity: Number(form.capacity) || 0,
          type: form.type.trim() || "Lecture Hall",
          location: form.location.trim(),
        })
        .select("id, name, capacity, type, location")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      setItems((p) => [...p, data as Classroom].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`${data!.name} added`);
    }

    handleOpenChange(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const remove = async (room: Classroom) => {
    if (!confirm(`Remove ${room.name}?`)) return;
    const prev = items;
    setItems((p) => p.filter((r) => r.id !== room.id));
    const { error } = await supabase.from("halls").delete().eq("id", room.id);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else {
      toast.success(`${room.name} removed`);
    }
  };

  // ── Shared dialog ─────────────────────────────────────────────────────────
  const hallDialog = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isAdmin && (
        <DialogTrigger asChild>
          <Button className="h-11 rounded-2xl gradient-deep px-5 text-primary-foreground shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Add Classroom
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit classroom" : "New classroom"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5 rounded-xl" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. PEAGOB 5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Capacity</Label>
              <Input className="mt-1.5 rounded-xl" type="number" min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Input className="mt-1.5 rounded-xl" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="e.g. Standard Classroom, Lab" />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input className="mt-1.5 rounded-xl" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. PEAGOB Complex" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : (editingId ? "Save changes" : "Add classroom")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ── Pagination controls ───────────────────────────────────────────────────
  const PaginationBar = () => (
    <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of{" "}
        <span className="font-medium">{sorted.length}</span>
        {search && ` result${sorted.length !== 1 ? "s" : ""}`}
      </p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0"
          disabled={page === 1} onClick={() => setPage(1)}>
          «
        </Button>
        <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0"
          disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[6ch] text-center text-sm font-medium">
          {page} / {totalPages}
        </span>
        <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0"
          disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0"
          disabled={page === totalPages} onClick={() => setPage(totalPages)}>
          »
        </Button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Classrooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live registry of teaching venues.{isAdmin && " Add or edit rooms below."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm"
              className="h-8 rounded-lg px-2.5" onClick={() => changeView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm"
              className="h-8 rounded-lg px-2.5" onClick={() => changeView("table")}>
              <List className="h-4 w-4" />
            </Button>
          </div>

          {isAdmin && hallDialog}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="classrooms-search"
          className="rounded-xl pl-9"
          placeholder="Search by name, type or location…"
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading classrooms…
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {search ? `No classrooms match "${search}".` : `No classrooms yet.${isAdmin ? " Click \"Add Classroom\" to create one." : ""}`}
        </div>
      ) : viewMode === "table" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {(["name", "type", "location", "capacity"] as SortKey[]).map((col) => (
                    <TableHead key={col} className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort(col)}>
                      <span className="capitalize">{col}</span>
                      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                  ))}
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => (
                  <TableRow key={r.id} className="transition-colors">
                    <TableCell className="font-medium font-display">{r.name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {r.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.location || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.capacity}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(r)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
        /* Grid View */
        <div className="space-y-3">
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
            {paginated.map((r, idx) => {
              const tall = idx % 3 === 0;
              return (
                <div key={r.id}
                  className="group break-inside-avoid rounded-3xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {r.type}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-bold">{r.name}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {r.location || "No location specified"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Capacity: {r.capacity}
                  </p>
                  {tall && (
                    <p className="mt-3 rounded-xl bg-primary-soft/40 p-3 text-xs text-muted-foreground">
                      Available for scheduling. Confirm capacity matches expected cohort before assigning lectures.
                    </p>
                  )}
                  {isAdmin && (
                    <div className="mt-4 flex justify-end gap-2 opacity-0 transition-smooth group-hover:opacity-100">
                      <Button size="sm" variant="ghost"
                        className="rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => openEdit(r)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => remove(r)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <PaginationBar />
        </div>
      )}

      {/* Edit dialog trigger (programmatic only, no visible trigger) */}
      {editingId && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Edit classroom</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Name</Label>
                <Input className="mt-1.5 rounded-xl" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PEAGOB 5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Capacity</Label>
                  <Input className="mt-1.5 rounded-xl" type="number" min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input className="mt-1.5 rounded-xl" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="e.g. Standard Classroom, Lab" />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input className="mt-1.5 rounded-xl" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. PEAGOB Complex" />
              </div>
            </div>
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
};

export default Classrooms;
