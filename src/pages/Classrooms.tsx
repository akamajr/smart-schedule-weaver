import { useEffect, useState } from "react";
import { DoorOpen, Users, Building2, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Classroom = {
  id: string;
  name: string;
  capacity: number;
  type: string;
  building: string;
};

const TYPES = ["Lecture Hall", "Lab", "Studio"] as const;

const Classrooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [items, setItems] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    capacity: 50,
    type: "Lecture Hall",
    building: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, capacity, type, building")
      .order("name");
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Classroom[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.building.trim()) {
      return toast.error("Name and building are required");
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("classrooms")
      .insert({
        name: form.name.trim(),
        capacity: Number(form.capacity) || 0,
        type: form.type,
        building: form.building.trim(),
      })
      .select("id, name, capacity, type, building")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setItems((p) => [...p, data as Classroom].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`${data!.name} added`);
    setOpen(false);
    setForm({ name: "", capacity: 50, type: "Lecture Hall", building: "" });
  };

  const remove = async (room: Classroom) => {
    if (!confirm(`Remove ${room.name}?`)) return;
    const prev = items;
    setItems((p) => p.filter((r) => r.id !== room.id));
    const { error } = await supabase.from("classrooms").delete().eq("id", room.id);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else toast.success(`${room.name} removed`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Classrooms</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live registry of teaching venues. {isAdmin && "Add or remove rooms below."}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl gradient-deep px-5 text-primary-foreground shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Add Classroom
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>New classroom</DialogTitle></DialogHeader>
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
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Building</Label>
                  <Input className="mt-1.5 rounded-xl" value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="e.g. PEAGOB Complex" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={submit} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding…</> : "Add classroom"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading classrooms…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No classrooms yet. {isAdmin && "Click \"Add Classroom\" to create one."}
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
          {items.map((r, idx) => {
            // Vary card height for masonry feel
            const tall = idx % 3 === 0;
            return (
              <div key={r.id}
                className="group break-inside-avoid rounded-3xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{r.type}</span>
                </div>
                <p className="mt-4 font-display text-lg font-bold">{r.name}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {r.building}
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
                  <div className="mt-4 flex justify-end opacity-0 transition-smooth group-hover:opacity-100">
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
      )}
    </div>
  );
};

export default Classrooms;
