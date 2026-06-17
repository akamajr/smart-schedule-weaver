"use client";

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
  MoreVertical,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { detectGlobalConflicts, GlobalConflict } from "@/lib/conflicts";
import { useGlobalConflicts } from "@/hooks/useGlobalConflicts";

type Department = { id: string; name: string; faculty_id: string };
type Faculty = { id: string; name: string };
type Course = {
  id: string;
  course_code: string;
  course_title: string | null;
  department_id: string;
  faculty_id: string | null;
};
type Hall = {
  id: string;
  name: string;
  capacity: number | null;
  location: string | null;
};
type Lecturer = { id: string; full_name: string; email: string; role: string };
type Timetable = {
  id: string;
  title: string;
  faculty_id: string | null;
  department_id: string | null;
  level: string;
  semester: string;
  academic_year: string;
  start_date: string;
  type: string;
  header_text: string | null;
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
  course_ids: string[] | null;
  lecturer_id: string | null;
  lecturer_ids: string[] | null;
  hall_id: string | null;
  hall_ids: string[] | null;
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
type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";
type SlotColor = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
type TimeColumn = { id: string; start: string; end: string };
type TimeColumnRow = {
  id: string;
  timetable_id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
};
type TimetableMeta = {
  title: string;
  faculty_id: string;
  department_id: string;
  scope: "department" | "faculty";
  level: string;
  semester: string;
  academic_year: string;
  document_start_date: string;
  type: string;
  header_text: string;
  notes: string;
};

const DAYS: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const LEVELS = ["100", "200", "300", "400", "500", "Masters"];
const SEMESTERS = ["First", "Second", "Resit"];
const TIMETABLE_TYPES = ["Lectures", "Exams", "Tutorials", "Resit"];
const COLORS: SlotColor[] = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "sky",
  "violet",
];
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
  course_ids: null,
  lecturer_id: null,
  lecturer_ids: null,
  hall_id: null,
  hall_ids: null,
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
  const [deleteTimetableId, setDeleteTimetableId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [showWeekends, setShowWeekends] = useState(true);
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"details" | "saved">("details");
  const [customTimeColumns, setCustomTimeColumns] =
    useState<TimeColumn[]>(DEFAULT_TIME_COLUMNS);
  const [timeColumnDrafts, setTimeColumnDrafts] = useState<
    Record<string, Pick<TimeColumn, "start" | "end">>
  >({});
  const [focusedTimeColumnId, setFocusedTimeColumnId] = useState<string | null>(
    null,
  );
  const [draggedTimeColumnId, setDraggedTimeColumnId] = useState<string | null>(
    null,
  );
  const [dragOverTimeColumnId, setDragOverTimeColumnId] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "document">("grid");
  const gridSectionRef = useRef<HTMLElement | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [meta, setMeta] = useState<TimetableMeta>({
    title: "Manual Teaching Timetable",
    faculty_id: "",
    department_id: "",
    scope: "department",
    level: "300",
    semester: "First",
    academic_year: "2025/2026",
    document_start_date: "2026-01-27",
    type: "Lectures",
    header_text: defaultTimetableHeader("First", "2025/2026", "Lectures"),
    notes: "",
  });

  const slotsRef = useRef<Slot[]>(slots);
  const metaRef = useRef(meta);
  const customTimeColumnsRef = useRef<TimeColumn[]>(customTimeColumns);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  useEffect(() => {
    customTimeColumnsRef.current = customTimeColumns;
  }, [customTimeColumns]);

  const activeTimetable = useMemo(
    () => timetables.find((item) => item.id === activeId) ?? null,
    [activeId, timetables],
  );

  const visibleDays = showWeekends ? DAYS : DAYS.slice(0, 5);

  const coursesById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses],
  );
  const hallsById = useMemo(
    () => new Map(halls.map((hall) => [hall.id, hall])),
    [halls],
  );
  const lecturersById = useMemo(
    () => new Map(lecturers.map((lecturer) => [lecturer.id, lecturer])),
    [lecturers],
  );

  const facultyDepartments = useMemo(() => {
    if (!meta.faculty_id) return departments;
    return departments.filter(
      (department) => department.faculty_id === meta.faculty_id,
    );
  }, [departments, meta.faculty_id]);

  const filteredCourses = useMemo(() => {
    const term = search.toLowerCase().trim();
    const facultyId = meta.faculty_id;
    const departmentId = meta.department_id;
    return courses.filter((course) => {
      const matchesFaculty = !facultyId || course.faculty_id === facultyId;
      const matchesDepartment =
        meta.scope === "faculty" ? true : !departmentId || course.department_id === departmentId;
      const matchesLevel = courseLevel(course.course_code) === meta.level;
      const haystack =
        `${course.course_code} ${course.course_title ?? ""}`.toLowerCase();
      return (
        matchesFaculty &&
        matchesDepartment &&
        matchesLevel &&
        (!term || haystack.includes(term))
      );
    });
  }, [courses, meta.department_id, meta.faculty_id, meta.level, meta.scope, search]);

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
    slotColumns.sort(
      (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
    );
    return [...customTimeColumns, ...slotColumns];
  }, [customTimeColumns, sortedSlots]);

  const { conflicts } = useGlobalConflicts(slots, activeId ?? undefined);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsGridFullscreen(
        document.fullscreenElement === gridSectionRef.current,
      );
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
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
    setCustomTimeColumns(
      loadedColumns.length ? loadedColumns : DEFAULT_TIME_COLUMNS,
    );
    setTimeColumnDrafts({});
  }, []);

  const saveTimeColumnsForTimetable = async (
    timetableId: string,
    columns: TimeColumn[],
  ) => {
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

    setCustomTimeColumns(
      ((data ?? []) as TimeColumnRow[]).map((column) => ({
        id: column.id,
        start: normalizeTimeInput(column.start_time),
        end: normalizeTimeInput(column.end_time),
      })),
    );
    return true;
  };

  const persistTimeColumns = async (
    columns: TimeColumn[],
    savedMessage: string,
  ) => {
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
      const draft = timeColumnDrafts[col.id] ?? {
        start: col.start,
        end: col.end,
      };
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
      const duration = Math.max(
        30,
        timeToMinutes(targetColumn.end) - timeToMinutes(targetColumn.start),
      );
      const endMinutes = timeToMinutes(targetColumn.start);
      const startMinutes = Math.max(0, endMinutes - duration);
      if (startMinutes < endMinutes) {
        return {
          start: minutesToTime(startMinutes),
          end: minutesToTime(endMinutes),
        };
      }
    }

    const lastColumn = columns[columns.length - 1];
    const startMinutes = timeToMinutes(lastColumn.end);
    const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59);
    if (startMinutes < endMinutes) {
      return {
        start: minutesToTime(startMinutes),
        end: minutesToTime(endMinutes),
      };
    }

    return { start: lastColumn.start, end: lastColumn.end };
  };

  const addTimeColumnAt = async (insertIndex: number) => {
    const targetIndex = Math.max(
      0,
      Math.min(insertIndex, customTimeColumns.length),
    );
    const { start, end } = createTimeColumnNear(customTimeColumns, targetIndex);
    const nextColumn = { id: `time-${Date.now()}`, start, end };
    const nextColumns = [
      ...customTimeColumns.slice(0, targetIndex),
      nextColumn,
      ...customTimeColumns.slice(targetIndex),
    ];
    setFocusedTimeColumnId(nextColumn.id);
    setTimeColumnDrafts((drafts) => ({
      ...drafts,
      [nextColumn.id]: { start, end },
    }));
    await persistTimeColumns(nextColumns, "Time column added to Supabase");
    if (!activeId) {
      toast.success("Time column added. Save the timetable to store it.");
    }
  };

  const addTimeColumn = () => {
    const focusedIndex = focusedTimeColumnId
      ? customTimeColumns.findIndex(
        (column) => column.id === focusedTimeColumnId,
      )
      : -1;
    addTimeColumnAt(
      focusedIndex >= 0 ? focusedIndex + 1 : customTimeColumns.length,
    );
  };

  const moveTimeColumn = async (columnId: string, targetIndex: number) => {
    const sourceIndex = customTimeColumns.findIndex(
      (column) => column.id === columnId,
    );
    if (sourceIndex < 0) return;

    const withoutColumn = customTimeColumns.filter(
      (column) => column.id !== columnId,
    );
    const nextIndex = Math.max(0, Math.min(targetIndex, withoutColumn.length));
    const nextColumns = [
      ...withoutColumn.slice(0, nextIndex),
      customTimeColumns[sourceIndex],
      ...withoutColumn.slice(nextIndex),
    ];
    if (
      nextColumns.every(
        (column, index) => column.id === customTimeColumns[index]?.id,
      )
    )
      return;

    setFocusedTimeColumnId(columnId);
    setHasUnsavedChanges(true);
    if (activeId) {
      await persistTimeColumns(
        nextColumns,
        "Time column order saved to Supabase",
      );
    } else {
      setCustomTimeColumns(nextColumns);
      toast.success(
        "Time column order updated. Save the timetable to store it.",
      );
    }
    triggerAutoSave();
  };

  const handleTimeColumnDrop = async (targetColumnId: string) => {
    if (!draggedTimeColumnId || draggedTimeColumnId === targetColumnId) {
      setDraggedTimeColumnId(null);
      setDragOverTimeColumnId(null);
      return;
    }

    const sourceIndex = customTimeColumns.findIndex(
      (column) => column.id === draggedTimeColumnId,
    );
    const targetIndex = customTimeColumns.findIndex(
      (column) => column.id === targetColumnId,
    );
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

  const updateTimeColumnDraft = (
    column: TimeColumn,
    field: "start" | "end",
    value: string,
  ) => {
    setTimeColumnDrafts((drafts) => ({
      ...drafts,
      [column.id]: {
        start: drafts[column.id]?.start ?? column.start,
        end: drafts[column.id]?.end ?? column.end,
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
    triggerAutoSave();
  };

  const saveTimeColumn = async (column: TimeColumn) => {
    const draft = timeColumnDrafts[column.id] ?? {
      start: column.start,
      end: column.end,
    };
    if (!draft.start || !draft.end || draft.start >= draft.end) {
      toast.error("End time must be after start time");
      return;
    }

    const updatedColumn = { ...column, start: draft.start, end: draft.end };
    const hasColumn = customTimeColumns.some((item) => item.id === column.id);
    const nextColumns = hasColumn
      ? customTimeColumns.map((item) =>
        item.id === column.id ? updatedColumn : item,
      )
      : [...customTimeColumns, updatedColumn];
    setCustomTimeColumns(nextColumns);
    setSlots((items) =>
      items.map((slot) =>
        slot.start_time === column.start && slot.end_time === column.end
          ? { ...slot, start_time: draft.start, end_time: draft.end }
          : slot,
      ),
    );
    setTimeColumnDrafts((drafts) => {
      const next = { ...drafts };
      delete next[column.id];
      return next;
    });
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success(
      activeId
        ? "Time column saved to Supabase"
        : "Time column saved. Save the timetable to store it.",
    );
  };

  const removeTimeColumn = async (column: TimeColumn) => {
    if (customTimeColumns.length <= 1) {
      toast.error("Keep at least one time column.");
      return;
    }
    const hasSlots = slots.some(
      (slot) =>
        slot.start_time === column.start && slot.end_time === column.end,
    );
    if (hasSlots) {
      toast.error(
        "Move or delete slots in this time column before removing it.",
      );
      return;
    }

    const nextColumns = customTimeColumns.filter(
      (item) => item.id !== column.id,
    );
    setCustomTimeColumns(nextColumns);
    setTimeColumnDrafts((drafts) => {
      const next = { ...drafts };
      delete next[column.id];
      return next;
    });
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success(
      activeId ? "Time column removed from Supabase" : "Time column removed",
    );
  };

  const loadSlots = useCallback(async (timetableId: string, silent = false) => {
    if (!silent) setSlotsLoading(true);
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
      setSlots(((data ?? []) as Slot[]).map(normalizeSlotTimes));
    }
    if (!silent) setSlotsLoading(false);
  }, []);

  const selectTimetable = useCallback(
    (item: Timetable, shouldLoad = true) => {
      setActiveId(item.id);
      setMeta({
        title: item.title,
        faculty_id: item.faculty_id ?? "",
        department_id: item.department_id ?? "",
        scope: item.department_id ? "department" : "faculty",
        level: item.level,
        semester: item.semester,
        academic_year: item.academic_year,
        document_start_date: item.start_date ?? "2026-01-27",
        type: item.type ?? "Lectures",
        header_text:
          item.header_text ??
          defaultTimetableHeader(item.semester, item.academic_year, item.type ?? "Lectures"),
        notes: item.notes ?? "",
      });
      if (shouldLoad) {
        loadSlots(item.id);
        loadTimeColumns(item.id);
      }
    },
    [loadSlots, loadTimeColumns],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadWarning(null);
    const [
      facultiesRes,
      departmentsRes,
      hallsRes,
      lecturersRes,
      timetablesRes,
    ] = await Promise.all([
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, name, faculty_id").order("name"),
      supabase
        .from("halls")
        .select("id, name, capacity, location")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "lecturer")
        .order("full_name"),
      supabase
        .from("manual_timetables")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

    const coreError = [facultiesRes, departmentsRes, hallsRes].find(
      (res) => res.error,
    )?.error;
    if (coreError) {
      toast.error(coreError.message);
      setLoading(false);
      return;
    }

    const loadedFaculties = (facultiesRes.data ?? []) as Faculty[];
    const loadedDepartments = (departmentsRes.data ?? []) as Department[];
    const facultyByDepartment = new Map(
      loadedDepartments.map((department) => [
        department.id,
        department.faculty_id,
      ]),
    );

    const coursesWithFacultyRes = await supabase
      .from("courses")
      .select("id, course_code, course_title, department_id, faculty_id")
      .order("course_code");
    const coursesRes = coursesWithFacultyRes.error
      ? await supabase
        .from("courses")
        .select("id, course_code, course_title, department_id")
        .order("course_code")
      : coursesWithFacultyRes;
    if (coursesRes.error) {
      toast.error(coursesRes.error.message);
    }

    setFaculties(loadedFaculties);
    setDepartments(loadedDepartments);
    setCourses(
      ((coursesRes.data ?? []) as Partial<Course>[]).map((course) => ({
        id: course.id ?? "",
        course_code: course.course_code ?? "",
        course_title: course.course_title ?? null,
        department_id: course.department_id ?? "",
        faculty_id:
          course.faculty_id ??
          facultyByDepartment.get(course.department_id ?? "") ??
          null,
      })),
    );
    setHalls((hallsRes.data ?? []) as Hall[]);
    if (lecturersRes.error) {
      setLecturers([]);
      setLoadWarning(
        "Lecturers could not be loaded, but you can still create timetable slots.",
      );
    } else {
      setLecturers((lecturersRes.data ?? []) as Lecturer[]);
    }

    const manualSchemaReady = !timetablesRes.error;
    setSchemaReady(manualSchemaReady);
    if (timetablesRes.error) {
      setLoadWarning(
        "Manual timetable save tables are not available yet. Dropdowns will work, but saving needs the Supabase migration applied.",
      );
      setTimetables([]);
    }
    const loadedTimetables = manualSchemaReady
      ? ((timetablesRes.data ?? []) as Timetable[])
      : [];
    setTimetables(loadedTimetables);

    const firstFaculty = loadedFaculties[0]?.id ?? "";
    const firstDepartment = firstFaculty
      ? (loadedDepartments.find(
        (department) => department.faculty_id === firstFaculty,
      )?.id ?? "")
      : (loadedDepartments[0]?.id ?? "");
    setMeta((current) => ({
      ...current,
      faculty_id: firstFaculty,
      department_id: firstDepartment,
      scope: "department",
    }));
    setCustomTimeColumns(DEFAULT_TIME_COLUMNS);
    setTimeColumnDrafts({});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectFaculty = (facultyId: string) => {
    const nextFacultyId = facultyId === EMPTY ? "" : facultyId;
    const nextDepartments = nextFacultyId
      ? departments.filter(
        (department) => department.faculty_id === nextFacultyId,
      )
      : departments;
    const nextDepartmentId = nextDepartments[0]?.id ?? "";

    setMeta((current) => ({
      ...current,
      faculty_id: nextFacultyId,
      department_id: nextDepartmentId,
      scope: nextFacultyId ? current.scope : "department",
    }));
    setSearch("");
    toast.info(
      nextDepartmentId
        ? "Departments and courses updated"
        : "No departments found for this faculty",
    );
  };

  const selectDepartment = (departmentId: string) => {
    setMeta((current) => {
      const nextDeptId = departmentId === EMPTY ? "" : departmentId;
      // If we are already in faculty scope, don't force a switch to department scope.
      // The department dropdown is disabled in faculty scope anyway, so any trigger
      // is likely an automatic cascade from the UI library when options change.
      const newScope = current.scope === "faculty" ? "faculty" : (nextDeptId === "" ? "faculty" : "department");
      return {
        ...current,
        department_id: nextDeptId,
        scope: newScope,
      };
    });
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
      ? (departments.find(
        (department) => department.faculty_id === firstFaculty,
      )?.id ?? "")
      : (departments[0]?.id ?? "");
    setActiveId(null);
    setSlots([]);
    setMeta({
      title: "Manual Teaching Timetable",
      faculty_id: firstFaculty,
      department_id: firstDepartment,
      scope: "department",
      level: "300",
      semester: "First",
      academic_year: "2025/2026",
      document_start_date: "2026-01-27",
      type: "Lectures",
      header_text: defaultTimetableHeader("First", "2025/2026", "Lectures"),
      notes: "",
    });
    setCustomTimeColumns(DEFAULT_TIME_COLUMNS);
    setTimeColumnDrafts({});
    toast.info("Ready for a new timetable");
  };

  const validateMeta = () => {
    const currentMeta = metaRef.current;
    if (!currentMeta.title.trim()) {
      toast.error("Timetable title is required");
      return false;
    }
    if (!currentMeta.faculty_id) {
      toast.error("Select a faculty");
      return false;
    }
    if (currentMeta.scope === "department" && !currentMeta.department_id) {
      toast.error("Select a department or switch to faculty scope");
      return false;
    }
    return true;
  };

  const saveTimetable = async (
    status: "draft" | "published",
    options: { auto?: boolean; silent?: boolean; forceNew?: boolean } = {},
  ) => {
    const isAuto = options.auto ?? false;
    const silent = options.silent ?? false;
    const forceNew = options.forceNew ?? false;

    if (!schemaReady) {
      if (!silent)
        toast.error(
          "Apply the manual timetable Supabase migration before saving.",
        );
      return false;
    }
    if (!validateMeta()) return false;
    if (status === "published" && conflicts.length > 0) {
      if (!silent) toast.error("Resolve conflicts before publishing");
      return false;
    }

    setSaving(true);
    if (isAuto) setIsAutoSaving(true);

    const currentMeta = metaRef.current;
    const payload = {
      title: forceNew
        ? `${currentMeta.title.trim()} (Copy)`
        : currentMeta.title.trim(),
      faculty_id: currentMeta.faculty_id || null,
      department_id: currentMeta.department_id || null,
      level: currentMeta.level,
      semester: currentMeta.semester,
      academic_year: currentMeta.academic_year.trim(),
      start_date: currentMeta.document_start_date,
      type: currentMeta.type,
      header_text: currentMeta.header_text.trim() || null,
      notes: currentMeta.notes.trim() || null,
      status,
      created_by: forceNew
        ? (user?.id ?? null)
        : (activeTimetable?.created_by ?? user?.id ?? null),
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    let timetableId = forceNew ? null : activeId;
    if (timetableId) {
      const { data, error } = await supabase
        .from("manual_timetables")
        .update(payload)
        .eq("id", timetableId)
        .select("*")
        .single();
      if (error) {
        setSaving(false);
        if (isAuto) setIsAutoSaving(false);
        if (!silent) toast.error(error.message);
        return false;
      }
      setTimetables((items) =>
        items.map((item) => (item.id === data.id ? (data as Timetable) : item)),
      );
    } else {
      const { data, error } = await supabase
        .from("manual_timetables")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        setSaving(false);
        if (isAuto) setIsAutoSaving(false);
        if (!silent) toast.error(error.message);
        return false;
      }
      timetableId = data.id;
      setActiveId(data.id);
      setTimetables((items) => [data as Timetable, ...items]);
      if (forceNew) {
        setMeta((current) => ({
          ...current,
          title: payload.title,
          scope: payload.department_id ? "department" : "faculty",
        }));
      }
    }

    if (timetableId) {
      const columnsToSave = customTimeColumnsRef.current;
      const timeColumnsSaved = await saveTimeColumnsForTimetable(
        timetableId,
        columnsToSave,
      );
      if (!timeColumnsSaved) {
        setSaving(false);
        if (isAuto) setIsAutoSaving(false);
        return false;
      }

      // If we are updating an existing timetable (not forceNew copy), clean up its old slots
      if (!forceNew) {
        const { error: deleteError } = await supabase
          .from("manual_timetable_slots")
          .delete()
          .eq("timetable_id", timetableId);

        if (deleteError) {
          setSaving(false);
          if (isAuto) setIsAutoSaving(false);
          if (!silent) toast.error(deleteError.message);
          return false;
        }
      }

      const slotsToSave = slotsRef.current;
      if (slotsToSave.length > 0) {
        const inserts = slotsToSave.map((slot) => {
          const courseIds = normalizeIds(slot.course_ids, slot.course_id);
          const lecturerIds = normalizeIds(slot.lecturer_ids, slot.lecturer_id);
          const hallIds = normalizeIds(slot.hall_ids, slot.hall_id);
          return {
            timetable_id: timetableId,
            course_id: courseIds[0] ?? null,
            course_ids: courseIds.length ? courseIds : null,
            lecturer_id: lecturerIds[0] ?? null,
            lecturer_ids: lecturerIds.length ? lecturerIds : null,
            hall_id: hallIds[0] ?? null,
            hall_ids: hallIds.length ? hallIds : null,
            day_of_week: slot.day_of_week,
            start_time: normalizeTimeInput(slot.start_time),
            end_time: normalizeTimeInput(slot.end_time),
            slot_type: slot.slot_type,
            color: slot.color,
            notes: slot.notes,
          };
        });
        const { error: insertError } = await supabase
          .from("manual_timetable_slots")
          .insert(inserts);
        if (insertError) {
          setSaving(false);
          if (isAuto) setIsAutoSaving(false);
          if (!silent) toast.error(insertError.message);
          return false;
        }
      }
      // Load slots SILENTLY during saving to prevent flashing
      await loadSlots(timetableId, true);
    }

    setSaving(false);
    if (isAuto) setIsAutoSaving(false);
    setHasUnsavedChanges(false);
    if (!silent) {
      toast.success(
        forceNew
          ? "Timetable duplicated successfully as a new draft!"
          : status === "published"
            ? "Timetable published"
            : "Timetable saved",
      );
    }
    return true;
  };

  const openSlot = (slot?: Slot) => {
    setEditingSlot(slot ? { ...slot } : newSlot());
    setSlotOpen(true);
  };

  const openNewSlotAt = (day: DayName, start_time: string, end_time: string) => {
    setEditingSlot({
      ...newSlot(),
      day_of_week: day,
      start_time,
      end_time,
    });
    setSlotOpen(true);
  };

  const upsertSlot = () => {
    const courseIds = normalizeIds(editingSlot.course_ids, editingSlot.course_id);
    const lecturerIds = normalizeIds(
      editingSlot.lecturer_ids,
      editingSlot.lecturer_id,
    );
    const hallIds = normalizeIds(editingSlot.hall_ids, editingSlot.hall_id);
    const draft = {
      ...editingSlot,
      course_id: courseIds[0] ?? null,
      course_ids: courseIds.length ? courseIds : null,
      lecturer_id: lecturerIds[0] ?? null,
      lecturer_ids: lecturerIds.length ? lecturerIds : null,
      hall_id: hallIds[0] ?? null,
      hall_ids: hallIds.length ? hallIds : null,
      slot_type:
        metaRef.current.type === "Exams"
          ? "Exam"
          : metaRef.current.type.replace(/s$/, ""),
      start_time: normalizeTimeInput(editingSlot.start_time),
      end_time: normalizeTimeInput(editingSlot.end_time),
    };
    if (!courseIds.length) return toast.error("Choose at least one course");
    if (draft.start_time >= draft.end_time)
      return toast.error("End time must be after start time");

    if (draft.id) {
      const courseId = courseIds[0] ?? null;
      setSlots((items) =>
        items.map((item) =>
          item.id === draft.id
            ? ({
              ...item,
              ...draft,
              course_id: courseId,
              course_ids: courseId ? [courseId] : null,
            } as Slot)
            : item,
        ),
      );
      toast.success("Slot updated");
    } else {
      const timestamp = Date.now();
      setSlots((items) => [
        ...items,
        ...courseIds.map(
          (courseId, index) =>
            ({
              ...draft,
              id: `draft-${timestamp}-${index}`,
              timetable_id: activeId ?? "draft",
              course_id: courseId,
              course_ids: [courseId],
            }) as Slot,
        ),
      ]);
      toast.success(
        courseIds.length === 1
          ? "Slot added"
          : `${courseIds.length} slots added`,
      );
    }
    setSlotOpen(false);
    setHasUnsavedChanges(true);
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (activeId) {
        saveTimetable("draft", { auto: true, silent: true });
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const cloneSlot = (slot: Slot) => {
    setSlots((items) => [
      ...items,
      {
        ...slot,
        id: `draft-${Date.now()}`,
        notes: slot.notes ? `${slot.notes} (copy)` : null,
      },
    ]);
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success("Slot cloned");
  };

  const removeSlot = () => {
    if (!deleteSlotId) return;
    setSlots((items) => items.filter((slot) => slot.id !== deleteSlotId));
    setDeleteSlotId(null);
    setHasUnsavedChanges(true);
    triggerAutoSave();
    toast.success("Slot removed");
  };

  const requestDeleteTimetable = (id: string) => {
    setDeleteTimetableId(id);
    setDeleteTimetableOpen(true);
  };

  const deleteTimetable = async () => {
    const targetId = deleteTimetableId ?? activeId;
    if (!targetId) return;
    setSaving(true);
    const { error } = await supabase
      .from("manual_timetables")
      .delete()
      .eq("id", targetId);
    setSaving(false);
    setDeleteTimetableOpen(false);
    setDeleteTimetableId(null);
    if (error) return toast.error(error.message);
    const next = timetables.filter((item) => item.id !== targetId);
    setTimetables(next);
    if (targetId === activeId) {
      if (next[0]) selectTimetable(next[0]);
      else resetForNew();
    }
    toast.success("Timetable deleted");
  };

  const viewSavedTimetable = (item: Timetable) => {
    selectTimetable(item);
    toast.info(`Viewing ${item.title}`);
  };

  const updateSavedTimetable = (item: Timetable) => {
    selectTimetable(item);
    setDetailsCollapsed(false);
    toast.info(`Editing ${item.title}`);
  };

  const validateNow = () => {
    if (conflicts.length === 0)
      toast.success("No room, lecturer, or course overlaps found");
    else
      toast.warning(
        `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} found`,
      );
  };

  const exportCsv = () => {
    const rows = [
      ["Day", "Start", "End", "Course", "Lecturer", "Hall", "Type", "Notes"],
      ...sortedSlots.map((slot) => [
        slot.day_of_week,
        slot.start_time,
        slot.end_time,
        courseLabel(slot, coursesById),
        lecturerNames(slot, lecturersById),
        hallNames(slot, hallsById),
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
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Manual Timetable Builder
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create, validate, save, and publish department timetables directly
            from Supabase data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={resetForNew}
          >
            <FilePlus2 className="h-4 w-4" /> New
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={validateNow}
          >
            <CheckCircle2 className="h-4 w-4" /> Validate
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={exportCsv}
            disabled={slots.length === 0}
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => window.print()}
          >
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
            {saving || isAutoSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Time Columns
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="ml-2 h-5 text-xs">
                Unsaved
              </Badge>
            )}
            {isAutoSaving && (
              <span className="ml-2 text-xs opacity-70">(Auto-saving...)</span>
            )}
          </Button>
          {activeId && (
            <Button
              variant="outline"
              className="rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary-soft/35"
              onClick={() => saveTimetable("draft", { forceNew: true })}
              disabled={saving || !schemaReady}
            >
              <Copy className="h-4 w-4 mr-2" /> Save As Copy
            </Button>
          )}
          <Button
            className="rounded-xl"
            onClick={() => saveTimetable("draft")}
            disabled={saving || !schemaReady}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            className="rounded-xl gradient-deep text-primary-foreground"
            onClick={() => saveTimetable("published")}
            disabled={saving || !schemaReady}
          >
            <Send className="h-4 w-4" /> Publish
          </Button>
        </div>
      </div>

      {loadWarning && (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft/40 p-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Heads up:</span>{" "}
          {loadWarning}
        </div>
      )}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[auto,minmax(0,1fr)]">
        <aside className="flex min-w-0 gap-3 overflow-x-auto pb-1 xl:overflow-visible">
          <section
            className={cn(
              "shrink-0 rounded-2xl border border-border bg-card shadow-card transition-all",
              detailsCollapsed
                ? "w-12 p-2"
                : "w-[min(360px,calc(100vw-2rem))] p-5",
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex items-center gap-2",
                  detailsCollapsed && "flex-col",
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setDetailsCollapsed((value) => !value)}
                  title={
                    detailsCollapsed
                      ? "Expand timetable details"
                      : "Collapse timetable details"
                  }
                  aria-label={
                    detailsCollapsed
                      ? "Expand timetable details"
                      : "Collapse timetable details"
                  }
                  aria-expanded={!detailsCollapsed}
                >
                  {detailsCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <h2
                  className={cn(
                    "font-display text-lg font-semibold",
                    detailsCollapsed &&
                      "mt-2 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-sm",
                  )}
                >
                  Timetable
                </h2>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2",
                  detailsCollapsed && "hidden",
                )}
              >
                {activeTimetable && (
                  <Badge
                    variant={
                      activeTimetable.status === "published"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {activeTimetable.status}
                  </Badge>
                )}
                {activeId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        title="Timetable actions"
                        aria-label="Timetable actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => requestDeleteTimetable(activeId)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete timetable
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <div className={cn("mt-4", detailsCollapsed && "hidden")}>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/40 p-1">
                {(["details", "saved"] as const).map((tab) => (
                  <Button
                    key={tab}
                    type="button"
                    variant={sidebarTab === tab ? "secondary" : "ghost"}
                    className="h-9 rounded-lg text-xs font-semibold capitalize"
                    onClick={() => setSidebarTab(tab)}
                  >
                    {tab === "details"
                      ? "Details"
                      : `Saved (${timetables.length})`}
                  </Button>
                ))}
              </div>
            </div>
            <div
              className={cn(
                "mt-4 space-y-4",
                (detailsCollapsed || sidebarTab !== "details") && "hidden",
              )}
            >
              <Field label="Title">
                <Input
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  className="rounded-xl"
                />
              </Field>
              <Field label="Type">
                <Select
                  value={meta.type}
                  onValueChange={(value) =>
                    setMeta((current) =>
                      withAutoHeader(current, { type: value }),
                    )
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMETABLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Faculty">
                <Select
                  value={meta.faculty_id || EMPTY}
                  onValueChange={selectFaculty}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Select faculty</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Scope">
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/40 p-1">
                  {(["department", "faculty"] as const).map((scope) => (
                    <Button
                      key={scope}
                      type="button"
                      variant={meta.scope === scope ? "secondary" : "ghost"}
                      className="h-9 rounded-lg text-xs font-semibold capitalize"
                      onClick={() =>
                        setMeta((current) => ({
                          ...current,
                          scope,
                          department_id:
                            scope === "faculty" ? "" : current.department_id,
                        }))
                      }
                    >
                      {scope}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field label="Department">
                <Select
                  value={meta.department_id || EMPTY}
                  onValueChange={selectDepartment}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Select department</SelectItem>
                    {facultyDepartments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {facultyDepartments.length} department
                  {facultyDepartments.length === 1 ? "" : "s"} available for the
                  selected faculty.
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Level">
                  <Select value={meta.level} onValueChange={selectLevel}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Semester">
                  <Select
                    value={meta.semester}
                    onValueChange={(value) =>
                      setMeta((current) =>
                        withAutoHeader(current, { semester: value }),
                      )
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Academic Year">
                <Input
                  value={meta.academic_year}
                  onChange={(e) =>
                    setMeta((current) =>
                      withAutoHeader(current, {
                        academic_year: e.target.value,
                      }),
                    )
                  }
                  className="rounded-xl"
                />
              </Field>
              <Field label="Document Start Date">
                <Input
                  type="date"
                  value={meta.document_start_date}
                  onChange={(e) =>
                    setMeta((current) => ({
                      ...current,
                      document_start_date: e.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
              </Field>
              <Field label="Timetable Header">
                <Textarea
                  value={meta.header_text}
                  onChange={(e) =>
                    setMeta((current) => ({
                      ...current,
                      header_text: e.target.value,
                    }))
                  }
                  className="min-h-44 rounded-xl font-mono text-xs leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    This text appears above the timetable exactly line by line.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg"
                    onClick={() =>
                      setMeta((current) => ({
                        ...current,
                        header_text: defaultTimetableHeader(
                          current.semester,
                          current.academic_year,
                          current.type,
                        ),
                      }))
                    }
                  >
                    Reset Header
                  </Button>
                </div>
              </Field>
              <Field label="Notes">
                <Textarea
                  value={meta.notes}
                  onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
                  className="min-h-20 rounded-xl"
                />
              </Field>
            </div>
            <div
              className={cn(
                "mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1",
                (detailsCollapsed || sidebarTab !== "saved") && "hidden",
              )}
            >
              {timetables.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No saved timetables yet.
                </p>
              ) : (
                timetables.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "w-full rounded-xl border p-3 transition-smooth hover:bg-primary-soft/40",
                      activeId === item.id
                        ? "border-primary bg-primary-soft/50"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => viewSavedTimetable(item)}
                        title={`View ${item.title}`}
                      >
                        <p className="line-clamp-2 text-sm font-semibold">
                          {item.title}
                        </p>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge
                          variant={
                            item.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              aria-label={`Actions for ${item.title}`}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onSelect={() => viewSavedTimetable(item)}
                            >
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => updateSavedTimetable(item)}
                            >
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => requestDeleteTimetable(item.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {faculties.find(
                        (faculty) => faculty.id === item.faculty_id,
                      )?.name ?? "Faculty not set"}{" "}
                      · {item.level} · {item.semester}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Slots"
              value={slots.length}
              sub={`${visibleDays.length} days visible`}
            />
            <SummaryCard
              label="Conflicts"
              value={conflicts.length}
              sub={conflicts.length ? "Needs attention" : "Clear"}
              warning={conflicts.length > 0}
            />
            <SummaryCard
              label="Eligible Courses"
              value={filteredCourses.length}
              sub={`Level ${meta.level} in selection`}
            />
          </section>

          <section
            ref={gridSectionRef}
            className={cn(
              "min-w-0 rounded-2xl border border-border bg-card p-4 shadow-card",
              isGridFullscreen &&
                "h-screen overflow-auto rounded-none border-0 p-6 shadow-none",
            )}
          >
            {isGridFullscreen && <SonnerToaster position="top-right" />}
            {viewMode === "grid" && <TimetableNoticeHeader headerText={meta.header_text} />}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {viewMode === "grid"
                      ? "Schedule Grid"
                      : "Timetable Document"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {viewMode === "grid"
                      ? "Add slots, then validate before publishing."
                      : "Document-style timetable view for printing and review."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid grid-cols-2 rounded-xl border border-border bg-secondary/40 p-1">
                  <Button
                    type="button"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    className="h-9 rounded-lg text-xs font-semibold"
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "document" ? "secondary" : "ghost"}
                    className="h-9 rounded-lg text-xs font-semibold"
                    onClick={() => setViewMode("document")}
                  >
                    Document
                  </Button>
                </div>
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
                  <Switch
                    checked={showWeekends}
                    onCheckedChange={setShowWeekends}
                  />
                  Saturday
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={toggleGridFullscreen}
                  title={
                    isGridFullscreen ? "Exit fullscreen" : "View fullscreen"
                  }
                  aria-label={
                    isGridFullscreen ? "Exit fullscreen" : "View fullscreen"
                  }
                >
                  {isGridFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={addTimeColumn}
                >
                  <Plus className="h-4 w-4" /> Time Column
                </Button>
                <Button className="rounded-xl" onClick={() => openSlot()}>
                  <Plus className="h-4 w-4" /> Add Slot
                </Button>
              </div>
            </div>

            {slotsLoading ? (
              <div className="flex min-h-[360px] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading
                slots...
              </div>
            ) : viewMode === "grid" ? (
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
                    const draft = timeColumnDrafts[time.id] ?? {
                      start: time.start,
                      end: time.end,
                    };
                    const isChanged =
                      draft.start !== time.start || draft.end !== time.end;
                    const customIndex = customTimeColumns.findIndex(
                      (column) => column.id === time.id,
                    );
                    const isCustomColumn = customIndex >= 0;
                    const canMoveLeft = customIndex > 0;
                    const canMoveRight =
                      customIndex >= 0 &&
                      customIndex < customTimeColumns.length - 1;
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
                          isCustomColumn &&
                            "cursor-grab active:cursor-grabbing hover:shadow-lg",
                          draggedTimeColumnId === time.id
                            ? "opacity-40 scale-95 ring-4 ring-primary ring-offset-2 bg-primary/20 shadow-xl animate-pulse"
                            : dragOverTimeColumnId === time.id
                              ? "ring-4 ring-primary ring-offset-2 scale-105 bg-primary/10 shadow-xl translate-x-2"
                              : draggedTimeColumnId &&
                                  draggedTimeColumnId !== time.id
                                ? "transition-transform duration-500 ease-in-out"
                                : "",
                          focusedTimeColumnId === time.id &&
                            !draggedTimeColumnId &&
                            "ring-2 ring-primary/50 ring-offset-1",
                        )}
                        style={{
                          transitionProperty:
                            "transform, opacity, box-shadow, background-color",
                        }}
                      >
                        <div className="flex min-w-0 flex-nowrap items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 shrink-0 rounded-lg text-muted-foreground",
                              draggedTimeColumnId === time.id &&
                                "bg-primary text-primary-foreground animate-pulse",
                            )}
                            disabled={!isCustomColumn}
                            title={
                              isCustomColumn
                                ? "Drag to reorder time column"
                                : "Save this slot time before reordering"
                            }
                            aria-label={
                              isCustomColumn
                                ? `Drag ${timeLabel(time)} time column`
                                : `Cannot drag ${timeLabel(time)} time column`
                            }
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="time"
                            value={draft.start}
                            onChange={(event) =>
                              updateTimeColumnDraft(
                                time,
                                "start",
                                event.target.value,
                              )
                            }
                            className="h-7 w-[78px] shrink-0 rounded-lg bg-card px-1.5 text-xs"
                            aria-label={`Start time for ${timeLabel(time)}`}
                          />
                          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                            -
                          </span>
                          <Input
                            type="time"
                            value={draft.end}
                            onChange={(event) =>
                              updateTimeColumnDraft(
                                time,
                                "end",
                                event.target.value,
                              )
                            }
                            className="h-7 w-[78px] shrink-0 rounded-lg bg-card px-1.5 text-xs"
                            aria-label={`End time for ${timeLabel(time)}`}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 rounded-lg"
                                title="Time column actions"
                                aria-label={`Actions for ${timeLabel(time)} time column`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {isChanged && (
                                <>
                                  <DropdownMenuItem
                                    onSelect={() => saveTimeColumn(time)}
                                  >
                                    Save time range
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onSelect={() =>
                                  addTimeColumnAt(
                                    isCustomColumn
                                      ? customIndex
                                      : customTimeColumns.length,
                                  )
                                }
                              >
                                Add before
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  addTimeColumnAt(
                                    isCustomColumn
                                      ? customIndex + 1
                                      : customTimeColumns.length,
                                  )
                                }
                              >
                                Add after
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={!canMoveLeft}
                                onSelect={() =>
                                  moveTimeColumn(time.id, customIndex - 1)
                                }
                              >
                                Move left
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canMoveRight}
                                onSelect={() =>
                                  moveTimeColumn(time.id, customIndex + 1)
                                }
                              >
                                Move right
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canMoveLeft}
                                onSelect={() => moveTimeColumn(time.id, 0)}
                              >
                                Move to start
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canMoveRight}
                                onSelect={() =>
                                  moveTimeColumn(
                                    time.id,
                                    customTimeColumns.length - 1,
                                  )
                                }
                              >
                                Move to end
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => removeTimeColumn(time)}
                              >
                                Delete column
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                        const cellSlots = sortedSlots.filter(
                          (slot) =>
                            slot.day_of_week === day &&
                            slot.start_time === time.start &&
                            slot.end_time === time.end,
                        );
                        return (
                          <div
                            key={`${day}-${time.id}`}
                            className="group/cell relative min-h-[150px] border-b border-r border-border bg-secondary/10 p-2 last:border-r-0"
                          >
                            {cellSlots.length === 0 ? (
                              <button
                                onClick={() =>
                                  openNewSlotAt(day, time.start, time.end)
                                }
                                className="flex h-full min-h-[126px] w-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground transition-smooth hover:border-primary hover:bg-primary-soft/30 hover:text-primary"
                              >
                                Add slot
                              </button>
                            ) : (
                              <div className="flex min-h-[126px] flex-1 flex-col gap-2">
                                {cellSlots.map((slot) => (
                                  <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    compact={cellSlots.length > 1}
                                    fillCell={cellSlots.length === 1}
                                    courses={courseCodes(slot, coursesById)}
                                    lecturers={lecturerNames(
                                      slot,
                                      lecturersById,
                                    )}
                                    halls={hallNames(slot, hallsById)}
                                    conflicted={conflicts.some((conflict) =>
                                      conflict.slotIds.includes(slot.id),
                                    )}
                                    onEdit={() => openSlot(slot)}
                                    onClone={() => cloneSlot(slot)}
                                    onDelete={() => setDeleteSlotId(slot.id)}
                                  />
                                ))}
                                <button
                                  onClick={() =>
                                    openNewSlotAt(day, time.start, time.end)
                                  }
                                  className="absolute left-2 top-2 flex h-8 items-center justify-center rounded-lg border border-dashed border-border bg-background/95 px-3 text-[11px] font-semibold text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-smooth hover:border-primary hover:bg-primary-soft hover:text-primary group-hover/cell:opacity-100 focus-visible:opacity-100"
                                >
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Add slot
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DocumentTimetableView
                meta={meta}
                faculties={faculties}
                departments={departments}
                slots={sortedSlots}
                coursesById={coursesById}
                hallsById={hallsById}
                lecturersById={lecturersById}
                onAddSlot={() => openSlot()}
                onEditSlot={openSlot}
                onDeleteSlot={(slotId) => setDeleteSlotId(slotId)}
              />
            )}
          </section>

          {conflicts.length > 0 && (
            <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider">
                  Conflicts to Resolve
                </h2>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    <p className="font-semibold">{conflict.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {conflict.description}
                    </p>
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

      <AlertDialog
        open={Boolean(deleteSlotId)}
        onOpenChange={(open) => !open && setDeleteSlotId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the slot from the draft. Save the timetable to
              persist the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={removeSlot}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTimetableOpen}
        onOpenChange={setDeleteTimetableOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete timetable?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the timetable and all its slots from
              Supabase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteTimetable}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const SummaryCard = ({
  label,
  value,
  sub,
  warning,
}: {
  label: string;
  value: number;
  sub: string;
  warning?: boolean;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-border bg-card p-4 shadow-card border-l-4",
      warning ? "border-l-destructive" : "border-l-primary",
    )}
  >
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <p
      className={cn(
        "mt-2 font-display text-3xl font-bold",
        warning && "text-destructive",
      )}
    >
      {value}
    </p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

const TimetableNoticeHeader = ({ headerText }: { headerText: string }) => (
  <section className="mb-5 rounded-xl border border-border bg-background px-4 py-5 text-center font-semibold uppercase tracking-wide text-foreground">
    {headerText.split(/\r?\n/).map((line, index) => (
      <p
        key={`${index}-${line}`}
        className={cn(
          "mx-auto max-w-5xl whitespace-pre-wrap break-words text-xs leading-relaxed md:text-sm",
          index === 0 && "text-lg font-black tracking-wider md:text-xl",
          line.includes("***") && "overflow-hidden whitespace-nowrap text-[11px] tracking-widest text-muted-foreground md:text-xs",
          index > 0 && "mt-1",
        )}
      >
        {line || "\u00a0"}
      </p>
    ))}
  </section>
);

const SlotCard = ({
  slot,
  compact,
  fillCell,
  courses,
  lecturers,
  halls,
  conflicted,
  onEdit,
  onClone,
  onDelete,
}: {
  slot: Slot;
  compact: boolean;
  fillCell: boolean;
  courses: string[];
  lecturers: string;
  halls: string;
  conflicted: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}) => (
  <article
    className={cn(
      "rounded-xl border border-l-4 shadow-sm",
      fillCell
        ? "flex min-h-[126px] flex-1 items-center p-3"
        : compact
          ? "p-2"
          : "p-3",
      colorClasses[slot.color],
      conflicted && "ring-1 ring-destructive",
    )}
  >
    <div className="flex w-full items-start justify-between gap-2">
      <div className="min-w-0 flex-1 space-y-3 text-center">
        {(courses.length ? courses : ["Unassigned course"]).map((course) => (
          <div key={course}>
            <p
              className={cn(
                "font-black leading-tight text-foreground",
                fillCell ? "text-sm" : compact ? "text-xs" : "text-sm",
              )}
            >
              {course}
            </p>
            <p
              className={cn(
                "mt-1 font-medium leading-snug text-foreground",
                fillCell ? "text-xs" : compact ? "text-[11px]" : "text-xs",
              )}
            >
              {lecturers || "No lecturer"}
            </p>
            <p
              className={cn(
                "font-medium leading-snug text-foreground",
                fillCell ? "text-xs" : compact ? "text-[11px]" : "text-xs",
              )}
            >
              {halls || "No hall"}
            </p>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {conflicted && <AlertTriangle className="h-4 w-4 text-destructive" />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg"
              aria-label={`Actions for ${courses[0] ?? "slot"}`}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onSelect={onEdit}>
              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onClone}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
        <SearchableMultiSelect
          label="Courses"
          placeholder="Choose course"
          emptyLabel="No eligible courses found"
          selected={normalizeIds(draft.course_ids, draft.course_id)}
          single={Boolean(draft.id)}
          options={courses.map((course) => ({
            id: course.id,
            label: `${course.course_code} - ${course.course_title ?? "Untitled"}`,
          }))}
          onChange={(ids) =>
            setDraft({
              ...draft,
              course_ids: ids.length ? ids : null,
              course_id: ids[0] ?? null,
            })
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchableMultiSelect
            label="Lecturers"
            placeholder="Choose lecturers"
            emptyLabel="No lecturers available"
            selected={normalizeIds(draft.lecturer_ids, draft.lecturer_id)}
            options={lecturers.map((lecturer) => ({
              id: lecturer.id,
              label: lecturer.full_name,
            }))}
            onChange={(ids) =>
              setDraft({
                ...draft,
                lecturer_ids: ids.length ? ids : null,
                lecturer_id: ids[0] ?? null,
              })
            }
          />
          <SearchableMultiSelect
            label="Halls"
            placeholder="Choose halls"
            emptyLabel="No halls available"
            selected={normalizeIds(draft.hall_ids, draft.hall_id)}
            options={halls.map((hall) => ({
              id: hall.id,
              label: `${hall.name}${hall.capacity ? ` - ${hall.capacity}` : ""}`,
            }))}
            onChange={(ids) =>
              setDraft({
                ...draft,
                hall_ids: ids.length ? ids : null,
                hall_id: ids[0] ?? null,
              })
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Color">
            <Select
              value={draft.color}
              onValueChange={(value) =>
                setDraft({ ...draft, color: value as SlotColor })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea
            value={draft.notes ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, notes: e.target.value || null })
            }
            className="min-h-20 rounded-xl"
          />
        </Field>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button className="rounded-xl" onClick={onSave}>
          <Save className="h-4 w-4" /> Save Slot
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const SearchableMultiSelect = ({
  label,
  placeholder,
  emptyLabel,
  selected,
  options,
  onChange,
  single = false,
}: {
  label: string;
  placeholder: string;
  emptyLabel: string;
  selected: string[];
  options: { id: string; label: string }[];
  onChange: (ids: string[]) => void;
  single?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedSet = new Set(selected);
  const selectedLabels = options
    .filter((option) => selectedSet.has(option.id))
    .map((option) => option.label);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const toggle = (id: string, checked: boolean) => {
    if (single) {
      onChange(checked ? [id] : []);
      setOpen(false);
      return;
    }
    if (checked) {
      onChange(selectedSet.has(id) ? selected : [...selected, id]);
      return;
    }
    onChange(selected.filter((item) => item !== id));
  };

  return (
    <Field label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-10 w-full justify-between rounded-xl px-3 py-2 text-left font-normal"
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                selectedLabels.length === 0 && "text-muted-foreground",
              )}
            >
              {selectedLabels.length === 0
                ? placeholder
                : selectedLabels.length === 1
                  ? selectedLabels[0]
                  : `${selectedLabels.length} selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[1100] w-[var(--radix-popover-trigger-width)] rounded-xl p-2"
          align="start"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="h-9 rounded-lg pl-8 text-sm"
            />
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                {emptyLabel}
              </p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No {label.toLowerCase()} match your search
              </p>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-smooth hover:bg-primary-soft/40"
                >
                  <Checkbox
                    checked={selectedSet.has(option.id)}
                    className="rounded-[3px]"
                    onCheckedChange={(checked) =>
                      toggle(option.id, checked === true)
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {selected.length
          ? single
            ? "1 selected"
            : `${selected.length} selected`
          : "Optional"}
      </p>
    </Field>
  );
};

type Conflict = {
  id: string;
  title: string;
  message: string;
  slotIds: string[];
};

const courseLevel = (code: string) => {
  const match = code.match(/\d/);
  if (!match) return "Masters";
  return `${match[0]}00`;
};

const courseLabel = (
  slot: Slot | SlotDraft,
  coursesById: Map<string, Course>,
) => {
  const labels = normalizeIds(slot.course_ids, slot.course_id)
    .map((id) => {
      const course = coursesById.get(id);
      return course
        ? `${course.course_code} - ${course.course_title ?? "Untitled"}`
        : null;
    })
    .filter((label): label is string => Boolean(label));

  return labels.length ? labels.join("; ") : "Unassigned course";
};

const courseCodes = (
  slot: Slot | SlotDraft,
  coursesById: Map<string, Course>,
) =>
  normalizeIds(slot.course_ids, slot.course_id)
    .map((id) => coursesById.get(id)?.course_code)
    .filter((code): code is string => Boolean(code));

const dayAbbrev = (day: DayName) => day.slice(0, 3).toUpperCase();

const documentDateLabel = (startDate: string, day: DayName) => {
  if (!startDate) return "";
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const startDayIndex = (date.getDay() + 6) % 7;
  const targetDayIndex = DAYS.indexOf(day);
  const offset = (targetDayIndex - startDayIndex + 7) % 7;
  date.setDate(date.getDate() + offset);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeTimeInput = (value: string) => value.slice(0, 5);

const normalizeIds = (ids?: string[] | null, fallback?: string | null) => {
  const all = [...(ids ?? []), ...(fallback ? [fallback] : [])];
  return Array.from(new Set(all.filter(Boolean)));
};

const hasSharedId = (a: string[], b: string[]) =>
  a.some((id) => b.includes(id));

const lecturerNames = (
  slot: Slot | SlotDraft,
  lecturersById: Map<string, Lecturer>,
) =>
  normalizeIds(slot.lecturer_ids, slot.lecturer_id)
    .map((id) => lecturersById.get(id)?.full_name)
    .filter(Boolean)
    .join(", ");

const hallNames = (slot: Slot | SlotDraft, hallsById: Map<string, Hall>) =>
  normalizeIds(slot.hall_ids, slot.hall_id)
    .map((id) => hallsById.get(id)?.name)
    .filter(Boolean)
    .join(", ");

const normalizeSlotTimes = (slot: Slot): Slot => ({
  ...slot,
  course_id: normalizeIds(slot.course_ids, slot.course_id)[0] ?? null,
  course_ids: normalizeIds(slot.course_ids, slot.course_id),
  lecturer_id: normalizeIds(slot.lecturer_ids, slot.lecturer_id)[0] ?? null,
  lecturer_ids: normalizeIds(slot.lecturer_ids, slot.lecturer_id),
  hall_id: normalizeIds(slot.hall_ids, slot.hall_id)[0] ?? null,
  hall_ids: normalizeIds(slot.hall_ids, slot.hall_id),
  start_time: normalizeTimeInput(slot.start_time),
  end_time: normalizeTimeInput(slot.end_time),
});

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const timeLabel = (column: TimeColumn) => `${column.start} - ${column.end}`;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const DocumentTimetableView = ({
  meta,
  faculties,
  departments,
  slots,
  coursesById,
  hallsById,
  lecturersById,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}: {
  meta: TimetableMeta;
  faculties: Faculty[];
  departments: Department[];
  slots: Slot[];
  coursesById: Map<string, Course>;
  hallsById: Map<string, Hall>;
  lecturersById: Map<string, Lecturer>;
  onAddSlot: () => void;
  onEditSlot: (slot: Slot) => void;
  onDeleteSlot: (slotId: string) => void;
}) => {
  const facultyName =
    faculties.find((faculty) => faculty.id === meta.faculty_id)?.name ??
    "Faculty not set";
  const groupedSlots = [...slots].sort((a, b) => {
    const dayDiff =
      DAYS.indexOf(a.day_of_week as DayName) -
      DAYS.indexOf(b.day_of_week as DayName);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time) || a.end_time.localeCompare(b.end_time);
  });
  const fallbackDepartment = departments.find(
    (department) => department.id === meta.department_id,
  );
  const sections = Array.from(
    groupedSlots.reduce((groups, slot) => {
      const course = coursesById.get(slot.course_id ?? "");
      const departmentId =
        course?.department_id ?? meta.department_id ?? "unassigned";
      const current = groups.get(departmentId) ?? [];
      groups.set(departmentId, [...current, slot]);
      return groups;
    }, new Map<string, Slot[]>()),
  ).sort(([a], [b]) => {
    const departmentA =
      departments.find((department) => department.id === a)?.name ??
      fallbackDepartment?.name ??
      "Unassigned department";
    const departmentB =
      departments.find((department) => department.id === b)?.name ??
      fallbackDepartment?.name ??
      "Unassigned department";
    return departmentA.localeCompare(departmentB);
  });
  const visibleSections =
    meta.scope === "faculty"
      ? sections
      : [[meta.department_id || "department", groupedSlots] as [string, Slot[]]];

  return (
    <div className="mt-5 border border-border bg-background p-4">
      <div className="border-b border-border px-6 py-5 text-center">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {meta.scope === "faculty"
                ? "FACULTY TIMETABLE"
                : "DEPARTMENT TIMETABLE"}
            </p>
            <h3 className="mt-2 text-lg font-black uppercase tracking-wide text-foreground">
              {facultyName}
            </h3>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-foreground">
              {meta.scope === "faculty"
                ? "All departments in faculty"
                : fallbackDepartment?.name ?? "Department not set"}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {meta.semester} Semester {meta.academic_year}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-none border-border bg-background px-3 text-xs font-semibold"
            onClick={onAddSlot}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add slot
          </Button>
        </div>
      </div>
      {visibleSections.length === 0 || groupedSlots.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          <p>No slots in this timetable yet.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 rounded-none"
            onClick={onAddSlot}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add slot
          </Button>
        </div>
      ) : (
        visibleSections.map(([departmentId, sectionSlots]) => {
          const departmentName =
            departments.find((department) => department.id === departmentId)
              ?.name ??
            fallbackDepartment?.name ??
            "Unassigned department";
          return (
            <section key={departmentId} className="print:break-before-page border-b border-border py-6 last:border-b-0">
              <TimetableNoticeHeader headerText={meta.header_text} />
              <div className="flex items-start justify-between gap-3 px-2 pb-4 mt-2">
                <div>
                  <p className="whitespace-pre-wrap font-mono text-sm leading-snug text-foreground uppercase">
                    FACULTY/SCHOOL: {facultyName}
                  </p>
                  <p className="whitespace-pre-wrap font-mono text-sm leading-snug text-foreground uppercase">
                    DEPARTMENT: {departmentName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 rounded-none px-3 text-xs font-semibold"
                  onClick={onAddSlot}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add slot
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse font-mono text-sm">
                  <thead>
                    <tr className="text-left font-bold uppercase tracking-normal text-foreground">
                      <th className="w-[320px] border-b border-dashed border-foreground/70 px-2 py-2">DATE &amp; TIME</th>
                      <th className="w-[120px] border-b border-dashed border-foreground/70 px-2 py-2">COURSE</th>
                      <th className="w-[220px] border-b border-dashed border-foreground/70 px-2 py-2">HALL(S)</th>
                      <th className="border-b border-dashed border-foreground/70 px-2 py-2">COMMENTS</th>
                      <th className="w-12 border-b border-dashed border-foreground/70 px-2 py-2" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {sectionSlots.map((slot) => {
                      const courses = courseCodes(slot, coursesById);
                      return (
                        <tr
                          key={slot.id}
                          className="group align-top hover:bg-secondary/30"
                        >
                          <td className="whitespace-nowrap px-2 py-1 leading-5 text-foreground">
                            {dayAbbrev(slot.day_of_week as DayName)}{" "}
                            {documentDateLabel(
                              meta.document_start_date,
                              slot.day_of_week as DayName,
                            )}{" "}
                            {slot.start_time}-{slot.end_time}
                          </td>
                          <td className="px-2 py-1 leading-5 text-foreground">
                            {courses.length ? courses.join(", ") : "TBA"}
                          </td>
                          <td className="px-2 py-1 leading-5 text-foreground">
                            {hallNames(slot, hallsById) || "TBA"}
                          </td>
                          <td className="px-2 py-1 leading-5 text-foreground">
                            {slot.notes || ""}
                          </td>
                          <td className="px-2 py-1 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 rounded-none opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                  aria-label={`Actions for ${courses[0] ?? "slot"}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onSelect={() => onEditSlot(slot)}>
                                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => onDeleteSlot(slot.id)}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

const defaultTimetableHeader = (semester: string, academicYear: string, type: string) => [
  "UNIVERSITY OF BUEA",
  `${semester} SEMESTER ${academicYear} ${type.toUpperCase()} TIMETABLE`,
  "FROM 27TH OF JANUARY - 12TH OF FEBRUARY 2026",
  "*************FINAL*********FINAL********FINAL********FINAL**************",
  "FOR FRE100, ENG100, CEE100, ENT100, LAW100 AND ICT100 CHECK WITH THE FACULTY(S) FOR",
  "THE EXAMINATION DAY AT VARIOUS UNITS/DEPARTMENT(S)",
  "************************************************************************",
  "**********PLEASE NOTE: AMPHI 600 HAS 900 SEATS.********",
  "************ALL HALLS WILL BE IN USE *********",
  "******TPL AND URP SLOTS ARE MEANT FOR TEACHING NOT FOR EXAMINATION******",
  "************************************************************************",
].join("\n");

const withAutoHeader = (current: TimetableMeta, patch: Partial<TimetableMeta>): TimetableMeta => {
  const currentDefault = defaultTimetableHeader(
    current.semester,
    current.academic_year,
    current.type,
  );
  const next = { ...current, ...patch };
  const shouldRefreshHeader = current.header_text === currentDefault;
  return {
    ...next,
    header_text: shouldRefreshHeader
      ? defaultTimetableHeader(next.semester, next.academic_year, next.type)
      : next.header_text,
  };
};

export default ManualTimetable;
