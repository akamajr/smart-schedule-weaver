"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, CalendarDays, Building2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
type Timetable = {
  id: string;
  title: string;
  faculty_id: string | null;
  department_id: string | null;
  level: string;
  semester: string;
  academic_year: string;
  status: string;
  type: string;
  header_text: string | null;
};

type Slot = {
  id: string;
  timetable_id: string;
  course_id: string | null;
  course_ids: string[] | null;
  lecturer_id: string | null;
  lecturer_ids: string[] | null;
  hall_id: string | null;
  hall_ids: string[] | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  color: string;
  notes: string | null;
};

type TimeColumn = { id: string; start_time: string; end_time: string; sort_order: number };

type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
const DAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Constants & Helpers ────────────────────────────────────────────────────────
const colorClasses: Record<string, string> = {
  indigo: "border-l-primary bg-primary-soft/45",
  emerald: "border-l-success bg-success-soft/40",
  amber: "border-l-warning bg-warning-soft/45",
  rose: "border-l-destructive bg-destructive/5",
  sky: "border-l-sky-500 bg-sky-50 dark:bg-sky-950/30",
  violet: "border-l-violet-500 bg-violet-50 dark:bg-violet-950/30",
};

const DEFAULT_TIME_COLUMNS = [
  { id: "1", start_time: "08:00", end_time: "10:00", sort_order: 1 },
  { id: "2", start_time: "10:00", end_time: "12:00", sort_order: 2 },
  { id: "3", start_time: "12:00", end_time: "14:00", sort_order: 3 },
  { id: "4", start_time: "14:00", end_time: "16:00", sort_order: 4 },
];

