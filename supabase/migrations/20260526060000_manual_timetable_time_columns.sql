CREATE TABLE IF NOT EXISTS public.manual_timetable_time_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.manual_timetables(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT manual_timetable_time_columns_time_check CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS manual_timetable_time_columns_timetable_idx
  ON public.manual_timetable_time_columns(timetable_id, sort_order, start_time);

ALTER TABLE public.manual_timetable_time_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manual_timetable_time_columns: authenticated can read" ON public.manual_timetable_time_columns;
CREATE POLICY "manual_timetable_time_columns: authenticated can read"
ON public.manual_timetable_time_columns FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "manual_timetable_time_columns: admins can insert" ON public.manual_timetable_time_columns;
CREATE POLICY "manual_timetable_time_columns: admins can insert"
ON public.manual_timetable_time_columns FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetable_time_columns: admins can update" ON public.manual_timetable_time_columns;
CREATE POLICY "manual_timetable_time_columns: admins can update"
ON public.manual_timetable_time_columns FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "manual_timetable_time_columns: admins can delete" ON public.manual_timetable_time_columns;
CREATE POLICY "manual_timetable_time_columns: admins can delete"
ON public.manual_timetable_time_columns FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'));

DROP TRIGGER IF EXISTS manual_timetable_time_columns_set_updated_at ON public.manual_timetable_time_columns;
CREATE TRIGGER manual_timetable_time_columns_set_updated_at
  BEFORE UPDATE ON public.manual_timetable_time_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
