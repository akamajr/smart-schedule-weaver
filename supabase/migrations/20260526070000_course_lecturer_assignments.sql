ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS common_scope TEXT;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_common_scope_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_common_scope_check
  CHECK (common_scope IS NULL OR common_scope IN ('department', 'faculty', 'college', 'all'));

CREATE TABLE IF NOT EXISTS public.course_lecturer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  semester TEXT CHECK (semester IS NULL OR semester IN ('First', 'Second', 'Resit')),
  academic_year TEXT,
  source_file TEXT,
  source_row INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (course_id, lecturer_id, department_id, semester, academic_year)
);

CREATE INDEX IF NOT EXISTS course_lecturer_assignments_course_idx
  ON public.course_lecturer_assignments(course_id);

CREATE INDEX IF NOT EXISTS course_lecturer_assignments_lecturer_idx
  ON public.course_lecturer_assignments(lecturer_id);

CREATE INDEX IF NOT EXISTS course_lecturer_assignments_department_idx
  ON public.course_lecturer_assignments(department_id);

ALTER TABLE public.course_lecturer_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_lecturer_assignments: authenticated can read" ON public.course_lecturer_assignments;
CREATE POLICY "course_lecturer_assignments: authenticated can read"
ON public.course_lecturer_assignments FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "course_lecturer_assignments: admins can insert" ON public.course_lecturer_assignments;
CREATE POLICY "course_lecturer_assignments: admins can insert"
ON public.course_lecturer_assignments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "course_lecturer_assignments: admins can update" ON public.course_lecturer_assignments;
CREATE POLICY "course_lecturer_assignments: admins can update"
ON public.course_lecturer_assignments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "course_lecturer_assignments: admins can delete" ON public.course_lecturer_assignments;
CREATE POLICY "course_lecturer_assignments: admins can delete"
ON public.course_lecturer_assignments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'));

DROP TRIGGER IF EXISTS course_lecturer_assignments_set_updated_at ON public.course_lecturer_assignments;
CREATE TRIGGER course_lecturer_assignments_set_updated_at
  BEFORE UPDATE ON public.course_lecturer_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_manual_timetable_slot_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.lecturer_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.lecturer_id = NEW.lecturer_id
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
  ) THEN
    RAISE EXCEPTION 'Lecturer is already assigned to another course in this time slot.';
  END IF;

  IF NEW.hall_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.hall_id = NEW.hall_id
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
  ) THEN
    RAISE EXCEPTION 'Hall is already assigned to another course in this time slot.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manual_timetable_slots_conflict_guard ON public.manual_timetable_slots;
CREATE TRIGGER manual_timetable_slots_conflict_guard
  BEFORE INSERT OR UPDATE ON public.manual_timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.enforce_manual_timetable_slot_conflicts();