export default function StudentTimetableUI() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"personal" | "department">("personal");

  // Reference Data
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [coursesMap, setCoursesMap] = useState<Map<string, any>>(new Map());
  const [hallsMap, setHallsMap] = useState<Map<string, any>>(new Map());
  const [lecturersMap, setLecturersMap] = useState<Map<string, any>>(new Map());

  // Personal View State
  const [personalSlots, setPersonalSlots] = useState<Slot[]>([]);
  const [personalTimeColumns, setPersonalTimeColumns] = useState<TimeColumn[]>(DEFAULT_TIME_COLUMNS);
  const [personalTimetable, setPersonalTimetable] = useState<Timetable | null>(null);
  const [personalLoading, setPersonalLoading] = useState(true);

  // Department View State
  const [allTimetables, setAllTimetables] = useState<Timetable[]>([]);
  const [deptSlots, setDeptSlots] = useState<Slot[]>([]);
  const [deptTimeColumns, setDeptTimeColumns] = useState<TimeColumn[]>(DEFAULT_TIME_COLUMNS);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [deptLoading, setDeptLoading] = useState(false);

  // Filters
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch Reference Data once
  useEffect(() => {
    async function loadRefs() {
      const [facRes, depRes, couRes, halRes, lecRes] = await Promise.all([
        supabase.from("faculties").select("*"),
        supabase.from("departments").select("*"),
        supabase.from("courses").select("id, course_code, course_title"),
        supabase.from("halls").select("id, name, capacity"),
        supabase.from("profiles").select("id, full_name, email").eq("role", "lecturer"),
      ]);

      if (facRes.data) setFaculties(facRes.data);
      if (depRes.data) setDepartments(depRes.data);

      const cmap = new Map();
      couRes.data?.forEach(c => cmap.set(c.id, c));
      setCoursesMap(cmap);

      const hmap = new Map();
      halRes.data?.forEach(h => hmap.set(h.id, h));
      setHallsMap(hmap);

      const lmap = new Map();
      lecRes.data?.forEach(l => lmap.set(l.id, l));
      setLecturersMap(lmap);
    }
    loadRefs();
  }, []);

  // Fetch Personal Data (Based on user metadata)
  useEffect(() => {
    if (!user) return;
    async function loadPersonal() {
      setPersonalLoading(true);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user) throw new Error("Could not fetch user metadata");

        const userMeta = authData.user.user_metadata;
        const studentDeptId = userMeta?.department_id;
        const studentLevel = userMeta?.level ? String(userMeta.level) : null;

        if (!studentDeptId || !studentLevel) {
          setPersonalSlots([]);
          return;
        }

        // Find published timetables for this specific student's department and level
        const { data: publishedTts, error: ttsError } = await supabase
          .from("manual_timetables")
          .select("*")
          .eq("status", "published")
          .eq("department_id", studentDeptId)
          .eq("level", studentLevel)
          .order("created_at", { ascending: false });

        if (ttsError) throw ttsError;

        if (!publishedTts || publishedTts.length === 0) {
          setPersonalSlots([]);
          setPersonalTimetable(null);
          return;
        }

        // Just pick the most recently created one for this level/dept or the first one
        const activeTt = publishedTts[0];
        setPersonalTimetable(activeTt);

        const [{ data: slots }, { data: columns }] = await Promise.all([
          supabase.from("manual_timetable_slots").select("*").eq("timetable_id", activeTt.id),
          supabase.from("manual_timetable_time_columns").select("*").eq("timetable_id", activeTt.id).order("sort_order"),
        ]);

        setPersonalSlots(slots || []);

        if (columns && columns.length > 0) {
          setPersonalTimeColumns(columns);
        } else if (slots && slots.length > 0) {
          const times = new Set<string>();
          slots.forEach(s => times.add(`${s.start_time}-${s.end_time}`));
          const cols: TimeColumn[] = Array.from(times).map((t, idx) => {
            const [start, end] = t.split("-");
            return { id: `pc-${idx}`, start_time: start, end_time: end, sort_order: idx };
          }).sort((a, b) => a.start_time.localeCompare(b.start_time));
          setPersonalTimeColumns(cols.length > 0 ? cols : DEFAULT_TIME_COLUMNS);
        } else {
          setPersonalTimeColumns(DEFAULT_TIME_COLUMNS);
        }

      } catch (err) {
        console.error(err);
        toast.error("Failed to load your personal timetable");
      } finally {
        setPersonalLoading(false);
      }
    }
    loadPersonal();
  }, [user]);

  // Fetch All Published Timetables for Department View
  useEffect(() => {
    async function loadTimetables() {
      const { data } = await supabase
        .from("manual_timetables")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      
      if (data) setAllTimetables(data);
    }
    loadTimetables();
  }, []);

  // Fetch specific timetable details when selected
  useEffect(() => {
    if (!selectedTimetableId) {
      setDeptSlots([]);
      setDeptTimeColumns(DEFAULT_TIME_COLUMNS);
      return;
    }
    async function loadSpecificTimetable() {
      setDeptLoading(true);
      try {
        const [{ data: slots }, { data: columns }] = await Promise.all([
          supabase.from("manual_timetable_slots").select("*").eq("timetable_id", selectedTimetableId),
          supabase.from("manual_timetable_time_columns").select("*").eq("timetable_id", selectedTimetableId).order("sort_order"),
        ]);
        
        setDeptSlots(slots || []);
        if (columns && columns.length > 0) {
          setDeptTimeColumns(columns);
        } else {
          if (slots && slots.length > 0) {
            const times = new Set<string>();
            slots.forEach(s => times.add(`${s.start_time}-${s.end_time}`));
            const cols = Array.from(times).map((t, idx) => {
              const [start, end] = t.split("-");
              return { id: `dc-${idx}`, start_time: start, end_time: end, sort_order: idx };
            }).sort((a, b) => a.start_time.localeCompare(b.start_time));
            setDeptTimeColumns(cols.length > 0 ? cols : DEFAULT_TIME_COLUMNS);
          } else {
            setDeptTimeColumns(DEFAULT_TIME_COLUMNS);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDeptLoading(false);
      }
    }
    loadSpecificTimetable();
  }, [selectedTimetableId]);


  // Computed Filters for Department View
  const filteredTimetables = useMemo(() => {
    return allTimetables.filter(t => {
      if (selectedFaculty !== "all" && t.faculty_id !== selectedFaculty) return false;
      if (selectedDepartment !== "all" && t.department_id !== selectedDepartment) return false;
      if (selectedLevel !== "all" && t.level !== selectedLevel) return false;
      if (selectedType !== "all" && t.type !== selectedType) return false;
      return true;
    });
  }, [allTimetables, selectedFaculty, selectedDepartment, selectedLevel, selectedType]);

  // Derived values for rendering
  const activeSlots = viewMode === "personal" ? personalSlots : deptSlots;
  const activeCols = viewMode === "personal" ? personalTimeColumns : deptTimeColumns;
  const activeTimetable = viewMode === "personal" ? personalTimetable : allTimetables.find(t => t.id === selectedTimetableId);

  const renderSlotBlock = (slot: Slot) => {
    const courses = (slot.course_ids ?? [])
      .map(id => coursesMap.get(id)?.course_code)
      .filter(Boolean).join(" / ") || coursesMap.get(slot.course_id ?? "")?.course_code;
      
    const halls = (slot.hall_ids ?? [])
      .map(id => hallsMap.get(id)?.name)
      .filter(Boolean).join(" / ") || hallsMap.get(slot.hall_id ?? "")?.name;
      
    const lecs = (slot.lecturer_ids ?? [])
      .map(id => lecturersMap.get(id)?.full_name?.split(" ").pop())
      .filter(Boolean).join(", ") || lecturersMap.get(slot.lecturer_id ?? "")?.full_name?.split(" ").pop();

    const colorClass = colorClasses[slot.color] || colorClasses.indigo;

    return (
      <div key={slot.id} className={cn("h-full min-h-[96px] rounded-lg border-l-4 p-3 flex flex-col justify-between transition-smooth hover:shadow-md", colorClass)}>
        <div>
          <p className="font-bold text-sm tracking-tight text-foreground">{courses || "No Course"}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{slot.slot_type}</p>
        </div>
        <div className="mt-3 space-y-1">
          {halls && (
            <p className="text-xs font-medium flex items-center gap-1.5 opacity-90 text-foreground">
              <Building2 className="h-3 w-3" /> {halls}
            </p>
          )}
          {lecs && (
            <p className="text-xs font-medium flex items-center gap-1.5 opacity-90 text-foreground">
              <UserCircle2 className="h-3 w-3" /> {lecs}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl text-foreground">
            {viewMode === "personal" ? "My Level Timetable" : "Browse Timetables"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {viewMode === "personal" 
              ? "The published timetable for your specific level and department."
              : "Explore published schedules across the entire university."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode("personal")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === "personal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              My Level
            </button>
            <button
              onClick={() => setViewMode("department")}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === "department" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Browse All
            </button>
          </div>
          <Button variant="outline" size="icon" onClick={() => window.print()} title="Print Timetable">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "department" && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Faculty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                {faculties.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={selectedFaculty === "all"}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.filter(d => d.faculty_id === selectedFaculty).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {["100", "200", "300", "400", "500", "Masters"].map(l => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
              <SelectTrigger className="rounded-xl border-primary/30 bg-primary/5 font-medium"><SelectValue placeholder="Select Timetable..." /></SelectTrigger>
              <SelectContent>
                {filteredTimetables.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} ({t.semester} - {t.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Timetable Header Card */}
      {activeTimetable && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {activeTimetable.title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
            <span>{activeTimetable.academic_year}</span>
            <span>•</span>
            <span>{activeTimetable.semester} Semester</span>
            <span>•</span>
            <span>{activeTimetable.type}</span>
            <span>•</span>
            <span>Level {activeTimetable.level}</span>
          </div>
        </div>
      )}

      {/* Grid Render */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-card p-4 shadow-card print:p-0 print:border-none print:shadow-none">
        {(viewMode === "personal" && personalLoading) || (viewMode === "department" && deptLoading) ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
            Loading timetable data...
          </div>
        ) : (viewMode === "department" && !activeTimetable) ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
            <p>Select a timetable from the dropdown above to view it here.</p>
          </div>
        ) : (viewMode === "personal" && !activeTimetable) ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
            <p>No published timetable found for your department and level.</p>
          </div>
        ) : activeSlots.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
            <p>No classes scheduled found.</p>
          </div>
        ) : (
          <div className="relative mt-5 w-full max-w-full overflow-x-auto rounded-xl border border-border">
            <div
              className="grid w-full bg-card"
              style={{
                gridTemplateColumns: `140px repeat(${activeCols.length}, minmax(280px, 1fr))`,
                minWidth: `${140 + activeCols.length * 280}px`,
              }}
            >
              <div className="sticky left-0 top-0 z-30 border-b border-r border-border bg-card p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-[1px_0_0_hsl(var(--border))]">
                Day
              </div>
              {activeCols.map((col) => (
                <div key={col.id} className="sticky top-0 z-10 flex min-h-12 items-center justify-center border-b border-r border-border bg-card p-2 text-sm font-bold text-foreground last:border-r-0">
                  {col.start_time} - {col.end_time}
                </div>
              ))}
              
              {DAYS.map((day) => (
                <div key={day} className="contents">
                  <div className="sticky left-0 z-20 flex min-h-[150px] items-center border-b border-r border-border bg-card p-3 text-sm font-bold shadow-[1px_0_0_hsl(var(--border))]">
                    {day}
                  </div>
                  {activeCols.map((col) => {
                    const cellSlots = activeSlots.filter(
                      s => s.day_of_week === day && s.start_time === col.start_time && s.end_time === col.end_time
                    );
                    
                    return (
                      <div key={`${day}-${col.id}`} className="min-h-[150px] border-b border-r border-border bg-secondary/10 p-2 last:border-r-0 flex flex-col gap-2">
                        {cellSlots.map(slot => renderSlotBlock(slot))}
                        {cellSlots.length === 0 && (
                          <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/50 text-xs text-muted-foreground">
                            No class
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
