import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  FilePlus2,
  GripVertical,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Department = { id: string; name: string; faculty_id: string };
type Faculty = { id: string; name: string };
type Course = {
  id: string;
  course_code: string;
  course_title: string | null;
  department_id: string;
  faculty_id: string | null;
};
type Hall = { id: string; name: string; capacity: number | null; location: string | null };
type Lecturer = { id: string; full_name: string; email: string; role: string };
type Timetable = {
  id: string;
  title: string;
  faculty_id: string | null;
  department_id: string | null;
  level: string;
  semester: string;
  academic_year: string;
  status: "draft" | "published";
  notes: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
type Slot = {
  id: string;
  timetable_id: string;
  course_id: string | null;
  lecturer_id: string | null;
  hall_id: string | null;
  day_of_week: DayName;
  start_time: string;
  end_time: string;
  slot_type: string;
  color: SlotColor;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type SlotDraft = Omit<Slot, "id" | "timetable_id"> & { id?: string };
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
type SlotColor = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
type TimeColumn = { id: string; start: string; end: string };
type TimeColumnRow = {
  id: string;
  timetable_id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};

const DAYS: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEVELS = ["100", "200", "300", "400", "500", "Masters"];
const SEMESTERS = ["First", "Second", "Resit"];
const SLOT_TYPES = ["Lecture", "Lab", "Tutorial", "Seminar", "Exam"];
const COLORS: SlotColor[] = ["indigo", "emerald", "amber", "rose", "sky", "violet"];
const EMPTY = "none";
const DEFAULT_TIME_COLUMNS: TimeColumn[] = [
  { id: "default-08", start: "08:00", end: "10:00" },
  { id: "default-10", start: "10:00", end: "12:00" },
  { id: "default-12", start: "12:00", end: "14:00" },
  { id: "default-14", start: "14:00", end: "16:00" },
];

const colorClasses: Record<SlotColor, string> = {
  indigo: "border-l-primary bg-primary-soft/45",
  emerald: "border-l-success bg-success-soft/40",
  amber: "border-l-warning bg-warning-soft/45",
  rose: "border-l-destructive bg-destructive/5",
  sky: "border-l-sky-500 bg-sky-50 dark:bg-sky-950/30",
  violet: "border-l-violet-500 bg-violet-50 dark:bg-violet-950/30",
};

const newSlot = (): SlotDraft => ({
  course_id: null,
  lecturer_id: null,
  hall_id: null,
  day_of_week: "Monday",
  start_time: "08:00",
  end_time: "10:00",
  slot_type: "Lecture",
  color: "indigo",
  notes: null,
});

const ManualTimetable = () => {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schemaReady, setSchemaReady] = useState(true);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [slotOpen, setSlotOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotDraft>(newSlot());
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [deleteTimetableOpen, setDeleteTimetableOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showWeekends, setShowWeekends] = useState(true);
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [savedCollapsed, setSavedCollapsed] = useState(false);
  const [customTimeColumns, setCustomTimeColumns] = useState<TimeColumn[]>(DEFAULT_TIME_COLUMNS);
  const [timeColumnDrafts, setTimeColumnDrafts] = useState<Record<string, Pick<TimeColumn, "start" | "end">>>({});
  const [focusedTimeColumnId, setFocusedTimeColumnId] = useState<string | null>(null);
  const [draggedTimeColumnId, setDraggedTimeColumnId] = useState<string | null>(null);
  const [dragOverTimeColumnId, setDragOverTimeColumnId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const gridSectionRef = useRef<HTMLElement | null>(null);
  const [meta, setMeta] = useState({
    title: "Manual Teaching Timetable",
    faculty_id: "",
    department_id: "",
    level: "300",
    semester: "First",
    academic_year: "2025/2026",
    notes: "",
  });

  const activeTimetable = useMemo(
    () => timetables.find((item) => item.id === activeId) ?? null,
    [activeId, timetables],
  );

  const visibleDays = showWeekends ? DAYS : DAYS.slice(0, 5);

  const coursesById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const hallsById = useMemo(() => new Map(halls.map((hall) => [hall.id, hall])), [halls]);
  const lecturersById = useMemo(
    () => new Map(lecturers.map((lecturer) => [lecturer.id, lecturer])),
    [lecturers],
  );

  const facultyDepartments = useMemo(() => {
    if (!meta.faculty_id) return departments;
    return departments.filter((department) => department.faculty_id === meta.faculty_id);
  }, [departments, meta.faculty_id]);

  const filteredCourses = useMemo(() => {
    const term = search.toLowerCase().trim();
    const facultyId = meta.faculty_id;
    const departmentId = meta.department_id;
    return courses.filter((course) => {
      const matchesFaculty = !facultyId || course.faculty_id === facultyId;
      const matchesDepartment = !departmentId || course.department_id === departmentId;
      const matchesLevel = courseLevel(course.course_code) === meta.level;
      const haystack = `${course.course_code} ${course.course_title ?? ""}`.toLowerCase();
      return matchesFaculty && matchesDepartment && matchesLevel && (!term || haystack.includes(term));
    });
  }, [courses, meta.department_id, meta.faculty_id, meta.level, search]);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [slots]);

  const timeColumns = useMemo(() => {
    const columnsByRange = new Map<string, TimeColumn>();
    const customRanges = new Set<string>();
    customTimeColumns.forEach((column) => {
      const key = `${column.start}-${column.end}`;
      columnsByRange.set(key, column);
      customRanges.add(key);
    });
    const slotColumns: TimeColumn[] = [];
    sortedSlots.forEach((slot) => {
      const key = `${slot.start_time}-${slot.end_time}`;
      if (customRanges.has(key) || columnsByRange.has(key)) return;
      const column = {
        id: `slot-${key}`,
        start: slot.start_time,
        end: slot.end_time,
      };
      columnsByRange.set(key, column);
      slotColumns.push(column);
    });
    slotColumns.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
    return [...customTimeColumns, ...slotColumns];
  }, [customTimeColumns, sortedSlots]);

  const conflicts = useMemo(() => detectConflicts(slots), [slots]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsGridFullscreen(document.fullscreenElement === gridSectionRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleGridFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await gridSectionRef.current?.requestFullscreen();
      }
    } catch {
      toast.error("Fullscreen is not available in this browser.");
    }
  };

  const loadTimeColumns = useCallback(async (timetableId: string) => {
    const { data, error } = await supabase
      .from("manual_timetable_time_columns")
      .select("id, timetable_id, start_time, end_time, sort_order")
      .eq("timetable_id", timetableId)
      .order("sort_order")
      .order("start_time");

    if (error) {
      setCustomTimeColumns(DEFAULT_TIME_COLUMNS);
      setTimeColumnDrafts({});
      toast.error(error.message);
      return;
    }

    const loadedColumns = ((data ?? []) as TimeColumnRow[]).map((column) => ({
      id: column.id,
      start: normalizeTimeInput(column.start_time),
      end: normalizeTimeInput(column.end_time),
    }));
    setCustomTimeColumns(loadedColumns.length ? loadedColumns : DEFAULT_TIME_COLUMNS);
    setTimeColumnDrafts({});
  }, []);

  const saveTimeColumnsForTimetable = async (timetableId: string, columns: TimeColumn[]) => {
    const { error: deleteError } = await supabase
      .from("manual_timetable_time_columns")
      .delete()
      .eq("timetable_id", timetableId);
    if (deleteError) {
      toast.error(deleteError.message);
      return false;
    }

    if (columns.length === 0) {
      setCustomTimeColumns([]);
      return true;
    }

    const inserts = columns.map((column, index) => ({
      timetable_id: timetableId,
      start_time: column.start,
      end_time: column.end,
      sort_order: index,
    }));
    const { data, error } = await supabase
      .from("manual_timetable_time_columns")
      .insert(inserts)
      .select("id, timetable_id, start_time, end_time, sort_order")
      .order("sort_order")
      .order("start_time");

    if (error) {
      toast.error(error.message);
      return false;
    }

    setCustomTimeColumns(((data ?? []) as TimeColumnRow[]).map((column) => ({
      id: column.id,
      start: normalizeTimeInput(column.start_time),
      end: normalizeTimeInput(column.end_time),
    })));
    return true;
  };

  const persistTimeColumns = async (columns: TimeColumn[], savedMessage: string) => {
    setCustomTimeColumns(columns);
    if (!activeId) {
      return true;
    }

    const saved = await saveTimeColumnsForTimetable(activeId, columns);
    if (saved) {
      toast.success(savedMessage);
      setHasUnsavedChanges(false);
    }
    return saved;
  };

  const saveAllTimeColumns = async () => {
    if (!activeId) {
      toast.error("Please save the timetable first before saving time columns");
      return;
    }

    setIsAutoSaving(true);
    const columnsToSave = customTimeColumns.map((column) => {
      const draft = timeColumnDrafts[column.id];
      if (draft) {
        return { ...column, start: draft.start, end: draft.end };
      }
      return column;
    });

    const valid = columnsToSave.every((col) => {
      const draft = timeColumnDrafts[col.id] ?? { start: col.start, end: col.end };
      return draft.start && draft.end && draft.start < draft.end;
    });

    if (!valid) {
      toast.error("Please fix invalid time ranges before saving");
      setIsAutoSaving(false);
      return;
    }

    setSaving(true);
    const saved = await saveTimeColumnsForTimetable(activeId, columnsToSave);
    setSaving(false);
    setIsAutoSaving(false);

    if (saved) {
      setTimeColumnDrafts({});
      setHasUnsavedChanges(false);
      toast.success("All time columns saved successfully");
    }
  };

  const createTimeColumnNear = (columns: TimeColumn[], insertIndex: number) => {
    if (columns.length === 0) {
      return { start: "08:00", end: "10:00" };
    }

    const clampedIndex = Math.max(0, Math.min(insertIndex, columns.length));
    if (clampedIndex < columns.length) {
      const targetColumn = columns[clampedIndex];
      const duration = Math.max(30, timeToMinutes(targetColumn.end) - timeToMinutes(targetColumn.start));
      const endMinutes = timeToMinutes(targetColumn.start);
      const startMinutes = Math.max(0, endMinutes - duration);
      if (startMinutes < endMinutes) {
        return { start: minutesToTime(startMinutes), end: minutesToTime(endMinutes) };
      }
    }

    const lastColumn = columns[columns.length - 1];
    const startMinutes = timeToMinutes(lastColumn.end);
    const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59);
    if (startMinutes < endMinutes) {
      return { start: minutesToTime(startMinutes), end: minutesToTime(endMinutes) };
    }

    return { start: lastColumn.start, end: lastColumn.end };
  };

  const addTimeColumnAt = async (insertIndex: number) => {
    const targetIndex = Math.max(0, Math.min(insertIndex, customTimeColumns.length));
    const { start, end } = createTimeColumnNear(customTimeColumns, targetIndex);
    const nextColumn = { id: `time-${Date.now()}`, start, end };
    const nextColumns = [
      ...customTimeColumns.slice(0, targetIndex),
      nextColumn,
      ...customTimeColumns.slice(targetIndex),
    ];
    setFocusedTimeColumnId(nextColumn.id);
    setTimeColumnDrafts((drafts) => ({ ...drafts, [nextColumn.id]: { start, end } }));
    await persistTimeColumns(nextColumns, "Time column added to Supabase");
    if (!activeId) {
      toast.success("Time column added. Save the timetable to store it.");
    }
  };

  const addTimeColumn = () => {
    const focusedIndex = focusedTimeColumnId
      ? customTimeColumns.findIndex((column) => column.id === focusedTimeColumnId)
      : -1;
    addTimeColumnAt(focusedIndex >= 0 ? focusedIndex + 1 : customTimeColumns.length);
  };

  const moveTimeColumn = async (columnId: string, targetIndex: number) => {
    const sourceIndex = customTimeColumns.findIndex((column) => column.id === columnId);
    if (sourceIndex < 0) return;

    const withoutColumn = customTimeColumns.filter((column) => column.id !== columnId);
    const nextIndex = Math.max(0, Math.min(targetIndex, withoutColumn.length));
    const nextColumns = [
      ...withoutColumn.slice(0, nextIndex),
      customTimeColumns[sourceIndex],
      ...withoutColumn.slice(nextIndex),
    ];
    if (nextColumns.every((column, index) => column.id === customTimeColumns[index]?.id)) return;

    setFocusedTimeColumnId(columnId);
    setHasUnsavedChanges(true);
    if (activeId) {
      await persistTimeColumns(nextColumns, "Time column order saved to Supabase");
    } else {
      setCustomTimeColumns(nextColumns);
      toast.success("Time column order updated. Save the timetable to store it.");
    }
    triggerAutoSave();
  };

  const handleTimeColumnDrop = async (targetColumnId: string) => {
    if (!draggedTimeColumnId || draggedTimeColumnId === targetColumnId) {
      setDraggedTimeColumnId(null);
      setDragOverTimeColumnId(null);
      return;
    }

    const sourceIndex = customTimeColumns.findIndex((column) => column.id === draggedTimeColumnId);
    const targetIndex = customTimeColumns.findIndex((column) => column.id === targetColumnId);
    if (sourceIndex >= 0 && targetIndex >= 0) {
      await moveTimeColumn(draggedTimeColumnId, targetIndex);
    }
    setDraggedTimeColumnId(null);
    setDragOverTimeColumnId(null);
  };

  const handleDragStart = (event: React.DragEvent, columnId: string) => {
    setDraggedTimeColumnId(columnId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", columnId);
    event.dataTransfer.setDragImage(event.currentTarget as HTMLElement, 20, 20);
  };

  const handleDragOver = (event: React.DragEvent, columnId: string) => {
    if (!draggedTimeColumnId || draggedTimeColumnId === columnId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverTimeColumnId(columnId);
  };

  const handleDragLeave = (columnId: string) => {
    if (dragOverTimeColumnId === columnId) {
      setDragOverTimeColumnId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTimeColumnId(null);
    setDragOverTimeColumnId(null);
  };

  const updateTimeColumnDraft = (column: TimeColumn, field: "start" | "end", value: string) => {
    setTimeColumnDrafts((drafts) => ({
      ...drafts,
      [column.id]: {
        start: drafts[column.id]?.start ?? column.start,
        end: drafts[column.id]?.end ?? column.end,
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const saveTimeColumn = async (column: TimeColumn) => {
    const draft = timeColumnDrafts[column.id] ?? { start: column.start, end: column.end };
    if (!draft.start || !draft.end || draft.start >= draft.end) {
      toast.error("End time must be after start time");
      return;
    }

    const updatedColumn = { ...column, start: draft.start, end: draft.end };
    const hasColumn = customTimeColumns.some((item) => item.id === column.id);
    const nextColumns = hasColumn
      ? customTimeColumns.map((item) => (item.id === column.id ? updatedColumn : item))
      : [...customTimeColumns, updatedColumn];
    setCustomTimeColumns(nextColumns);
    setSlots((items) => items.map((slot) => (
      slot.start_time === column.start && slot.end_time === column.end
        ? { ...slot, start_time: draft.start, end_time: draft.end }
        : slot
    )));
    setTimeColumnDrafts((drafts) => {
      const next = { ...drafts };
      delete next[column.id];
      return next;
    });
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success(activeId ? "Time column saved to Supabase" : "Time column saved. Save the timetable to store it.");
  };

  const removeTimeColumn = async (column: TimeColumn) => {
    if (customTimeColumns.length <= 1) {
      toast.error("Keep at least one time column.");
      return;
    }
    const hasSlots = slots.some((slot) => slot.start_time === column.start && slot.end_time === column.end);
    if (hasSlots) {
      toast.error("Move or delete slots in this time column before removing it.");
      return;
    }

    const nextColumns = customTimeColumns.filter((item) => item.id !== column.id);
    setCustomTimeColumns(nextColumns);
    setTimeColumnDrafts((drafts) => {
      const next = { ...drafts };
      delete next[column.id];
      return next;
    });
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success(activeId ? "Time column removed from Supabase" : "Time column removed");
  };

  const loadSlots = useCallback(async (timetableId: string) => {
    setSlotsLoading(true);
    const { data, error } = await supabase
      .from("manual_timetable_slots")
      .select("*")
      .eq("timetable_id", timetableId)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      toast.error(error.message);
      setSlots([]);
    } else {
      setSlots((data ?? []) as Slot[]);
    }
    setSlotsLoading(false);
  }, []);

  const selectTimetable = useCallback((item: Timetable, shouldLoad = true) => {
    setActiveId(item.id);
    setMeta({
      title: item.title,
      faculty_id: item.faculty_id ?? "",
      department_id: item.department_id ?? "",
      level: item.level,
      semester: item.semester,
      academic_year: item.academic_year,
      notes: item.notes ?? "",
    });
    if (shouldLoad) {
      loadSlots(item.id);
      loadTimeColumns(item.id);
    }
  }, [loadSlots, loadTimeColumns]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadWarning(null);
    const [facultiesRes, departmentsRes, hallsRes, lecturersRes, timetablesRes] = await Promise.all([
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
      supabase.from("halls").select("id, name, capacity, location").order("name"),
      supabase.from("profiles").select("id, full_name, email, role").eq("role", "lecturer").order("full_name"),
      supabase.from("manual_timetables").select("*").order("updated_at", { ascending: false }),
    ]);

    const coreError = [facultiesRes, departmentsRes, hallsRes].find((res) => res.error)?.error;
    if (coreError) {
      toast.error(coreError.message);
      setLoading(false);
      return;
    }

    const loadedFaculties = (facultiesRes.data ?? []) as Faculty[];
    const loadedDepartments = (departmentsRes.data ?? []) as Department[];
    const facultyByDepartment = new Map(loadedDepartments.map((department) => [department.id, department.faculty_id]));

    const coursesWithFacultyRes = await supabase
      .from("courses")
      .select("id, course_code, course_title, department_id, faculty_id")
      .order("course_code");
    const coursesRes = coursesWithFacultyRes.error
      ? await supabase.from("courses").select("id, course_code, course_title, department_id").order("course_code")
      : coursesWithFacultyRes;
    if (coursesRes.error) {
      toast.error(coursesRes.error.message);
    }

    setFaculties(loadedFaculties);
    setDepartments(loadedDepartments);
    setCourses(((coursesRes.data ?? []) as Partial<Course>[]).map((course) => ({
      id: course.id ?? "",
      course_code: course.course_code ?? "",
      course_title: course.course_title ?? null,
      department_id: course.department_id ?? "",
      faculty_id: course.faculty_id ?? facultyByDepartment.get(course.department_id ?? "") ?? null,
    })));
    setHalls((hallsRes.data ?? []) as Hall[]);
    if (lecturersRes.error) {
      setLecturers([]);
      setLoadWarning("Lecturers could not be loaded, but you can still create timetable slots.");
    } else {
      setLecturers((lecturersRes.data ?? []) as Lecturer[]);
    }

    const manualSchemaReady = !timetablesRes.error;
    setSchemaReady(manualSchemaReady);
    if (timetablesRes.error) {
      setLoadWarning("Manual timetable save tables are not available yet. Dropdowns will work, but saving needs the Supabase migration applied.");
      setTimetables([]);
    }
    const loadedTimetables = manualSchemaReady ? (timetablesRes.data ?? []) as Timetable[] : [];
    setTimetables(loadedTimetables);

    if (loadedTimetables[0]) {
      selectTimetable(loadedTimetables[0], false);
      await loadSlots(loadedTimetables[0].id);
      await loadTimeColumns(loadedTimetables[0].id);
    } else {
      const firstFaculty = loadedFaculties[0]?.id ?? "";
      const firstDepartment = firstFaculty
        ? loadedDepartments.find((department) => department.faculty_id === firstFaculty)?.id ?? ""
        : loadedDepartments[0]?.id ?? "";
      setMeta((current) => ({
        ...current,
        faculty_id: firstFaculty,
        department_id: firstDepartment,
      }));
      setCustomTimeColumns(DEFAULT_TIME_COLUMNS);
      setTimeColumnDrafts({});
    }
    setLoading(false);
  }, [loadSlots, loadTimeColumns, selectTimetable]);

  useEffect(() => {
    load();
  }, [load]);

  const selectFaculty = (facultyId: string) => {
    const nextFacultyId = facultyId === EMPTY ? "" : facultyId;
    const nextDepartments = nextFacultyId
      ? departments.filter((department) => department.faculty_id === nextFacultyId)
      : departments;
    const nextDepartmentId = nextDepartments[0]?.id ?? "";

    setMeta((current) => ({
      ...current,
      faculty_id: nextFacultyId,
      department_id: nextDepartmentId,
    }));
    setSearch("");
    toast.info(nextDepartmentId ? "Departments and courses updated" : "No departments found for this faculty");
  };

  const selectDepartment = (departmentId: string) => {
    setMeta((current) => ({
      ...current,
      department_id: departmentId === EMPTY ? "" : departmentId,
    }));
    setSearch("");
  };

  const selectLevel = (level: string) => {
    setMeta((current) => ({ ...current, level }));
    setSearch("");
    toast.info(`Courses filtered to level ${level}`);
  };

  const resetForNew = () => {
    const firstFaculty = faculties[0]?.id ?? "";
    const firstDepartment = firstFaculty
      ? departments.find((department) => department.faculty_id === firstFaculty)?.id ?? ""
      : departments[0]?.id ?? "";
    setActiveId(null);
    setSlots([]);
    setMeta({
      title: "Manual Teaching Timetable",
      faculty_id: firstFaculty,
      department_id: firstDepartment,
      level: "300",
      semester: "First",
      academic_year: "2025/2026",
      notes: "",
    });
    setCustomTimeColumns(DEFAULT_TIME_COLUMNS);
    setTimeColumnDrafts({});
    toast.info("Ready for a new timetable");
  };

  const validateMeta = () => {
    if (!meta.title.trim()) {
      toast.error("Timetable title is required");
      return false;
    }
    if (!meta.department_id) {
      toast.error("Select a department");
      return false;
    }
    if (!meta.faculty_id) {
      toast.error("Select a faculty");
      return false;
    }
    return true;
  };

  const saveTimetable = async (status: "draft" | "published") => {
    if (!schemaReady) {
      toast.error("Apply the manual timetable Supabase migration before saving.");
      return;
    }
    if (!validateMeta()) return;
    if (status === "published" && conflicts.length > 0) {
      toast.error("Resolve conflicts before publishing");
      return;
    }

    setSaving(true);
    const payload = {
      title: meta.title.trim(),
      faculty_id: meta.faculty_id || null,
      department_id: meta.department_id || null,
      level: meta.level,
      semester: meta.semester,
      academic_year: meta.academic_year.trim(),
      notes: meta.notes.trim() || null,
      status,
      created_by: activeTimetable?.created_by ?? user?.id ?? null,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    let timetableId = activeId;
    if (activeId) {
      const { data, error } = await supabase
        .from("manual_timetables")
        .update(payload)
        .eq("id", activeId)
        .select("*")
        .single();
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
      setTimetables((items) => items.map((item) => (item.id === data.id ? (data as Timetable) : item)));
    } else {
      const { data, error } = await supabase
        .from("manual_timetables")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
      timetableId = data.id;
      setActiveId(data.id);
      setTimetables((items) => [data as Timetable, ...items]);
    }

    if (timetableId) {
      const timeColumnsSaved = await saveTimeColumnsForTimetable(timetableId, customTimeColumns);
      if (!timeColumnsSaved) {
        setSaving(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("manual_timetable_slots")
        .delete()
        .eq("timetable_id", timetableId);

      if (deleteError) {
        setSaving(false);
        toast.error(deleteError.message);
        return;
      }

      if (slots.length > 0) {
        const inserts = slots.map((slot) => ({
          timetable_id: timetableId,
          course_id: slot.course_id,
          lecturer_id: slot.lecturer_id,
          hall_id: slot.hall_id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          slot_type: slot.slot_type,
          color: slot.color,
          notes: slot.notes,
        }));
        const { error: insertError } = await supabase.from("manual_timetable_slots").insert(inserts);
        if (insertError) {
          setSaving(false);
          toast.error(insertError.message);
          return;
        }
      }
      await loadSlots(timetableId);
    }

    setSaving(false);
    toast.success(status === "published" ? "Timetable published" : "Timetable saved");
  };

  const openSlot = (slot?: Slot) => {
    setEditingSlot(slot ? { ...slot } : newSlot());
    setSlotOpen(true);
  };

  const upsertSlot = () => {
    const draft = editingSlot;
    if (!draft.course_id) return toast.error("Choose a course");
    if (draft.start_time >= draft.end_time) return toast.error("End time must be after start time");

    if (draft.id) {
      setSlots((items) => items.map((item) => (item.id === draft.id ? ({ ...item, ...draft } as Slot) : item)));
      toast.success("Slot updated");
    } else {
      setSlots((items) => [
        ...items,
        { ...draft, id: `draft-${Date.now()}`, timetable_id: activeId ?? "draft" } as Slot,
      ]);
      toast.success("Slot added");
    }
    setSlotOpen(false);
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      saveAllTimeColumns();
    }, 2000);
    setAutoSaveTimeout(timeout);
  };

  useEffect(() => {
    if (hasUnsavedChanges && activeId) {
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [hasUnsavedChanges, activeId]);

  const cloneSlot = (slot: Slot) => {
    setSlots((items) => [
      ...items,
      { ...slot, id: `draft-${Date.now()}`, notes: slot.notes ? `${slot.notes} (copy)` : null },
    ]);
    toast.success("Slot cloned");
  };

  const removeSlot = () => {
    if (!deleteSlotId) return;
    setSlots((items) => items.filter((slot) => slot.id !== deleteSlotId));
    setDeleteSlotId(null);
    toast.success("Slot removed");
  };

  const deleteTimetable = async () => {
    if (!activeId) return;
    setSaving(true);
    const { error } = await supabase.from("manual_timetables").delete().eq("id", activeId);
    setSaving(false);
    setDeleteTimetableOpen(false);
    if (error) return toast.error(error.message);
    const next = timetables.filter((item) => item.id !== activeId);
    setTimetables(next);
    if (next[0]) selectTimetable(next[0]);
    else resetForNew();
    toast.success("Timetable deleted");
  };

  const validateNow = () => {
    if (conflicts.length === 0) toast.success("No room, lecturer, or course overlaps found");
    else toast.warning(`${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} found`);
  };

  const exportCsv = () => {
    const rows = [
      ["Day", "Start", "End", "Course", "Lecturer", "Hall", "Type", "Notes"],
      ...sortedSlots.map((slot) => [
        slot.day_of_week,
        slot.start_time,
        slot.end_time,
        courseLabel(slot, coursesById),
        lecturersById.get(slot.lecturer_id ?? "")?.full_name ?? "",
        hallsById.get(slot.hall_id ?? "")?.name ?? "",
        slot.slot_type,
        slot.notes ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meta.title.trim().replace(/\s+/g, "-").toLowerCase() || "manual-timetable"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading timetable workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Manual Timetable Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create, validate, save, and publish department timetables directly from Supabase data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={resetForNew}>
            <FilePlus2 className="h-4 w-4" /> New
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={validateNow}>
            <CheckCircle2 className="h-4 w-4" /> Validate
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={exportCsv} disabled={slots.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            className="rounded-xl relative overflow-hidden" 
            onClick={saveAllTimeColumns} 
            disabled={saving || !activeId || isAutoSaving}
          >
            {isAutoSaving && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
            )}
            {(saving || isAutoSaving) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Time Columns
            {hasUnsavedChanges && <Badge variant="secondary" className="ml-2 h-5 text-xs">Unsaved</Badge>}
            {isAutoSaving && <span className="ml-2 text-xs opacity-70">(Auto-saving...)</span>}
          </Button>
          <Button className="rounded-xl" onClick={() => saveTimetable("draft")} disabled={saving || !schemaReady}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          <Button className="rounded-xl gradient-deep text-primary-foreground" onClick={() => saveTimetable("published")} disabled={saving || !schemaReady}>
            <Send className="h-4 w-4" /> Publish
          </Button>
        </div>
      </div>

      {loadWarning && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft/40 p-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Heads up:</span> {loadWarning}
        </div>
      )}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setDetailsCollapsed((value) => !value)}
                  title={detailsCollapsed ? "Expand timetable details" : "Collapse timetable details"}
                  aria-label={detailsCollapsed ? "Expand timetable details" : "Collapse timetable details"}
                  aria-expanded={!detailsCollapsed}
                >
                  {detailsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <h2 className="font-display text-lg font-semibold">Timetable Details</h2>
              </div>
              <div className="flex items-center gap-2">
                {activeTimetable && (
                  <Badge variant={activeTimetable.status === "published" ? "default" : "secondary"}>
                    {activeTimetable.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className={cn("mt-4 space-y-4", detailsCollapsed && "hidden")}>
              <Field label="Title">
                <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Faculty">
                <Select value={meta.faculty_id || EMPTY} onValueChange={selectFaculty}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Select faculty</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>{faculty.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department">
                <Select value={meta.department_id || EMPTY} onValueChange={selectDepartment}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Select department</SelectItem>
                    {facultyDepartments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {facultyDepartments.length} department{facultyDepartments.length === 1 ? "" : "s"} available for the selected faculty.
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Level">
                  <Select value={meta.level} onValueChange={selectLevel}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Semester">
                  <Select value={meta.semester} onValueChange={(value) => setMeta({ ...meta, semester: value })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((semester) => <SelectItem key={semester} value={semester}>{semester}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Academic Year">
                <Input value={meta.academic_year} onChange={(e) => setMeta({ ...meta, academic_year: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Notes">
                <Textarea value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} className="min-h-20 rounded-xl" />
              </Field>
              {activeId && (
                <Button variant="destructive" className="w-full rounded-xl" onClick={() => setDeleteTimetableOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Delete Timetable
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setSavedCollapsed((value) => !value)}
                  title={savedCollapsed ? "Expand saved timetables" : "Collapse saved timetables"}
                  aria-label={savedCollapsed ? "Expand saved timetables" : "Collapse saved timetables"}
                  aria-expanded={!savedCollapsed}
                >
                  {savedCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <h2 className="font-display text-lg font-semibold">Saved Timetables</h2>
              </div>
              <span className="text-xs text-muted-foreground">{timetables.length}</span>
            </div>
            <div className={cn("mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1", savedCollapsed && "hidden")}>
              {timetables.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No saved timetables yet.
                </p>
              ) : timetables.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTimetable(item)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-smooth hover:bg-primary-soft/40",
                    activeId === item.id ? "border-primary bg-primary-soft/50" : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
                    <Badge variant={item.status === "published" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {faculties.find((faculty) => faculty.id === item.faculty_id)?.name ?? "Faculty not set"} · {item.level} · {item.semester}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Slots" value={slots.length} sub={`${visibleDays.length} days visible`} />
            <SummaryCard label="Conflicts" value={conflicts.length} sub={conflicts.length ? "Needs attention" : "Clear"} warning={conflicts.length > 0} />
            <SummaryCard label="Eligible Courses" value={filteredCourses.length} sub={`Level ${meta.level} in selection`} />
          </section>

          <section
            ref={gridSectionRef}
            className={cn(
              "min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card",
              isGridFullscreen && "h-screen overflow-auto rounded-none border-0 p-6 shadow-none",
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">Schedule Grid</h2>
                  <p className="text-xs text-muted-foreground">Add slots, then validate before publishing.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search eligible courses..."
                    className="h-10 w-56 rounded-xl pl-9"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <Switch checked={showWeekends} onCheckedChange={setShowWeekends} />
                  Saturday
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={toggleGridFullscreen}
                  title={isGridFullscreen ? "Exit fullscreen" : "View fullscreen"}
                  aria-label={isGridFullscreen ? "Exit fullscreen" : "View fullscreen"}
                >
                  {isGridFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={addTimeColumn}>
                  <Plus className="h-4 w-4" /> Time Column
                </Button>
                <Button className="rounded-xl" onClick={() => openSlot()}>
                  <Plus className="h-4 w-4" /> Add Slot
                </Button>
              </div>
            </div>

            {slotsLoading ? (
              <div className="flex min-h-[360px] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading slots...
              </div>
            ) : (
              <div className="relative mt-5 w-full max-w-full overflow-x-auto rounded-xl border border-border">
                <div
                  className="grid w-full bg-card"
                  style={{
                    gridTemplateColumns: `140px repeat(${timeColumns.length}, minmax(280px, 1fr))`,
                    minWidth: `${140 + timeColumns.length * 280}px`,
                  }}
                >
                  <div className="sticky left-0 top-0 z-30 border-b border-r border-border bg-card p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-[1px_0_0_hsl(var(--border))]">
                    Day
                  </div>
                  {timeColumns.map((time) => {
                    const draft = timeColumnDrafts[time.id] ?? { start: time.start, end: time.end };
                    const isChanged = draft.start !== time.start || draft.end !== time.end;
                    const customIndex = customTimeColumns.findIndex((column) => column.id === time.id);
                    const isCustomColumn = customIndex >= 0;
                    const canMoveLeft = customIndex > 0;
                    const canMoveRight = customIndex >= 0 && customIndex < customTimeColumns.length - 1;
                    return (
                    <div
                      key={time.id}
                      draggable={isCustomColumn}
                      onDragStart={(event) => {
                        if (!isCustomColumn) return;
                        handleDragStart(event, time.id);
                      }}
                      onDragOver={(event) => {
                        handleDragOver(event, time.id);
                      }}
                      onDragLeave={() => {
                        handleDragLeave(time.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleTimeColumnDrop(time.id);
                      }}
                      onDragEnd={() => {
                        handleDragEnd();
                      }}
                      onClick={() => setFocusedTimeColumnId(time.id)}
                      onFocus={() => setFocusedTimeColumnId(time.id)}
                      className={cn(
                        "sticky top-0 z-10 border-b border-r border-border bg-card p-2 last:border-r-0 transition-all duration-500 ease-in-out transform",
                        isCustomColumn && "cursor-grab active:cursor-grabbing hover:shadow-lg",
                        draggedTimeColumnId === time.id 
                          ? "opacity-40 scale-95 ring-4 ring-primary ring-offset-2 bg-primary/20 shadow-xl animate-pulse" 
                          : dragOverTimeColumnId === time.id 
                            ? "ring-4 ring-primary ring-offset-2 scale-105 bg-primary/10 shadow-xl translate-x-2" 
                            : draggedTimeColumnId && draggedTimeColumnId !== time.id 
                              ? "transition-transform duration-500 ease-in-out" 
                              : "",
                        focusedTimeColumnId === time.id && !draggedTimeColumnId && "ring-2 ring-primary/50 ring-offset-1",
                      )}
                      style={{
                        transitionProperty: 'transform, opacity, box-shadow, background-color',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-lg text-muted-foreground",
                            draggedTimeColumnId === time.id && "bg-primary text-primary-foreground animate-pulse",
                          )}
                          disabled={!isCustomColumn}
                          title={isCustomColumn ? "Drag to reorder time column" : "Save this slot time before reordering"}
                          aria-label={isCustomColumn ? `Drag ${timeLabel(time)} time column` : `Cannot drag ${timeLabel(time)} time column`}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="time"
                          value={draft.start}
                          onChange={(event) => updateTimeColumnDraft(time, "start", event.target.value)}
                          className="h-8 w-[86px] rounded-lg bg-card px-2 text-xs"
                          aria-label={`Start time for ${timeLabel(time)}`}
                        />
                        <span className="text-xs font-semibold text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={draft.end}
                          onChange={(event) => updateTimeColumnDraft(time, "end", event.target.value)}
                          className="h-8 w-[86px] rounded-lg bg-card px-2 text-xs"
                          aria-label={`End time for ${timeLabel(time)}`}
                        />
                        <Button
                          variant={isChanged ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => {}}
                          title={hasUnsavedChanges ? "Will be saved with Save All or auto-save" : "No changes to save"}
                          aria-label={`Time column ${timeLabel(time)} auto-saves`}
                          disabled
                        >
                          <Save className={cn("h-3.5 w-3.5", hasUnsavedChanges ? "opacity-100 animate-pulse" : "opacity-50")} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              title="Time column actions"
                              aria-label={`Actions for ${timeLabel(time)} time column`}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => addTimeColumnAt(isCustomColumn ? customIndex : customTimeColumns.length)}>
                              Add before
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => addTimeColumnAt(isCustomColumn ? customIndex + 1 : customTimeColumns.length)}>
                              Add after
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!canMoveLeft} onSelect={() => moveTimeColumn(time.id, customIndex - 1)}>
                              Move left
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!canMoveRight} onSelect={() => moveTimeColumn(time.id, customIndex + 1)}>
                              Move right
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!canMoveLeft} onSelect={() => moveTimeColumn(time.id, 0)}>
                              Move to start
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!canMoveRight} onSelect={() => moveTimeColumn(time.id, customTimeColumns.length - 1)}>
                              Move to end
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => removeTimeColumn(time)}
                          title="Remove time column"
                          aria-label={`Remove ${timeLabel(time)} time column`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                  {visibleDays.map((day) => (
                    <div key={day} className="contents">
                      <div className="sticky left-0 z-20 flex min-h-[150px] items-center border-b border-r border-border bg-card p-3 text-sm font-bold shadow-[1px_0_0_hsl(var(--border))]">
                        {day}
                      </div>
                      {timeColumns.map((time) => {
                        const cellSlots = sortedSlots.filter((slot) => (
                          slot.day_of_week === day && slot.start_time === time.start && slot.end_time === time.end
                        ));
                        return (
                          <div key={`${day}-${time.id}`} className="min-h-[150px] border-b border-r border-border bg-secondary/10 p-2 last:border-r-0">
                            {cellSlots.length === 0 ? (
                              <button
                                onClick={() => {
                                  setEditingSlot({ ...newSlot(), day_of_week: day, start_time: time.start, end_time: time.end });
                                  setSlotOpen(true);
                                }}
                                className="flex h-full min-h-[126px] w-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground transition-smooth hover:border-primary hover:bg-primary-soft/30 hover:text-primary"
                              >
                                Add slot
                              </button>
                            ) : (
                              <div className="space-y-2">
                                {cellSlots.map((slot) => (
                                  <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    course={courseLabel(slot, coursesById)}
                                    lecturer={lecturersById.get(slot.lecturer_id ?? "")?.full_name}
                                    hall={hallsById.get(slot.hall_id ?? "")?.name}
                                    conflicted={conflicts.some((conflict) => conflict.slotIds.includes(slot.id))}
                                    onEdit={() => openSlot(slot)}
                                    onClone={() => cloneSlot(slot)}
                                    onDelete={() => setDeleteSlotId(slot.id)}
                                  />
                                ))}
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
          </section>

          {conflicts.length > 0 && (
            <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider">Conflicts to Resolve</h2>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                    <p className="font-semibold">{conflict.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{conflict.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <SlotDialog
        open={slotOpen}
        onOpenChange={setSlotOpen}
        draft={editingSlot}
        setDraft={setEditingSlot}
        courses={filteredCourses}
        lecturers={lecturers}
        halls={halls}
        onSave={upsertSlot}
      />

      <AlertDialog open={Boolean(deleteSlotId)} onOpenChange={(open) => !open && setDeleteSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>This removes the slot from the draft. Save the timetable to persist the change.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={removeSlot}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTimetableOpen} onOpenChange={setDeleteTimetableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete timetable?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes the timetable and all its slots from Supabase.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteTimetable}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const SummaryCard = ({ label, value, sub, warning }: { label: string; value: number; sub: string; warning?: boolean }) => (
  <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-card border-l-4", warning ? "border-l-destructive" : "border-l-primary")}>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={cn("mt-2 font-display text-3xl font-bold", warning && "text-destructive")}>{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

const SlotCard = ({
  slot,
  course,
  lecturer,
  hall,
  conflicted,
  onEdit,
  onClone,
  onDelete,
}: {
  slot: Slot;
  course: string;
  lecturer?: string;
  hall?: string;
  conflicted: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}) => (
  <article className={cn("rounded-xl border border-l-4 p-3 shadow-sm", colorClasses[slot.color], conflicted && "ring-1 ring-destructive")}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground">{slot.start_time} - {slot.end_time}</p>
        <p className="mt-1 text-sm font-bold leading-tight">{course}</p>
      </div>
      {conflicted && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{lecturer ?? "No lecturer"} · {hall ?? "No hall"}</p>
    <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{slot.slot_type}</p>
    {slot.notes && <p className="mt-2 rounded-lg bg-card/70 p-2 text-xs text-muted-foreground">{slot.notes}</p>}
    <div className="mt-3 flex justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onEdit}><Edit3 className="h-3.5 w-3.5" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onClone}><Copy className="h-3.5 w-3.5" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  </article>
);

const SlotDialog = ({
  open,
  onOpenChange,
  draft,
  setDraft,
  courses,
  lecturers,
  halls,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: SlotDraft;
  setDraft: (draft: SlotDraft) => void;
  courses: Course[];
  lecturers: Lecturer[];
  halls: Hall[];
  onSave: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl rounded-2xl">
      <DialogHeader>
        <DialogTitle>{draft.id ? "Edit slot" : "Add slot"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <Field label="Course">
          <Select value={draft.course_id ?? EMPTY} onValueChange={(value) => setDraft({ ...draft, course_id: value === EMPTY ? null : value })}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY}>Choose course</SelectItem>
              {courses.length === 0 ? (
                <SelectItem value="no-courses" disabled>No eligible courses found</SelectItem>
              ) : courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>{course.course_code} · {course.course_title ?? "Untitled"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Day">
            <Select value={draft.day_of_week} onValueChange={(value) => setDraft({ ...draft, day_of_week: value as DayName })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Start">
            <Input type="time" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} className="rounded-xl" />
          </Field>
          <Field label="End">
            <Input type="time" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} className="rounded-xl" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lecturer">
            <Select value={draft.lecturer_id ?? EMPTY} onValueChange={(value) => setDraft({ ...draft, lecturer_id: value === EMPTY ? null : value })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Optional lecturer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>No lecturer</SelectItem>
                {lecturers.map((lecturer) => <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hall">
            <Select value={draft.hall_id ?? EMPTY} onValueChange={(value) => setDraft({ ...draft, hall_id: value === EMPTY ? null : value })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Optional hall" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>No hall</SelectItem>
                {halls.map((hall) => <SelectItem key={hall.id} value={hall.id}>{hall.name}{hall.capacity ? ` · ${hall.capacity}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <Select value={draft.slot_type} onValueChange={(value) => setDraft({ ...draft, slot_type: value })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{SLOT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Color">
            <Select value={draft.color} onValueChange={(value) => setDraft({ ...draft, color: value as SlotColor })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{COLORS.map((color) => <SelectItem key={color} value={color}>{color}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })} className="min-h-20 rounded-xl" />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button className="rounded-xl" onClick={onSave}>
          <Save className="h-4 w-4" /> Save Slot
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

type Conflict = { id: string; title: string; message: string; slotIds: string[] };

const detectConflicts = (slots: Slot[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (a.day_of_week !== b.day_of_week || !overlaps(a, b)) continue;
      if (a.hall_id && a.hall_id === b.hall_id) {
        conflicts.push({
          id: `hall-${a.id}-${b.id}`,
          title: "Hall overlap",
          message: `${a.day_of_week} ${a.start_time}-${a.end_time}: two slots use the same hall.`,
          slotIds: [a.id, b.id],
        });
      }
      if (a.lecturer_id && a.lecturer_id === b.lecturer_id) {
        conflicts.push({
          id: `lecturer-${a.id}-${b.id}`,
          title: "Lecturer overlap",
          message: `${a.day_of_week} ${a.start_time}-${a.end_time}: lecturer is double-booked.`,
          slotIds: [a.id, b.id],
        });
      }
      if (a.course_id && a.course_id === b.course_id) {
        conflicts.push({
          id: `course-${a.id}-${b.id}`,
          title: "Course overlap",
          message: `${a.day_of_week} ${a.start_time}-${a.end_time}: course appears in overlapping slots.`,
          slotIds: [a.id, b.id],
        });
      }
    }
  }
  return conflicts;
};

const overlaps = (a: Slot, b: Slot) => a.start_time < b.end_time && b.start_time < a.end_time;

const courseLevel = (code: string) => {
  const match = code.match(/\d/);
  if (!match) return "Masters";
  return `${match[0]}00`;
};

const courseLabel = (slot: Slot | SlotDraft, coursesById: Map<string, Course>) => {
  const course = coursesById.get(slot.course_id ?? "");
  if (!course) return "Unassigned course";
  return `${course.course_code} · ${course.course_title ?? "Untitled"}`;
};

const normalizeTimeInput = (value: string) => value.slice(0, 5);

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const timeLabel = (column: TimeColumn) => `${column.start} - ${column.end}`;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default ManualTimetable;
