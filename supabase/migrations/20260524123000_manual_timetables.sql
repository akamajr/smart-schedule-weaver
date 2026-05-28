CREATE TABLE IF NOT EXISTS public.manual_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT '300',
  semester TEXT NOT NULL DEFAULT 'First',
  academic_year TEXT NOT NULL DEFAULT '2025/2026',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manual_timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.manual_timetables(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lecturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type TEXT NOT NULL DEFAULT 'Lecture',
  color TEXT NOT NULL DEFAULT 'indigo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manual_timetable_slots_time_check CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS manual_timetables_department_idx
  ON public.manual_timetables(department_id);

CREATE INDEX IF NOT EXISTS manual_timetables_faculty_idx
  ON public.manual_timetables(faculty_id);

CREATE INDEX IF NOT EXISTS manual_timetables_status_idx
  ON public.manual_timetables(status);

CREATE INDEX IF NOT EXISTS manual_timetable_slots_timetable_idx
  ON public.manual_timetable_slots(timetable_id);

CREATE INDEX IF NOT EXISTS manual_timetable_slots_day_time_idx
  ON public.manual_timetable_slots(day_of_week, start_time, end_time);

ALTER TABLE public.manual_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_timetable_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manual_timetables: authenticated can read" ON public.manual_timetables;
CREATE POLICY "manual_timetables: authenticated can read"
ON public.manual_timetables FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "manual_timetables: admins can insert" ON public.manual_timetables;
CREATE POLICY "manual_timetables: admins can insert"
ON public.manual_timetables FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetables: admins can update" ON public.manual_timetables;
CREATE POLICY "manual_timetables: admins can update"
ON public.manual_timetables FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetables: admins can delete" ON public.manual_timetables;
CREATE POLICY "manual_timetables: admins can delete"
ON public.manual_timetables FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetable_slots: authenticated can read" ON public.manual_timetable_slots;
CREATE POLICY "manual_timetable_slots: authenticated can read"
ON public.manual_timetable_slots FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "manual_timetable_slots: admins can insert" ON public.manual_timetable_slots;
CREATE POLICY "manual_timetable_slots: admins can insert"
ON public.manual_timetable_slots FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetable_slots: admins can update" ON public.manual_timetable_slots;
CREATE POLICY "manual_timetable_slots: admins can update"
ON public.manual_timetable_slots FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetable_slots: admins can delete" ON public.manual_timetable_slots;
CREATE POLICY "manual_timetable_slots: admins can delete"
ON public.manual_timetable_slots FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'));

DROP TRIGGER IF EXISTS manual_timetables_set_updated_at ON public.manual_timetables;
CREATE TRIGGER manual_timetables_set_updated_at
  BEFORE UPDATE ON public.manual_timetables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS manual_timetable_slots_set_updated_at ON public.manual_timetable_slots;
CREATE TRIGGER manual_timetable_slots_set_updated_at
  BEFORE UPDATE ON public.manual_timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
