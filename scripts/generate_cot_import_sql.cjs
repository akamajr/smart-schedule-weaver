const fs = require("fs");
const crypto = require("crypto");
const xlsx = require("xlsx");

const workbookPath = "C:\\Users\\DennisW\\Downloads\\cot_department_lecturer_course_mapping 2.xlsx";
const outputPath = process.argv[2] || "C:\\tmp\\cot_import.sql";
const SOURCE_SHEET = "Course_Lecturer_Map";
const SOURCE_FILE = "cot_department_lecturer_course_mapping 2.xlsx";
const PLACEHOLDER_DOMAIN = "smart-schedule.local";
const SKIP_LECTURERS = new Set(["ALL STAFF", "STAFF", "TBA", "N/A", "NA", ""]);

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function titleCase(value) {
  return clean(value).toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function normalizeNameKey(value) {
  return clean(value)
    .toUpperCase()
    .replace(/[.'"]/g, "")
    .replace(/\b(PROF|PROFESSOR|DR|MR|MRS|MS|MISS|ENGR|ENGINEER)\b/g, "")
    .replace(/^E\s+/i, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function splitLecturers(value) {
  return clean(value).split(",").map(clean).filter(Boolean);
}

function slug(value) {
  return normalizeNameKey(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48) || "unknown";
}

function q(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function values(rows, columns) {
  return rows.map((row) => `(${columns.map((column) => q(row[column])).join(", ")})`).join(",\n");
}

const workbook = xlsx.readFile(workbookPath);
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[SOURCE_SHEET]);
const courses = [];
const assignments = [];
const lecturers = new Map();
const skipped = [];

rows.forEach((row, index) => {
  const sourceRow = index + 2;
  const faculty = clean(row.faculty).toUpperCase();
  const department = clean(row.department).toUpperCase();
  const courseCode = clean(row.course_code).toUpperCase();
  if (!faculty || !department || !courseCode) return;
  courses.push({ sourceRow, faculty, department, courseCode });
  splitLecturers(row.lecturers).forEach((rawName) => {
    const lecturerKey = normalizeNameKey(rawName);
    if (SKIP_LECTURERS.has(lecturerKey)) {
      skipped.push({ sourceRow, value: rawName, courseCode });
      return;
    }
    if (!lecturers.has(lecturerKey)) {
      lecturers.set(lecturerKey, {
        id: crypto.randomUUID(),
        lecturerKey,
        displayName: titleCase(clean(rawName).replace(/^E\s+/i, "")),
        staffId: `cot-${slug(lecturerKey)}`,
        email: `lecturer.${slug(lecturerKey)}@${PLACEHOLDER_DOMAIN}`,
      });
    }
    assignments.push({ sourceRow, faculty, department, courseCode, lecturerKey });
  });
});

const sql = `
\\set ON_ERROR_STOP on

create temp table if not exists cot_stage_courses (
  source_row integer,
  faculty text not null,
  department text not null,
  course_code text not null
);

create temp table if not exists cot_stage_lecturers (
  id uuid not null,
  lecturer_key text not null,
  display_name text not null,
  staff_id text not null,
  email text not null
);

create temp table if not exists cot_stage_assignments (
  source_row integer,
  faculty text not null,
  department text not null,
  course_code text not null,
  lecturer_key text not null
);

truncate cot_stage_courses, cot_stage_lecturers, cot_stage_assignments;

insert into cot_stage_courses (source_row, faculty, department, course_code)
values ${values(courses, ["sourceRow", "faculty", "department", "courseCode"])};

insert into cot_stage_lecturers (id, lecturer_key, display_name, staff_id, email)
values ${values([...lecturers.values()], ["id", "lecturerKey", "displayName", "staffId", "email"])};

insert into cot_stage_assignments (source_row, faculty, department, course_code, lecturer_key)
values ${values(assignments, ["sourceRow", "faculty", "department", "courseCode", "lecturerKey"])};

insert into public.faculties (name)
select distinct faculty from cot_stage_courses
on conflict (name) do nothing;

insert into public.departments (faculty_id, name)
select distinct f.id, sc.department
from cot_stage_courses sc
join public.faculties f on upper(f.name) = sc.faculty
on conflict (faculty_id, name) do nothing;

insert into public.courses (department_id, faculty_id, course_code, course_title)
select distinct d.id, f.id, sc.course_code, null
from cot_stage_courses sc
join public.faculties f on upper(f.name) = sc.faculty
join public.departments d on d.faculty_id = f.id and upper(d.name) = sc.department
on conflict (department_id, course_code) do update set faculty_id = excluded.faculty_id;

insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  sl.id,
  'authenticated',
  'authenticated',
  sl.email,
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', sl.display_name, 'role', 'lecturer', 'imported', true),
  now(),
  now()
from cot_stage_lecturers sl
left join public.lecturers l on l.staff_id = sl.staff_id
left join public.profiles p on p.email = sl.email
where l.id is null and p.id is null
on conflict (id) do nothing;

insert into public.profiles (id, role, full_name, email, is_active)
select
  coalesce(p.id, sl.id),
  'lecturer',
  sl.display_name,
  sl.email,
  true
from cot_stage_lecturers sl
left join public.lecturers l on l.staff_id = sl.staff_id
left join public.profiles p on p.email = sl.email
where l.id is null
on conflict (id) do update set
  role = 'lecturer',
  full_name = excluded.full_name,
  email = excluded.email,
  is_active = true;

insert into public.lecturers (id, staff_id, department_id)
select distinct on (coalesce(p.id, sl.id))
  coalesce(p.id, sl.id),
  sl.staff_id,
  d.id
from cot_stage_lecturers sl
join cot_stage_assignments sa on sa.lecturer_key = sl.lecturer_key
join public.faculties f on upper(f.name) = sa.faculty
join public.departments d on d.faculty_id = f.id and upper(d.name) = sa.department
left join public.profiles p on p.email = sl.email
order by coalesce(p.id, sl.id), d.name
on conflict (id) do update set
  staff_id = coalesce(public.lecturers.staff_id, excluded.staff_id),
  department_id = coalesce(public.lecturers.department_id, excluded.department_id);

insert into public.course_lecturer_assignments (
  course_id, lecturer_id, department_id, faculty_id, semester, academic_year, source_file, source_row
)
select distinct
  c.id,
  l.id,
  d.id,
  f.id,
  null,
  null,
  ${q(SOURCE_FILE)},
  sa.source_row
from cot_stage_assignments sa
join public.faculties f on upper(f.name) = sa.faculty
join public.departments d on d.faculty_id = f.id and upper(d.name) = sa.department
join public.courses c on c.department_id = d.id and upper(c.course_code) = sa.course_code
join cot_stage_lecturers sl on sl.lecturer_key = sa.lecturer_key
join public.lecturers l on l.staff_id = sl.staff_id
on conflict (course_id, lecturer_id, department_id, semester, academic_year) do nothing;

select
  (select count(*) from cot_stage_courses) as source_rows,
  (select count(*) from cot_stage_lecturers) as source_lecturers,
  (select count(*) from cot_stage_assignments) as source_assignment_rows,
  (select count(*) from public.course_lecturer_assignments where source_file = ${q(SOURCE_FILE)}) as stored_assignments,
  ${q(JSON.stringify(skipped))} as skipped_lecturers_json;
`;

fs.writeFileSync(outputPath, sql);
console.log(JSON.stringify({ outputPath, sourceRows: rows.length, courses: courses.length, lecturers: lecturers.size, assignments: assignments.length, skipped }, null, 2));
