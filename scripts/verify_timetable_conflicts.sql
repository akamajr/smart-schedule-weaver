begin;

do $$
declare
  test_timetable_id uuid;
  first_course_id uuid;
  second_course_id uuid;
  test_lecturer_id uuid;
  first_hall_id uuid;
  second_hall_id uuid;
begin
  select id into first_course_id from public.courses order by course_code limit 1;
  select id into second_course_id from public.courses where id <> first_course_id order by course_code limit 1;
  select id into test_lecturer_id from public.profiles where role = 'lecturer' order by created_at desc limit 1;
  select id into first_hall_id from public.halls order by name limit 1;
  select id into second_hall_id from public.halls where id <> first_hall_id order by name limit 1;

  if first_course_id is null or second_course_id is null or test_lecturer_id is null or first_hall_id is null or second_hall_id is null then
    raise exception 'Missing test data for conflict verification.';
  end if;

  insert into public.manual_timetables (title, level, semester, academic_year, status)
  values ('Conflict Guard Verification', '100', 'First', '2099/2100', 'draft')
  returning id into test_timetable_id;

  insert into public.manual_timetable_slots (
    timetable_id, course_id, lecturer_id, hall_id, day_of_week, start_time, end_time, slot_type, color
  ) values (
    test_timetable_id, first_course_id, test_lecturer_id, first_hall_id, 'Monday', '08:00', '10:00', 'Lecture', 'indigo'
  );

  begin
    insert into public.manual_timetable_slots (
      timetable_id, course_id, lecturer_id, hall_id, day_of_week, start_time, end_time, slot_type, color
    ) values (
      test_timetable_id, second_course_id, test_lecturer_id, second_hall_id, 'Monday', '09:00', '11:00', 'Lecture', 'emerald'
    );
    raise exception 'Lecturer overlap was not blocked.';
  exception when others then
    if sqlerrm not like '%Lecturer is already assigned%' then
      raise;
    end if;
  end;

  begin
    insert into public.manual_timetable_slots (
      timetable_id, course_id, lecturer_id, hall_id, day_of_week, start_time, end_time, slot_type, color
    ) values (
      test_timetable_id, second_course_id, null, first_hall_id, 'Monday', '09:00', '11:00', 'Lecture', 'emerald'
    );
    raise exception 'Hall overlap was not blocked.';
  exception when others then
    if sqlerrm not like '%Hall is already assigned%' then
      raise;
    end if;
  end;

  insert into public.manual_timetable_slots (
    timetable_id, course_id, lecturer_id, hall_id, day_of_week, start_time, end_time, slot_type, color
  ) values (
    test_timetable_id, second_course_id, null, second_hall_id, 'Monday', '08:00', '10:00', 'Lecture', 'sky'
  );
end $$;

rollback;

select 'manual timetable conflict guards passed' as result;
