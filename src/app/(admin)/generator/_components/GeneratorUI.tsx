"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Loader2, Download, Printer, FileSpreadsheet, FileText,
  Users, DoorOpen, History as HistoryIcon, HelpCircle, Bell, CheckCircle2,
  Upload, FileUp, AlertTriangle, ShieldCheck, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { daysShort } from "@/lib/mockData";
import { InitialsAvatar } from "@/components/InitialsAvatar";

type Stream = "Software Engineering" | "Network Engineering";

type SessionType =
  | "Masters"
  | "First Sem CA"
  | "First Sem Exams"
  | "First Sem Resit"
  | "Second Sem CA"
  | "Second Sem Exams"
  | "Second Sem Resit";

const SESSION_TYPES: SessionType[] = [
  "Masters",
  "First Sem CA",
  "First Sem Exams",
  "First Sem Resit",
  "Second Sem CA",
  "Second Sem Exams",
  "Second Sem Resit",
];

type Cell = {
  time: string;
  title: string;
  density: "low" | "medium" | "high" | "reserved";
};

const initialGrid: Record<string, Cell[]> = {
  MON: [
    { time: "08:00 - 10:00", title: "Data Structures", density: "high" },
    { time: "10:30 - 12:30", title: "Algorithms II", density: "high" },
  ],
  TUE: [
    { time: "09:00 - 12:00", title: "Software QA", density: "medium" },
    { time: "14:00 - 16:00", title: "Free Slot", density: "low" },
  ],
  WED: [
    { time: "08:00 - 10:00", title: "Cloud Arch", density: "medium" },
    { time: "11:00 - 13:00", title: "Ethics Lab", density: "medium" },
  ],
  THU: [
    { time: "10:00 - 13:00", title: "Reserved", density: "reserved" },
  ],
  FRI: [
    { time: "10:00 - 12:30", title: "Thesis Seminar", density: "medium" },
  ],
};

type ConflictItem = {
  type: "lecturer" | "room" | "overlap";
  severity: "critical" | "medium" | "low";
  day: string;
  time: string;
  message: string;
};

type UploadedTT = {
  fileName: string;
  department: string;
  rows: { day: string; time: string; title: string; lecturer?: string; room?: string }[];
};

