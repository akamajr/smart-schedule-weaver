-- Allow Admins to manage classrooms; everyone authenticated can view.
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Classrooms readable by authenticated" ON public.classrooms;
CREATE POLICY "Classrooms readable by authenticated"
ON public.classrooms FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert classrooms" ON public.classrooms;
CREATE POLICY "Admins can insert classrooms"
ON public.classrooms FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "Admins can update classrooms" ON public.classrooms;
CREATE POLICY "Admins can update classrooms"
ON public.classrooms FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'))
WITH CHECK (public.has_role(auth.uid(), 'Admin'));

DROP POLICY IF EXISTS "Admins can delete classrooms" ON public.classrooms;
CREATE POLICY "Admins can delete classrooms"
ON public.classrooms FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'Admin'));