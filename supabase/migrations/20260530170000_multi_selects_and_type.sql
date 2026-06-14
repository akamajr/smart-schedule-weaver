ALTER TABLE public.manual_timetables ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Lectures';
ALTER TABLE public.manual_timetable_slots ADD COLUMN IF NOT EXISTS lecturer_ids UUID[];
ALTER TABLE public.manual_timetable_slots ADD COLUMN IF NOT EXISTS hall_ids UUID[];

CREATE OR REPLACE FUNCTION public.enforce_manual_timetable_slot_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- 1. Check lecturer conflicts (single lecturer_id and array lecturer_ids)
  IF (NEW.lecturer_id IS NOT NULL OR NEW.lecturer_ids IS NOT NULL) AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
      AND (
        -- Check single against single
        (NEW.lecturer_id IS NOT NULL AND existing.lecturer_id IS NOT NULL AND NEW.lecturer_id = existing.lecturer_id)
        -- Check single against array
        OR (NEW.lecturer_id IS NOT NULL AND existing.lecturer_ids IS NOT NULL AND NEW.lecturer_id = ANY(existing.lecturer_ids))
        OR (NEW.lecturer_ids IS NOT NULL AND existing.lecturer_id IS NOT NULL AND existing.lecturer_id = ANY(NEW.lecturer_ids))
        -- Check array against array
        OR (NEW.lecturer_ids IS NOT NULL AND existing.lecturer_ids IS NOT NULL AND NEW.lecturer_ids && existing.lecturer_ids)
      )
  ) THEN
    RAISE EXCEPTION 'A lecturer is already assigned to another course in this time slot.';
  END IF;

  -- 2. Check hall conflicts (single hall_id and array hall_ids)
  IF (NEW.hall_id IS NOT NULL OR NEW.hall_ids IS NOT NULL) AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
      AND (
        -- Check single against single
        (NEW.hall_id IS NOT NULL AND existing.hall_id IS NOT NULL AND NEW.hall_id = existing.hall_id)
        -- Check single against array
        OR (NEW.hall_id IS NOT NULL AND existing.hall_ids IS NOT NULL AND NEW.hall_id = ANY(existing.hall_ids))
        OR (NEW.hall_ids IS NOT NULL AND existing.hall_id IS NOT NULL AND existing.hall_id = ANY(NEW.hall_ids))
        -- Check array against array
        OR (NEW.hall_ids IS NOT NULL AND existing.hall_ids IS NOT NULL AND NEW.hall_ids && existing.hall_ids)
      )
  ) THEN
    RAISE EXCEPTION 'A hall is already assigned to another course in this time slot.';
  END IF;

  RETURN NEW;
END;
$$;