const Generator = () => {
  const [stream, setStream] = useState<Stream>("Software Engineering");
  const [level, setLevel] = useState("300");
  const [semester, setSemester] = useState("First");
  const [sessionType, setSessionType] = useState<SessionType>("First Sem CA");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(65);
  const [generated, setGenerated] = useState(true);
  const [grid, setGrid] = useState(initialGrid);
  const [dragging, setDragging] = useState<{ day: string; idx: number } | null>(null);
  const [uploaded, setUploaded] = useState<UploadedTT | null>(null);
  const [scanning, setScanning] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[] | null>(null);
  const [uploadDept, setUploadDept] = useState("Network Engineering");

  const generate = () => {
    setLoading(true);
    setProgress(0);
    const i = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(i); return 100; }
        return p + 6;
      });
    }, 60);
    setTimeout(() => {
      setGenerated(true);
      setLoading(false);
      setProgress(100);
      toast.success("Schedule generated successfully");
    }, 1300);
  };

  const onDrop = (day: string, time: string) => {
    if (!dragging) return;
    setGrid((prev) => {
      const next = { ...prev };
      const moved = { ...next[dragging.day][dragging.idx], time };
      next[dragging.day] = next[dragging.day].filter((_, i) => i !== dragging.idx);
      next[day] = [...(next[day] || []), moved];
      return next;
    });
    setDragging(null);
    toast.success(`Moved to ${day} ${time}`);
  };

  const parseUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows: UploadedTT["rows"] = [];
    const header = lines[0]?.toLowerCase() || "";
    const startIdx = header.includes("day") && header.includes("time") ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) continue;
      rows.push({
        day: cols[0]?.toUpperCase().slice(0, 3) || "MON",
        time: cols[1] || "",
        title: cols[2] || "",
        lecturer: cols[3] || undefined,
        room: cols[4] || undefined,
      });
    }
    if (rows.length === 0) {
      rows.push(
        { day: "MON", time: "08:00 - 10:00", title: "Network Security", lecturer: "Dr. Chen", room: "Hall A" },
        { day: "WED", time: "11:00 - 13:00", title: "Routing Protocols", lecturer: "Dr. Patel", room: "Lab 3" },
        { day: "TUE", time: "09:00 - 12:00", title: "Wireless Systems", lecturer: "Dr. Owen", room: "Hall A" },
      );
    }
    return rows;
  };

  const overlaps = (a: string, b: string) => {
    const toMin = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const range = (s: string) => {
      const m = s.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (!m) return null;
      return [toMin(m[1]), toMin(m[2])] as [number, number];
    };
    const ra = range(a); const rb = range(b);
    if (!ra || !rb) return false;
    return ra[0] < rb[1] && rb[0] < ra[1];
  };

  const detectConflicts = (data: UploadedTT): ConflictItem[] => {
    const issues: ConflictItem[] = [];
    for (const row of data.rows) {
      const ownDay = grid[row.day] || [];
      for (const cell of ownDay) {
        if (overlaps(cell.time, row.time)) {
          issues.push({
            type: "overlap",
            severity: "critical",
            day: row.day,
            time: row.time,
            message: `Time overlap on ${row.day}: "${cell.title}" (${stream}) ↔ "${row.title}" (${data.department})`,
          });
          if (row.room) {
            issues.push({
              type: "room",
              severity: "medium",
              day: row.day,
              time: row.time,
              message: `Possible room contention at ${row.room} (${row.day} ${row.time}).`,
            });
          }
        }
      }
    }
    const lecturers = new Set(data.rows.map((r) => r.lecturer).filter(Boolean) as string[]);
    lecturers.forEach((lec) => {
      const occ = data.rows.filter((r) => r.lecturer === lec);
      for (let i = 0; i < occ.length; i++) {
        for (let j = i + 1; j < occ.length; j++) {
          if (occ[i].day === occ[j].day && overlaps(occ[i].time, occ[j].time)) {
            issues.push({
              type: "lecturer",
              severity: "critical",
              day: occ[i].day,
              time: occ[i].time,
              message: `Lecturer clash: ${lec} double-booked on ${occ[i].day}.`,
            });
          }
        }
      }
    });
    return issues;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setConflicts(null);
    try {
      const rows = await parseUpload(file);
      const data: UploadedTT = { fileName: file.name, department: uploadDept, rows };
      setUploaded(data);
      setTimeout(() => {
        const issues = detectConflicts(data);
        setConflicts(issues);
        setScanning(false);
        if (issues.length === 0) toast.success("No conflicts detected — schedules are compatible.");
        else toast.warning(`${issues.length} conflict(s) detected across departments.`);
      }, 900);
    } catch {
      setScanning(false);
      toast.error("Could not read this file.");
    }
    e.target.value = "";
  };

  const clearUpload = () => {
    setUploaded(null);
    setConflicts(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <p className="font-display text-base font-bold tracking-wider text-foreground">SCHOLARLY HUB</p>
          <span className="h-4 w-px bg-border" />
          <p className="text-sm text-muted-foreground">AI Timetable Generation Hub</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><Bell className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><HistoryIcon className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><HelpCircle className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        {/* Configuration Engine */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-2xl font-bold">Configuration Engine</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define constraints for the optimization algorithm.</p>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department Stream</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-secondary/40 p-1">
            {(["Software Engineering", "Network Engineering"] as Stream[]).map((s) => (
              <button
                key={s}
                onClick={() => setStream(s)}
                className={cn(
                  "rounded-xl py-3 text-sm font-semibold leading-tight transition-smooth",
                  stream === s ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Academic Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="mt-2 h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Lv 100</SelectItem>
                  <SelectItem value="200">Lv 200</SelectItem>
                  <SelectItem value="300">Lv 300</SelectItem>
                  <SelectItem value="400">Lv 400</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Semester</Label>
              <div className="mt-2 space-y-2">
                {(["First", "Second"] as const).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={semester === s}
                      onChange={() => setSemester(s)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-medium">{s} Semester</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Session Type</Label>
            <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
              <SelectTrigger className="mt-2 h-12 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Currently generating: <span className="font-semibold text-foreground">{sessionType}</span>
            </p>
          </div>

          {/* Resource snapshot */}
          <div className="mt-6 rounded-2xl border border-border bg-primary-soft/30 p-4">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resource Snapshot</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-card p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success"><Users className="h-4 w-4" /></span>
                <div>
                  <p className="font-display text-lg font-bold leading-none">45 Lecturers</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-success">Available now</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-card p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><DoorOpen className="h-4 w-4" /></span>
                <div>
                  <p className="font-display text-lg font-bold leading-none">30 Rooms</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Allocated</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activate */}
          <Button
            onClick={generate}
            disabled={loading}
            className="mt-6 h-14 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Activate AI Generator</>
            )}
          </Button>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Optimizing constraints…</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full gradient-deep transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Generated preview */}
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Generated Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">Real-time optimization results and conflict analysis.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Exporting PDF…")}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Exporting Excel…")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard accent="primary" label="Efficiency Rating" value="98%" sub="Optimal Allocation" />
            <MetricCard accent="success" label="Conflict Status" value={<span className="text-base">No Hard Conflicts Detected</span>} sub="Validation Passed" iconSlot={<CheckCircle2 className="h-5 w-5 text-success" />} />
            <MetricCard accent="emerald" label="Facility Load" value="85%" sub="Avg. Room Utilization" />
          </div>

          {/* Heatmap grid */}
          {generated && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="font-display text-base font-semibold uppercase tracking-wider">Algorithm Confidence Heatmap</h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-soft" /> Low density</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Peak optimization</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-3">
                {daysShort.map((d) => (
                  <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {d}
                  </div>
                ))}
                {daysShort.map((d) => (
                  <div
                    key={`col-${d}`}
                    className="space-y-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(d, "Auto")}
                  >
                    {(grid[d] || []).map((cell, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDragging({ day: d, idx })}
                        className={cn(
                          "cursor-move rounded-xl p-3 text-left text-[11px] transition-smooth hover:-translate-y-0.5",
                          cell.density === "high" && "gradient-deep text-primary-foreground shadow-glow",
                          cell.density === "medium" && "bg-primary-soft text-primary border border-primary/15",
                          cell.density === "low" && "bg-secondary/60 text-muted-foreground border border-dashed border-border",
                          cell.density === "reserved" && "border border-dashed border-primary/30 bg-primary-soft/40 text-muted-foreground italic flex items-center justify-center min-h-[120px]",
                        )}
                      >
                        {cell.density === "reserved" ? (
                          <span className="rotate-90 text-[10px] font-semibold uppercase tracking-[0.3em]">Reserved</span>
                        ) : (
                          <>
                            <p className="text-[10px] font-semibold opacity-75">{cell.time}</p>
                            <p className="mt-2 font-semibold">{cell.title}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Bottom workload chip */}
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary-soft/50 p-3">
                <div className="flex -space-x-2">
                  {["A", "B", "C"].map((s) => <InitialsAvatar key={s} seed={s} size={28} />)}
                </div>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">+43</span>
                <p className="text-sm text-muted-foreground">Workloads balanced for all department faculty members.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Department Conflict Scanner */}
      <div className="rounded-3xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-gradient-to-r from-primary-soft/60 via-card to-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-deep text-primary-foreground shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">Cross-Department Conflict Scanner</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload another department's timetable. We'll compare it against the current schedule and flag clashes, overlaps & room contention.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[360px,1fr]">
          {/* Upload panel */}
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Select value={uploadDept} onValueChange={setUploadDept}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Network Engineering">Network Engineering</SelectItem>
                  <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="Business Computing">Business Computing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="block">
              <input type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" onChange={handleFile} className="hidden" />
              <div className="cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/30 p-6 text-center transition-smooth hover:border-primary/60 hover:bg-primary-soft/50">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
                  <Upload className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">Drop file or click to upload</p>
                <p className="mt-1 text-xs text-muted-foreground">CSV / Excel / PDF — columns: day, time, title, lecturer, room</p>
              </div>
            </label>

            {uploaded && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <FileUp className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{uploaded.fileName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{uploaded.department} · {uploaded.rows.length} entries</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground" onClick={clearUpload}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-5">
            {!uploaded && !scanning && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm">
                  <FileText className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-base font-semibold">No timetable uploaded yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Once a file is uploaded, we'll cross-check every slot against the current {stream} schedule.
                </p>
              </div>
            )}

            {scanning && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm font-semibold">Scanning for conflicts…</p>
                <p className="mt-1 text-xs text-muted-foreground">Comparing across days, lecturers, and rooms.</p>
              </div>
            )}

            {!scanning && conflicts && conflicts.length === 0 && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-lg font-bold">No conflicts detected</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  The {uploaded?.department} timetable is fully compatible with the current {stream} schedule.
                </p>
              </div>
            )}

            {!scanning && conflicts && conflicts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="font-display text-sm font-bold uppercase tracking-wider">
                      {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Detected
                    </p>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    Action required
                  </span>
                </div>

                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {conflicts.map((c, i) => {
                    const tone =
                      c.severity === "critical"
                        ? "border-l-destructive bg-destructive/5"
                        : c.severity === "medium"
                        ? "border-l-warning bg-warning-soft/40"
                        : "border-l-primary bg-primary-soft/40";
                    const badge =
                      c.type === "lecturer" ? "Lecturer Clash"
                      : c.type === "room" ? "Room Conflict"
                      : "Time Overlap";
                    return (
                      <div key={i} className={cn("rounded-xl border border-border border-l-4 p-3", tone)}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm">
                              {badge}
                            </span>
                            <p className="mt-2 text-sm font-medium">{c.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{c.day} · {c.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  accent, label, value, sub, iconSlot,
}: { accent: "primary" | "success" | "emerald"; label: string; value: React.ReactNode; sub: string; iconSlot?: React.ReactNode }) => {
  const borders = {
    primary: "border-l-primary",
    success: "border-l-success",
    emerald: "border-l-success",
  };
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-card border-l-4", borders[accent])}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {iconSlot}
      </div>
      <p className="mt-3 font-display text-3xl font-bold leading-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
};

export default Generator;

