import { classrooms } from "@/lib/mockData";
import { DoorOpen, Users, Building2 } from "lucide-react";

const Classrooms = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Classrooms</h1>
      <p className="mt-2 text-sm text-muted-foreground">All available rooms, capacities and buildings.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classrooms.map((r) => (
        <div key={r.id} className="rounded-3xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
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
        </div>
      ))}
    </div>
  </div>
);

export default Classrooms;
