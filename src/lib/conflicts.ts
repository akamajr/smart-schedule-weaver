export type ConflictSeverity = "critical" | "medium" | "low";

export interface GlobalConflict {
  id: string;
  type: "lecturer" | "room" | "course";
  category: string;
  title: string;
  description: string;
  details: string;
  day: string;
  time: string;
  severity: ConflictSeverity;
  detectedAgo: string;
  slotIds: string[];
}

export interface SlotData {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_id: string | null;
  course_ids: string[] | null;
  lecturer_id: string | null;
  lecturer_ids: string[] | null;
  hall_id: string | null;
  hall_ids: string[] | null;
}

const normalizeIds = (arr: string[] | null | undefined, single: string | null | undefined) => {
  if (arr && arr.length > 0) return arr;
  if (single) return [single];
  return [];
};

const hasSharedId = (arr1: string[], arr2: string[]) => {
  if (!arr1.length || !arr2.length) return false;
  return arr1.some((id) => arr2.includes(id));
};

const overlaps = (a: { start_time: string; end_time: string }, b: { start_time: string; end_time: string }) => {
  return a.start_time < b.end_time && b.start_time < a.end_time;
};

// Formats a relative time string, keeping it simple for now
const formatDetectedAgo = () => "Just now"; 

/**
 * Detects conflicts given a list of slots, optionally populating names from reference maps.
 */
export const detectGlobalConflicts = (
  slots: SlotData[],
  coursesById?: Map<string, { course_code: string }>,
  lecturersById?: Map<string, { full_name: string }>,
  hallsById?: Map<string, { name: string }>
): GlobalConflict[] => {
  const conflicts: GlobalConflict[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      if (a.day_of_week !== b.day_of_week || !overlaps(a, b)) continue;

      const aHalls = normalizeIds(a.hall_ids, a.hall_id);
      const bHalls = normalizeIds(b.hall_ids, b.hall_id);
      
      if (hasSharedId(aHalls, bHalls)) {
        const sharedHallId = aHalls.find(id => bHalls.includes(id))!;
        const hallName = hallsById?.get(sharedHallId)?.name || "Unknown Hall";
        conflicts.push({
          id: `hall-${a.id}-${b.id}`,
          type: "room",
          category: "INFRASTRUCTURE ALERT",
          title: "Venue Unavailability",
          description: `${hallName} is double-booked on ${a.day_of_week} at ${a.start_time}-${a.end_time}.`,
          details: "Two classes are scheduled in the same hall simultaneously.",
          day: a.day_of_week,
          time: a.start_time,
          severity: "critical",
          detectedAgo: formatDetectedAgo(),
          slotIds: [a.id, b.id],
        });
      }

      const aLecturers = normalizeIds(a.lecturer_ids, a.lecturer_id);
      const bLecturers = normalizeIds(b.lecturer_ids, b.lecturer_id);

      if (hasSharedId(aLecturers, bLecturers)) {
        const sharedLecId = aLecturers.find(id => bLecturers.includes(id))!;
        const lecName = lecturersById?.get(sharedLecId)?.full_name || "Unknown Lecturer";
        conflicts.push({
          id: `lecturer-${a.id}-${b.id}`,
          type: "lecturer",
          category: "LECTURER TIME CLASH",
          title: "Lecturer Time Clash",
          description: `${lecName} is assigned to multiple classes on ${a.day_of_week} at ${a.start_time}-${a.end_time}.`,
          details: "Lecturer is double-booked.",
          day: a.day_of_week,
          time: a.start_time,
          severity: "critical",
          detectedAgo: formatDetectedAgo(),
          slotIds: [a.id, b.id],
        });
      }

      const aCourses = normalizeIds(a.course_ids, a.course_id);
      const bCourses = normalizeIds(b.course_ids, b.course_id);

      if (hasSharedId(aCourses, bCourses)) {
        const sharedCourseId = aCourses.find(id => bCourses.includes(id))!;
        const courseCode = coursesById?.get(sharedCourseId)?.course_code || "Unknown Course";
        conflicts.push({
          id: `course-${a.id}-${b.id}`,
          type: "course",
          category: "COURSE OVERLAP",
          title: "Course Section Overlap",
          description: `${courseCode} is scheduled multiple times concurrently on ${a.day_of_week} at ${a.start_time}-${a.end_time}.`,
          details: "Course appears in overlapping slots.",
          day: a.day_of_week,
          time: a.start_time,
          severity: "medium",
          detectedAgo: formatDetectedAgo(),
          slotIds: [a.id, b.id],
        });
      }
    }
  }

  return conflicts;
};
