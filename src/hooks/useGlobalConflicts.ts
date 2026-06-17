import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectGlobalConflicts, GlobalConflict, SlotData } from "@/lib/conflicts";

// Hook to detect conflicts across all timetables globally, optionally merged with local draft slots
export const useGlobalConflicts = (localSlots?: SlotData[], currentTimetableId?: string) => {
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dismissed_conflicts");
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse dismissed conflicts", err);
    }
  }, []);

  const dismissConflict = (id: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem("dismissed_conflicts", JSON.stringify(next));
      return next;
    });
  };

  const { data: dbData = { slots: [], coursesById: new Map(), lecturersById: new Map(), hallsById: new Map() }, isLoading, error } = useQuery({
    queryKey: ["global-conflicts-data"],
    queryFn: async () => {
      // Fetch all slots, courses, lecturers, halls
      const [
        { data: slots, error: slotsErr },
        { data: courses, error: coursesErr },
        { data: lecturers, error: lecturersErr },
        { data: halls, error: hallsErr }
      ] = await Promise.all([
        supabase.from("manual_timetable_slots").select("*"),
        supabase.from("courses").select("id, course_code"),
        supabase.from("profiles").select("id, full_name").eq("role", "lecturer"),
        supabase.from("halls").select("id, name")
      ]);

      if (slotsErr) throw slotsErr;
      if (coursesErr) throw coursesErr;
      if (lecturersErr) throw lecturersErr;
      if (hallsErr) throw hallsErr;

      const coursesById = new Map((courses || []).map((c) => [c.id, { course_code: c.course_code }]));
      const lecturersById = new Map((lecturers || []).map((l) => [l.id, { full_name: l.full_name }]));
      const hallsById = new Map((halls || []).map((h) => [h.id, { name: h.name }]));

      return { slots: slots || [], coursesById, lecturersById, hallsById };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const conflicts = useMemo(() => {
    let allSlots = [...dbData.slots];
    
    // If localSlots are provided, we should merge them.
    // To avoid duplicates, we remove DB slots that belong to the current timetable being edited,
    // and replace them with the localSlots.
    if (localSlots && currentTimetableId) {
      allSlots = allSlots.filter((s) => s.timetable_id !== currentTimetableId);
      allSlots = [...allSlots, ...localSlots] as any[];
    } else if (localSlots && !currentTimetableId) {
      // Creating a completely new timetable that has no ID yet
      allSlots = [...allSlots, ...localSlots] as any[];
    }

    return detectGlobalConflicts(allSlots, dbData.coursesById, dbData.lecturersById, dbData.hallsById);
  }, [dbData, localSlots, currentTimetableId]);

  // Filter out dismissed conflicts
  const activeConflicts = useMemo(() => {
    return conflicts.filter((c) => !dismissedIds.includes(c.id));
  }, [conflicts, dismissedIds]);

  return {
    conflicts: activeConflicts,
    totalConflicts: conflicts.length,
    isLoading,
    error,
    dismissConflict,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["global-conflicts-data"] }),
  };
};
