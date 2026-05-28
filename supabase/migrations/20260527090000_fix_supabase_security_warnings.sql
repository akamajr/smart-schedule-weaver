BEGIN;

-- Lock function name resolution for Security Advisor's mutable search_path checks.
ALTER FUNCTION public.get_my_role() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;

-- Trigger-only functions should not be callable through the public API. Policy helper
-- functions are granted only to authenticated users because the app never needs them
-- before login.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Keep auth helper calls as initplans in RLS policies.
ALTER POLICY "course_lecturer_assignments: admins can delete"
ON public.course_lecturer_assignments
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "course_lecturer_assignments: admins can insert"
ON public.course_lecturer_assignments
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "course_lecturer_assignments: admins can update"
ON public.course_lecturer_assignments
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'))
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_slots: admins can delete"
ON public.manual_timetable_slots
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_slots: admins can insert"
ON public.manual_timetable_slots
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_slots: admins can update"
ON public.manual_timetable_slots
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'))
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_time_columns: admins can delete"
ON public.manual_timetable_time_columns
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_time_columns: admins can insert"
ON public.manual_timetable_time_columns
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetable_time_columns: admins can update"
ON public.manual_timetable_time_columns
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'))
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetables: admins can delete"
ON public.manual_timetables
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetables: admins can insert"
ON public.manual_timetables
TO authenticated
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

ALTER POLICY "manual_timetables: admins can update"
ON public.manual_timetables
TO authenticated
USING (public.has_role((select auth.uid()), 'Admin'))
WITH CHECK (public.has_role((select auth.uid()), 'Admin'));

-- Read policies are for logged-in users only; moving them off the public role avoids
-- unnecessary anon policy evaluation.
ALTER POLICY "courses: all authenticated can read" ON public.courses TO authenticated USING (true);
ALTER POLICY "departments: all authenticated can read" ON public.departments TO authenticated USING (true);
ALTER POLICY "exam_session_halls: all authenticated can read" ON public.exam_session_halls TO authenticated USING (true);
ALTER POLICY "exam_sessions: all authenticated can read" ON public.exam_sessions TO authenticated USING (true);
ALTER POLICY "faculties: all authenticated can read" ON public.faculties TO authenticated USING (true);
ALTER POLICY "halls: all authenticated can read" ON public.halls TO authenticated USING (true);

-- Consolidate permissive policy overlaps while preserving the same access model.
DROP POLICY IF EXISTS "admins: only admins can manage" ON public.admins;
DROP POLICY IF EXISTS "admins: only admins can view" ON public.admins;
CREATE POLICY "admins: admins can read"
ON public.admins
FOR SELECT
TO authenticated
USING (public.is_admin());
CREATE POLICY "admins: admins can insert"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
CREATE POLICY "admins: admins can update"
ON public.admins
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
CREATE POLICY "admins: admins can delete"
ON public.admins
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "lecturers: admins can manage" ON public.lecturers;
DROP POLICY IF EXISTS "lecturers: all authenticated can view" ON public.lecturers;
DROP POLICY IF EXISTS "lecturers: can view own record" ON public.lecturers;
CREATE POLICY "lecturers: authenticated can read"
ON public.lecturers
FOR SELECT
TO authenticated
USING (true);
CREATE POLICY "lecturers: admins can insert"
ON public.lecturers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
CREATE POLICY "lecturers: admins can update"
ON public.lecturers
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
CREATE POLICY "lecturers: admins can delete"
ON public.lecturers
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "profiles: admins can manage all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles: users can view own profile" ON public.profiles;
CREATE POLICY "profiles: permitted users can read"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin() OR id = (select auth.uid()));
CREATE POLICY "profiles: admins can insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
CREATE POLICY "profiles: permitted users can update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin() OR id = (select auth.uid()))
WITH CHECK (
  public.is_admin()
  OR (
    id = (select auth.uid())
    AND role = public.get_my_role()
  )
);
CREATE POLICY "profiles: admins can delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "students: admins can manage" ON public.students;
DROP POLICY IF EXISTS "students: admins can view all" ON public.students;
DROP POLICY IF EXISTS "students: can view own record" ON public.students;
DROP POLICY IF EXISTS "students: lecturers can view all" ON public.students;
CREATE POLICY "students: permitted users can read"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR id = (select auth.uid())
  OR public.get_my_role() = 'lecturer'::public.user_role
);
CREATE POLICY "students: admins can insert"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
CREATE POLICY "students: admins can update"
ON public.students
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
CREATE POLICY "students: admins can delete"
ON public.students
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Existing admin policies on these tables are not overlapping, but restricting them to
-- authenticated keeps anon out of write policy evaluation.
ALTER POLICY "courses: admins can delete" ON public.courses TO authenticated USING (public.is_admin());
ALTER POLICY "courses: admins can insert" ON public.courses TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "courses: admins can update" ON public.courses TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER POLICY "departments: admins can delete" ON public.departments TO authenticated USING (public.is_admin());
ALTER POLICY "departments: admins can insert" ON public.departments TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "departments: admins can update" ON public.departments TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER POLICY "exam_session_halls: admins can delete" ON public.exam_session_halls TO authenticated USING (public.is_admin());
ALTER POLICY "exam_session_halls: admins can insert" ON public.exam_session_halls TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "exam_session_halls: admins can update" ON public.exam_session_halls TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER POLICY "exam_sessions: admins can delete" ON public.exam_sessions TO authenticated USING (public.is_admin());
ALTER POLICY "exam_sessions: admins can insert" ON public.exam_sessions TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "exam_sessions: admins can update" ON public.exam_sessions TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER POLICY "faculties: admins can delete" ON public.faculties TO authenticated USING (public.is_admin());
ALTER POLICY "faculties: admins can insert" ON public.faculties TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "faculties: admins can update" ON public.faculties TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER POLICY "halls: admins can delete" ON public.halls TO authenticated USING (public.is_admin());
ALTER POLICY "halls: admins can insert" ON public.halls TO authenticated WITH CHECK (public.is_admin());
ALTER POLICY "halls: admins can update" ON public.halls TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
