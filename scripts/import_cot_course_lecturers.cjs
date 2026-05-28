const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pg = require("pg");
const xlsx = require("xlsx");

const DEFAULT_WORKBOOK = "C:\\Users\\DennisW\\Downloads\\cot_department_lecturer_course_mapping 2.xlsx";
const SOURCE_SHEET = "Course_Lecturer_Map";
const SOURCE_FILE = "cot_department_lecturer_course_mapping 2.xlsx";
const PLACEHOLDER_DOMAIN = "smart-schedule.local";
const SKIP_LECTURERS = new Set(["ALL STAFF", "STAFF", "TBA", "N/A", "NA", ""]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || !args.has("--apply");
const workbookPath = process.argv.find((arg) => arg.endsWith(".xlsx")) || DEFAULT_WORKBOOK;

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const source = fs.readFileSync("run_production_sql.cjs", "utf8");
  const match = source.match(/const connString = '([^']+)'/);
  if (!match) throw new Error("DATABASE_URL is not set and run_production_sql.cjs has no connection string.");
  return match[1];
}

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function titleCase(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
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

function displayLecturerName(value) {
  return titleCase(clean(value).replace(/^E\s+/i, ""));
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

function readWorkbook() {
  const workbook = xlsx.readFile(workbookPath);
  if (!workbook.Sheets[SOURCE_SHEET]) throw new Error(`Workbook is missing "${SOURCE_SHEET}" sheet.`);

  const sourceRows = xlsx.utils.sheet_to_json(workbook.Sheets[SOURCE_SHEET]);
  const courseRows = [];
  const assignmentRows = [];
  const lecturers = new Map();
  const skippedLecturers = [];

  sourceRows.forEach((row, index) => {
    const sourceRow = index + 2;
    const faculty = clean(row.faculty).toUpperCase();
    const department = clean(row.department).toUpperCase();
    const courseCode = clean(row.course_code).toUpperCase();
    if (!faculty || !department || !courseCode) return;

    courseRows.push({ sourceRow, faculty, department, courseCode });
    for (const rawName of splitLecturers(row.lecturers)) {
      const lecturerKey = normalizeNameKey(rawName);
      if (SKIP_LECTURERS.has(lecturerKey)) {
        skippedLecturers.push({ sourceRow, value: rawName, courseCode });
        continue;
      }

      const current = lecturers.get(lecturerKey);
      const displayName = displayLecturerName(rawName);
      if (!current) {
        lecturers.set(lecturerKey, {
          id: crypto.randomUUID(),
          lecturerKey,
          displayName,
          staffId: `cot-${slug(lecturerKey)}`,
          email: `lecturer.${slug(lecturerKey)}@${PLACEHOLDER_DOMAIN}`,
        });
      }
      assignmentRows.push({ sourceRow, faculty, department, courseCode, lecturerKey });
    }
  });

  return {
    sourceRows: sourceRows.length,
    courseRows,
    assignmentRows,
    lecturers: [...lecturers.values()],
    skippedLecturers,
  };
}

function valuesSql(rows, columns) {
  return rows.map((row) => `(${columns.map((column) => {
    const value = row[column];
    if (value === null || value === undefined) return "null";
    return `'${String(value).replace(/'/g, "''")}'`;
  }).join(", ")})`).join(",\n");
}

async function createStageTables(client, data) {
  await client.query(`
    create temp table if not exists cot_stage_courses (
      source_row integer,
      faculty text not null,
      department text not null,
      course_code text not null
    )
  `);
  await client.query(`
    create temp table if not exists cot_stage_lecturers (
      id uuid not null,
      lecturer_key text not null,
      display_name text not null,
      staff_id text not null,
      email text not null
    )
  `);
  await client.query(`
    create temp table if not exists cot_stage_assignments (
      source_row integer,
      faculty text not null,
      department text not null,
      course_code text not null,
      lecturer_key text not null
    )
  `);
  await client.query("truncate cot_stage_courses, cot_stage_lecturers, cot_stage_assignments");

  await client.query(`
    insert into cot_stage_courses (source_row, faculty, department, course_code)
    values ${valuesSql(data.courseRows, ["sourceRow", "faculty", "department", "courseCode"])}
  `);
  await client.query(`
    insert into cot_stage_lecturers (id, lecturer_key, display_name, staff_id, email)
    values ${valuesSql(data.lecturers, ["id", "lecturerKey", "displayName", "staffId", "email"])}
  `);
  await client.query(`
    insert into cot_stage_assignments (source_row, faculty, department, course_code, lecturer_key)
    values ${valuesSql(data.assignmentRows, ["sourceRow", "faculty", "department", "courseCode", "lecturerKey"])}
  `);
}

async function dryRunSummary(client, data) {
  await createStageTables(client, data);
  const result = await client.query(`
    with source_pairs as (
      select distinct department, course_code from cot_stage_courses
    ),
    existing_pairs as (
      select distinct sc.department, sc.course_code
      from cot_stage_courses sc
      join public.faculties f on upper(f.name) = sc.faculty
      join public.departments d on d.faculty_id = f.id and upper(d.name) = sc.department
      join public.courses c on c.department_id = d.id and upper(c.course_code) = sc.course_code
    ),
    missing_departments as (
      select distinct sc.faculty, sc.department
      from cot_stage_courses sc
      join public.faculties f on upper(f.name) = sc.faculty
      left join public.departments d on d.faculty_id = f.id and upper(d.name) = sc.department
      where d.id is null
    ),
    missing_courses as (
      select distinct sc.department, sc.course_code
      from cot_stage_courses sc
      join public.faculties f on upper(f.name) = sc.faculty
      join public.departments d on d.faculty_id = f.id and upper(d.name) = sc.department
      left join public.courses c on c.department_id = d.id and upper(c.course_code) = sc.course_code
      where c.id is null
    ),
    missing_lecturers as (
      select distinct sl.staff_id
      from cot_stage_lecturers sl
      left join public.lecturers l on l.staff_id = sl.staff_id
      where l.id is null
    )
    select
      (select count(*) from cot_stage_courses) source_rows,
      (select count(*) from source_pairs) unique_department_course_pairs,
      (select count(*) from cot_stage_lecturers) unique_lecturer_keys,
      (select count(*) from existing_pairs) existing_course_pairs,
      (select count(*) from missing_departments) new_departments,
      (select count(*) from missing_courses) new_courses,
      (select count(*) from missing_lecturers) new_lecturers,
      (select count(distinct lecturer_key || '|' || course_code || '|' || department) from cot_stage_assignments) planned_assignment_keys
  `);

  return result.rows[0];
}

async function applyImport(client) {
  await client.query(`
    insert into public.faculties (name)
    select distinct faculty from cot_stage_courses
    on conflict (name) do nothing
  `);

  await client.query(`
    insert into public.departments (faculty_id, name)
    select distinct f.id, sc.department
    from cot_stage_courses sc
    join public.faculties f on upper(f.name) = sc.faculty
    on conflict (faculty_id, name) do nothing
  `);

  await client.query(`
    insert into public.courses (department_id, faculty_id, course_code, course_title)
    select distinct d.id, f.id, sc.course_code, null
    from cot_stage_courses sc
    join public.faculties f on upper(f.name) = sc.faculty
    join public.departments d on d.faculty_id = f.id and upper(d.name) = sc.department
    on conflict (department_id, course_code) do update set faculty_id = excluded.faculty_id
  `);

  await client.query(`
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
    on conflict (id) do nothing
  `);

  await client.query(`
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
      is_active = true
  `);

  await client.query(`
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
      department_id = coalesce(public.lecturers.department_id, excluded.department_id)
  `);

  const assignments = await client.query(`
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
      $1,
      sa.source_row
    from cot_stage_assignments sa
    join public.faculties f on upper(f.name) = sa.faculty
    join public.departments d on d.faculty_id = f.id and upper(d.name) = sa.department
    join public.courses c on c.department_id = d.id and upper(c.course_code) = sa.course_code
    join cot_stage_lecturers sl on sl.lecturer_key = sa.lecturer_key
    join public.lecturers l on l.staff_id = sl.staff_id
    on conflict (course_id, lecturer_id, department_id, semester, academic_year) do nothing
    returning id
  `, [SOURCE_FILE]);

  return assignments.rowCount;
}

async function main() {
  const data = readWorkbook();
  const client = new pg.Client({ connectionString: connectionString() });
  await client.connect();
  client.on("error", (error) => {
    console.error("Database connection error:", error.message);
  });

  try {
    const before = await dryRunSummary(client, data);
    let insertedAssignments = 0;
    if (!dryRun) insertedAssignments = await applyImport(client);

    console.log(JSON.stringify({
      mode: dryRun ? "dry-run" : "apply",
      workbook: path.basename(workbookPath),
      sourceRows: data.sourceRows,
      uniqueDepartmentCoursePairs: Number(before.unique_department_course_pairs),
      uniqueLecturerKeys: Number(before.unique_lecturer_keys),
      existingCoursePairs: Number(before.existing_course_pairs),
      newDepartments: Number(before.new_departments),
      newCourses: Number(before.new_courses),
      newLecturers: Number(before.new_lecturers),
      plannedAssignmentKeys: Number(before.planned_assignment_keys),
      insertedAssignments,
      skippedLecturers: data.skippedLecturers,
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
