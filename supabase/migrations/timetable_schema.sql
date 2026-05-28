
CREATE TABLE IF NOT EXISTS public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Halls / Venues
CREATE TABLE IF NOT EXISTS public.halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Exam Sessions
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.exam_session_halls (
  exam_session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  hall_id UUID NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_session_id, hall_id)
);



ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_session_halls ENABLE ROW LEVEL SECURITY;



CREATE POLICY "faculties: all authenticated can read" ON public.faculties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "faculties: admins can insert" ON public.faculties
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "faculties: admins can update" ON public.faculties
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "faculties: admins can delete" ON public.faculties
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));



CREATE POLICY "departments: all authenticated can read" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments: admins can insert" ON public.departments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "departments: admins can update" ON public.departments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "departments: admins can delete" ON public.departments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));



CREATE POLICY "courses: all authenticated can read" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "courses: admins can insert" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "courses: admins can update" ON public.courses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "courses: admins can delete" ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));




CREATE POLICY "halls: all authenticated can read" ON public.halls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "halls: admins can insert" ON public.halls
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "halls: admins can update" ON public.halls
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "halls: admins can delete" ON public.halls
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));



CREATE POLICY "exam_sessions: all authenticated can read" ON public.exam_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_sessions: admins can insert" ON public.exam_sessions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "exam_sessions: admins can update" ON public.exam_sessions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "exam_sessions: admins can delete" ON public.exam_sessions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));



CREATE POLICY "exam_session_halls: all authenticated can read" ON public.exam_session_halls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_session_halls: admins can insert" ON public.exam_session_halls
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "exam_session_halls: admins can update" ON public.exam_session_halls
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "exam_session_halls: admins can delete" ON public.exam_session_halls
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'Admin'));
