import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { days, timeSlots, initialTimetable, TimetableSlot } from "@/lib/mockData";
import { Wand2, Loader2, Download, Printer, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Generator = () => {
  const [department, setDepartment] = useState("Software");
  const [level, setLevel] = useState("300");
  const [semester, setSemester] = useState("First");
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState<TimetableSlot[]>(initialTimetable);
  const [generated, setGenerated] = useState(true);
  const [draggingFrom, setDraggingFrom] = useState<{ day: string; time: string } | null>(null);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setGrid(initialTimetable);
      setGenerated(true);
      setLoading(false);
      toast.success("Timetable generated successfully");
    }, 1100);
  };

  const cellFor = (day: string, time: string) =>
    grid.filter((s) => s.day === day && s.time === time);

  const onDragStart = (day: string, time: string) => setDraggingFrom({ day, time });
  const onDrop = (day: string, time: string) => {
    if (!draggingFrom) return;
    setGrid((prev) =>
      prev.map((s) =>
        s.day === draggingFrom.day && s.time === draggingFrom.time
          ? { ...s, day, time }
          : s
      )
    );
    setDraggingFrom(null);
    toast.success(`Moved to ${day} ${time}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Generator"
        description="Configure constraints and generate an optimized schedule."
        actions={
          generated && (
            <>
              <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Exporting PDF…")}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Exporting Excel…")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </>
          )
        }
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Academic Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="300">300</SelectItem>
                <SelectItem value="400">400</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="First">First</SelectItem>
                <SelectItem value="Second">Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={generate} disabled={loading} className="h-10 w-full rounded-xl gradient-primary text-primary-foreground shadow-glow">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </div>
      </div>

      {generated && (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="font-display text-base font-semibold">Generated Schedule</p>
              <p className="text-xs text-muted-foreground">{department} · Level {level} · {semester} Semester · drag to reschedule</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Conflict</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Scheduled</span>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <div className="min-w-[900px] grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
              <div />
              {days.map((d) => (
                <div key={d} className="px-2 pb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
              ))}

              {timeSlots.map((t) => (
                <FragmentRow key={t} time={t} days={days} cellFor={cellFor} onDragStart={onDragStart} onDrop={onDrop} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FragmentRow = ({
  time, days, cellFor, onDragStart, onDrop,
}: {
  time: string;
  days: string[];
  cellFor: (d: string, t: string) => TimetableSlot[];
  onDragStart: (d: string, t: string) => void;
  onDrop: (d: string, t: string) => void;
}) => (
  <>
    <div className="flex items-center justify-end pr-3 text-xs font-medium text-muted-foreground">{time}</div>
    {days.map((d) => {
      const slots = cellFor(d, time);
      return (
        <div
          key={d + time}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(d, time)}
          className="m-1 min-h-[80px] rounded-xl border border-dashed border-border p-1.5 transition-smooth hover:border-primary/40 hover:bg-primary-soft/40"
        >
          {slots.map((s, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => onDragStart(d, time)}
              className={cn(
                "cursor-move rounded-lg p-2 text-left text-[11px] shadow-sm transition-smooth hover:-translate-y-0.5",
                s.conflict
                  ? "border border-destructive/40 bg-destructive/10 text-destructive"
                  : "border border-primary/20 bg-primary-soft text-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{s.courseCode}</span>
                {s.conflict && <AlertTriangle className="h-3 w-3" />}
              </div>
              <p className="mt-0.5 truncate font-medium text-foreground">{s.courseName}</p>
              <p className="truncate text-muted-foreground">{s.room} · {s.lecturer.split(" ").slice(-1)}</p>
            </div>
          ))}
        </div>
      );
    })}
  </>
);

export default Generator;
