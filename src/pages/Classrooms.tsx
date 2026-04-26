import { PageHeader } from "@/components/PageHeader";
import { classrooms } from "@/lib/mockData";
import { DoorOpen, Users } from "lucide-react";

const Classrooms = () => (
  <div className="space-y-6">
    <PageHeader title="Classrooms" description="All available rooms and capacities." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classrooms.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <DoorOpen className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{r.type}</span>
          </div>
          <p className="mt-4 font-display text-lg font-bold">{r.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Capacity: {r.capacity}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default Classrooms;
