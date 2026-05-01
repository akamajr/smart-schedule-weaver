-- =========================
-- Profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =========================
-- Roles
-- =========================
CREATE TYPE public.app_role AS ENUM ('Admin', 'Lecturer', 'Student');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'Admin'))
  WITH CHECK (public.has_role(auth.uid(), 'Admin'));

-- =========================
-- Auto-create profile + default Student role on signup
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Read role from signup metadata, fall back to Student.
  -- Admin role is NEVER granted via signup metadata for security.
  BEGIN
    requested_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    requested_role := 'Student';
  END;

  IF requested_role IS NULL OR requested_role = 'Admin' THEN
    requested_role := 'Student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- updated_at helper
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Classrooms
-- =========================
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  building TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  type TEXT NOT NULL DEFAULT 'Lecture',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classrooms viewable by authenticated users"
  ON public.classrooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert classrooms"
  ON public.classrooms FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can update classrooms"
  ON public.classrooms FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE POLICY "Admins can delete classrooms"
  ON public.classrooms FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'Admin'));

CREATE TRIGGER classrooms_set_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial classrooms
INSERT INTO public.classrooms (name, building, capacity, type) VALUES
  ('U-Block E', 'U-Block', 80, 'Lecture'),
  ('PEAGOB 1', 'PEAGOB', 60, 'Lecture'),
  ('PEAGOB 2', 'PEAGOB', 60, 'Lecture'),
  ('PEAGOB 3', 'PEAGOB', 60, 'Lecture'),
  ('PEAGOB 4', 'PEAGOB', 60, 'Lecture'),
  ('CB II 50F', 'CB II', 50, 'Lecture'),
  ('CT2', 'CT Block', 40, 'Lab'),
  ('Open CT', 'CT Block', 100, 'Open Hall'),
  ('CB1 50A', 'CB1', 50, 'Lecture'),
  ('CB1 50B', 'CB1', 50, 'Lecture'),
  ('CB1 50C', 'CB1', 50, 'Lecture');