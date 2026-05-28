const fs = require("fs");
const pg = require("pg");

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const source = fs.readFileSync("run_production_sql.cjs", "utf8");
  return source.match(/const connString = '([^']+)'/)?.[1];
}

async function main() {
  const client = new pg.Client({ connectionString: connectionString() });
  await client.connect();
  const result = await client.query(`
    select
      (select count(*) from public.course_lecturer_assignments) as assignments,
      (select count(*) from public.profiles where email like 'lecturer.%@smart-schedule.local') as placeholder_profiles,
      (select count(*) from public.lecturers where staff_id like 'cot-%') as imported_lecturers,
      (
        select count(*)
        from public.courses c
        join public.faculties f on f.id = c.faculty_id
        where f.name = 'COLLEGE OF TECHNOLOGY'
      ) as cot_courses,
      (
        select count(*)
        from (
          select department_id, course_code, count(*) as n
          from public.courses
          group by department_id, course_code
          having count(*) > 1
        ) dupes
      ) as duplicate_department_courses,
      (
        select count(*)
        from public.course_lecturer_assignments cla
        left join public.courses c on c.id = cla.course_id
        left join public.profiles p on p.id = cla.lecturer_id
        left join public.departments d on d.id = cla.department_id
        left join public.faculties f on f.id = cla.faculty_id
        where c.id is null or p.id is null or d.id is null or f.id is null
      ) as invalid_assignments,
      (
        select count(*)
        from public.lecturers l
        left join public.profiles p on p.id = l.id
        where p.id is null
      ) as lecturers_without_profiles;
  `);
  console.log(JSON.stringify(result.rows[0], null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
