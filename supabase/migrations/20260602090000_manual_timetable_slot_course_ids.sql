ALTER TABLE public.manual_timetable_slots
ADD COLUMN IF NOT EXISTS course_ids UUID[];

CREATE OR REPLACE FUNCTION public.enforce_manual_timetable_slot_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.lecturer_id IS NOT NULL OR NEW.lecturer_ids IS NOT NULL) AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
      AND (
        (NEW.lecturer_id IS NOT NULL AND existing.lecturer_id IS NOT NULL AND NEW.lecturer_id = existing.lecturer_id)
        OR (NEW.lecturer_id IS NOT NULL AND existing.lecturer_ids IS NOT NULL AND NEW.lecturer_id = ANY(existing.lecturer_ids))
        OR (NEW.lecturer_ids IS NOT NULL AND existing.lecturer_id IS NOT NULL AND existing.lecturer_id = ANY(NEW.lecturer_ids))
        OR (NEW.lecturer_ids IS NOT NULL AND existing.lecturer_ids IS NOT NULL AND NEW.lecturer_ids && existing.lecturer_ids)
      )
  ) THEN
    RAISE EXCEPTION 'A lecturer is already assigned to another course in this time slot.';
  END IF;

  IF (NEW.hall_id IS NOT NULL OR NEW.hall_ids IS NOT NULL) AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
      AND (
        (NEW.hall_id IS NOT NULL AND existing.hall_id IS NOT NULL AND NEW.hall_id = existing.hall_id)
        OR (NEW.hall_id IS NOT NULL AND existing.hall_ids IS NOT NULL AND NEW.hall_id = ANY(existing.hall_ids))
        OR (NEW.hall_ids IS NOT NULL AND existing.hall_id IS NOT NULL AND existing.hall_id = ANY(NEW.hall_ids))
        OR (NEW.hall_ids IS NOT NULL AND existing.hall_ids IS NOT NULL AND NEW.hall_ids && existing.hall_ids)
      )
  ) THEN
    RAISE EXCEPTION 'A hall is already assigned to another course in this time slot.';
  END IF;

  IF (NEW.course_id IS NOT NULL OR NEW.course_ids IS NOT NULL) AND EXISTS (
    SELECT 1
    FROM public.manual_timetable_slots existing
    WHERE existing.timetable_id = NEW.timetable_id
      AND existing.day_of_week = NEW.day_of_week
      AND existing.id <> NEW.id
      AND NEW.start_time < existing.end_time
      AND existing.start_time < NEW.end_time
      AND (
        (NEW.course_id IS NOT NULL AND existing.course_id IS NOT NULL AND NEW.course_id = existing.course_id)
        OR (NEW.course_id IS NOT NULL AND existing.course_ids IS NOT NULL AND NEW.course_id = ANY(existing.course_ids))
        OR (NEW.course_ids IS NOT NULL AND existing.course_id IS NOT NULL AND existing.course_id = ANY(NEW.course_ids))
        OR (NEW.course_ids IS NOT NULL AND existing.course_ids IS NOT NULL AND NEW.course_ids && existing.course_ids)
      )
  ) THEN
    RAISE EXCEPTION 'A course is already assigned to another slot in this time range.';
  END IF;

  RETURN NEW;
END;
$$;
