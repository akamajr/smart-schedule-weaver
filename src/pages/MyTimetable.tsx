import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { days, timeSlots, initialTimetable } from "@/lib/mockData";
import { Download, Printer, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MyTimetable = () => {
  const { user } = useAuth();
  // For demo: show a slice of the timetable as the lecturer's
  const mine = initialTimetable.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.username}`}
        description="Your weekly teaching schedule at a glance."
        actions={
          <>
            <Button variant="outline" className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {mine.map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant">
            <div className="flex items-start justify-between">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-xs font-bold text-primary">{s.courseCode}</span>
              <span className="text-xs text-muted-foreground">{s.day}</span>
            </div>
            <p className="mt-3 font-display text-base font-semibold leading-tight">{s.courseName}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {s.time}</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {s.room}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border p-4">
          <p className="font-display text-base font-semibold">Weekly Calendar</p>
        </div>
        <div className="overflow-x-auto p-4">
          <div className="min-w-[800px] grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
            <div />
            {days.map((d) => (
              <div key={d} className="px-2 pb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
            ))}
            {timeSlots.map((t) => (
              <FragmentRow key={t} t={t} days={days} mine={mine} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FragmentRow = ({ t, days, mine }: { t: string; days: string[]; mine: typeof initialTimetable }) => (
  <>
    <div className="flex items-center justify-end pr-3 text-xs font-medium text-muted-foreground">{t}</div>
    {days.map((d) => {
      const slot = mine.find((s) => s.day === d && s.time === t);
      return (
        <div key={d + t} className="m-1 min-h-[64px] rounded-xl border border-dashed border-border p-1.5">
          {slot && (
            <div className="rounded-lg border border-primary/20 bg-primary-soft p-2 text-[11px] text-primary">
              <p className="font-mono font-bold">{slot.courseCode}</p>
              <p className="truncate text-foreground">{slot.room}</p>
            </div>
          )}
        </div>
      );
    })}
  </>
);

export default MyTimetable;
