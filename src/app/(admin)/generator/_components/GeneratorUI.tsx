"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  CalendarDays,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string; faculty_id: string };
type Faculty = { id: string; name: string };
type Lecturer = { id: string; full_name: string };
type Hall = { id: string; name: string };

type SlotDraft = {
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
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMETABLE_TYPES = ["Lectures", "Exams", "Tutorials", "Resit", "Lab", "Seminar"];

const Generator = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);

  // Basic Setup State
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("300");
  const [semester, setSemester] = useState("First");
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [type, setType] = useState("Lectures");

  // Advanced Constraints State
  const [prompt, setPrompt] = useState("");
  const [lecturerConstraints, setLecturerConstraints] = useState<{ id: string; rule: string }[]>([]);
  const [hallConstraints, setHallConstraints] = useState<{ id: string; rule: string }[]>([]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedSlots, setGeneratedSlots] = useState<SlotDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // Load static data
  useEffect(() => {
    const load = async () => {
      const [facRes, deptRes, lecRes, hallRes] = await Promise.all([
        supabase.from("faculties").select("id, name").order("name"),
        supabase.from("departments").select("id, name, faculty_id").order("name"),
        supabase.from("profiles").select("id, full_name").eq("role", "lecturer").order("full_name"),
        supabase.from("halls").select("id, name").order("name"),
      ]);

      if (facRes.error) toast.error("Failed to load faculties");
      if (deptRes.error) toast.error("Failed to load departments");

      if (facRes.data) setFaculties(facRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (lecRes.data) setLecturers(lecRes.data);
      if (hallRes.data) setHalls(hallRes.data);
      setLoadingInitial(false);
    };
    load();
  }, []);

  const filteredDepartments = departments.filter(
    (d) => d.faculty_id === facultyId,
  );

  const generateSchedule = async () => {
    if (!departmentId) {
      toast.error("Please select a department first.");
      return;
    }
    setGenerating(true);
    setProgress(0);
    setGeneratedSlots([]);

    // Fake progress animation
    const i = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        return p + 5;
      });
    }, 500);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId,
          level,
          semester,
          prompt,
          lecturerConstraints,
          hallConstraints,
        }),
      });

      const data = await res.json();
      clearInterval(i);

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate schedule");
      }

      setProgress(100);
      
      // Add random colors to slots
      const colors = ["indigo", "emerald", "amber", "rose", "sky", "violet"];
      const coloredSlots = data.slots.map((s: any, idx: number) => ({
        ...s,
        color: colors[idx % colors.length],
      }));
      
      setGeneratedSlots(coloredSlots);
      toast.success("Schedule generated successfully by AI");
    } catch (err: any) {
      clearInterval(i);
      toast.error(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const saveToDatabase = async () => {
    if (generatedSlots.length === 0) return;
    if (!user) {
      toast.error("You must be logged in to save.");
      return;
    }
    setSaving(true);
    try {
      const title = `${departments.find(d => d.id === departmentId)?.name} Level ${level} ${semester} Semester`;

      // 1. Create Timetable
      const { data: ttData, error: ttError } = await supabase
        .from("manual_timetables")
        .insert({
          title,
          faculty_id: facultyId,
          department_id: departmentId,
          level,
          semester,
          academic_year: academicYear,
          start_date: new Date().toISOString().split("T")[0],
          type,
          status: "draft",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (ttError) throw ttError;
      const ttId = ttData.id;

      // 2. Insert Slots
      const slotInserts = generatedSlots.map((s) => ({
        timetable_id: ttId,
        course_id: s.course_id,
        course_ids: s.course_ids,
        lecturer_id: s.lecturer_id,
        lecturer_ids: s.lecturer_ids,
        hall_id: s.hall_id,
        hall_ids: s.hall_ids,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_type: s.slot_type,
        color: s.color,
      }));

      const { error: slotError } = await supabase
        .from("manual_timetable_slots")
        .insert(slotInserts);

      if (slotError) throw slotError;

      toast.success("Timetable saved as Draft!");
      router.push("/manual-timetable");
    } catch (err: any) {
      toast.error(err.message || "Failed to save to database");
    } finally {
      setSaving(false);
    }
  };

  const addLecturerConstraint = () => setLecturerConstraints([...lecturerConstraints, { id: "", rule: "" }]);
  const updateLecturerConstraint = (idx: number, field: "id" | "rule", value: string) => {
    const updated = [...lecturerConstraints];
    updated[idx][field] = value;
    setLecturerConstraints(updated);
  };
  const removeLecturerConstraint = (idx: number) => setLecturerConstraints(lecturerConstraints.filter((_, i) => i !== idx));

  const addHallConstraint = () => setHallConstraints([...hallConstraints, { id: "", rule: "" }]);
  const updateHallConstraint = (idx: number, field: "id" | "rule", value: string) => {
    const updated = [...hallConstraints];
    updated[idx][field] = value;
    setHallConstraints(updated);
  };
  const removeHallConstraint = (idx: number) => setHallConstraints(hallConstraints.filter((_, i) => i !== idx));


  if (loadingInitial) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 pb-20 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight">AI Generator</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Generate clash-free timetables automatically using OpenAI.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr,450px]">
        {/* Left: Preview */}
        <div className="order-2 xl:order-1 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Generated Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review the AI output before saving to the database.</p>
            </div>
            {generatedSlots.length > 0 && (
              <Button onClick={saveToDatabase} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save as Draft
              </Button>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card min-h-[400px]">
            {generatedSlots.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No Schedule Generated</h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm mt-1">
                  Fill out the parameters on the right and activate the AI generator to see results here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {DAYS.slice(0, 5).map((d) => (
                  <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {d}
                  </div>
                ))}
                {DAYS.slice(0, 5).map((d) => (
                  <div key={`col-${d}`} className="space-y-2">
                    {generatedSlots
                      .filter((s) => s.day_of_week === d)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((cell, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-xl p-3 text-left text-[11px] border border-primary/15 bg-primary-soft text-primary",
                          )}
                        >
                          <p className="text-[10px] font-semibold opacity-75">{cell.start_time} - {cell.end_time}</p>
                          <p className="mt-1 font-semibold">{cell.slot_type}</p>
                          <p className="mt-1 text-xs opacity-90">{cell.course_ids?.join(", ")}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="order-1 xl:order-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-bold">Generation Scope</h3>
                <p className="text-sm text-muted-foreground">Define parameters & constraints.</p>
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="basic">Basic Setup</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Constraints</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Faculty</Label>
                  <Select value={facultyId} onValueChange={setFacultyId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={!facultyId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {filteredDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["100", "200", "300", "400", "500"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["First", "Second"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Timetable Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMETABLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div>
                  <Label>General Instructions</Label>
                  <Textarea 
                    placeholder="e.g. Keep Fridays free. Try to schedule core courses in the morning."
                    className="mt-1.5 resize-none h-20"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                {/* Lecturer Constraints */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Lecturer Availability / Rules</Label>
                    <Button variant="ghost" size="sm" onClick={addLecturerConstraint} className="h-6 px-2 text-xs">
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  {lecturerConstraints.map((constraint, idx) => (
                    <div key={idx} className="flex gap-2 items-start rounded-lg bg-secondary/50 p-2">
                      <div className="flex-1 space-y-2">
                        <Select value={constraint.id} onValueChange={(val) => updateLecturerConstraint(idx, "id", val)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Lecturer" /></SelectTrigger>
                          <SelectContent>
                            {lecturers.map(l => <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="e.g. Only available on Mondays" 
                          className="h-8 text-xs" 
                          value={constraint.rule} 
                          onChange={(e) => updateLecturerConstraint(idx, "rule", e.target.value)} 
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeLecturerConstraint(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {lecturerConstraints.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No specific lecturer constraints.</p>
                  )}
                </div>

                {/* Hall Constraints */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Hall Restrictions</Label>
                    <Button variant="ghost" size="sm" onClick={addHallConstraint} className="h-6 px-2 text-xs">
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  {hallConstraints.map((constraint, idx) => (
                    <div key={idx} className="flex gap-2 items-start rounded-lg bg-secondary/50 p-2">
                      <div className="flex-1 space-y-2">
                        <Select value={constraint.id} onValueChange={(val) => updateHallConstraint(idx, "id", val)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Hall" /></SelectTrigger>
                          <SelectContent>
                            {halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="e.g. Reserve exclusively for Level 300" 
                          className="h-8 text-xs" 
                          value={constraint.rule} 
                          onChange={(e) => updateHallConstraint(idx, "rule", e.target.value)} 
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeHallConstraint(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {hallConstraints.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No specific hall constraints.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8">
              <Button
                onClick={generateSchedule}
                disabled={generating}
                className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow"
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating… ({progress}%)</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Activate AI Generator</>
                )}
              </Button>
              
              {generating && (
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full gradient-deep transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-primary">How it works</h4>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The AI will automatically pull all active <strong>Courses</strong>, <strong>Lecturers</strong>, and <strong>Halls</strong> for the selected department. 
              Once generated, you can save the timetable as a Draft and review/edit individual slots in the <strong>Manual Timetable</strong> tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
