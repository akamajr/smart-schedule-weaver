import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// We use direct client with anon or service role to fetch the data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { departmentId, level, semester, prompt, lecturerConstraints = [], hallConstraints = [] } = body;

    if (!departmentId || !level || !semester) {
      return NextResponse.json({ error: "Missing required scope parameters." }, { status: 400 });
    }

    // 1. Fetch related data
    const [coursesRes, lecturersRes, hallsRes] = await Promise.all([
      supabase.from("courses").select("id, course_code, course_title").eq("department_id", departmentId),
      supabase.from("profiles").select("id, full_name").eq("role", "lecturer"),
      supabase.from("halls").select("id, name, capacity")
    ]);

    const courses = coursesRes.data || [];
    const lecturers = lecturersRes.data || [];
    const halls = hallsRes.data || [];

    if (courses.length === 0) {
      return NextResponse.json({ error: "No courses found for this department." }, { status: 400 });
    }

    // Map constraints to readable names
    const mappedLecturerConstraints = lecturerConstraints.map((c: any) => {
      const lecturer = lecturers.find(l => l.id === c.id);
      return lecturer && c.rule ? `Lecturer ${lecturer.full_name}: ${c.rule}` : null;
    }).filter(Boolean);

    const mappedHallConstraints = hallConstraints.map((c: any) => {
      const hall = halls.find(h => h.id === c.id);
      return hall && c.rule ? `Hall ${hall.name}: ${c.rule}` : null;
    }).filter(Boolean);

    // 2. Build the AI context
    const context = `
      You are an expert university timetable scheduler.
      You need to create a weekly class schedule for the following courses:
      COURSES: ${JSON.stringify(courses)}
      
      AVAILABLE LECTURERS: ${JSON.stringify(lecturers)}
      
      AVAILABLE HALLS: ${JSON.stringify(halls)}
      
      Scope: Level ${level}, ${semester} Semester.
      
      Time formats: 24-hour HH:MM. Standard slots are typically 2 hours long, starting at 08:00, 10:00, 12:00, 14:00, 16:00.
      Days: Monday, Tuesday, Wednesday, Thursday, Friday.
      
      Additional User Constraints:
      ${prompt || "None."}
      
      Lecturer Specific Constraints:
      ${mappedLecturerConstraints.length > 0 ? mappedLecturerConstraints.join("\n      ") : "None."}
      
      Hall Specific Constraints:
      ${mappedHallConstraints.length > 0 ? mappedHallConstraints.join("\n      ") : "None."}
      
      Rules:
      - Assign appropriate lecturers (if you don't know, pick a plausible one from the list).
      - Assign halls that likely fit a class.
      - Do not double-book a hall at the same time on the same day.
      - Return the schedule strictly following the requested JSON schema.
      - slot_type should usually be "Lecture", "Lab", or "Tutorial".
    `;

    // 3. Generate structured data
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: context,
      prompt: "Generate the timetable slots.",
      schema: z.object({
        slots: z.array(z.object({
          course_id: z.string().nullable().describe("ID of the course"),
          course_ids: z.array(z.string()).nullable().describe("Multiple course IDs if it's a combined class"),
          lecturer_id: z.string().nullable().describe("ID of the primary lecturer"),
          lecturer_ids: z.array(z.string()).nullable().describe("Multiple lecturer IDs if co-taught"),
          hall_id: z.string().nullable().describe("ID of the hall"),
          hall_ids: z.array(z.string()).nullable().describe("Multiple hall IDs if using multiple rooms"),
          day_of_week: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
          start_time: z.string().describe("HH:MM"),
          end_time: z.string().describe("HH:MM"),
          slot_type: z.string().describe("e.g. Lecture, Lab"),
        }))
      })
    });

    return NextResponse.json({ slots: result.object.slots });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate schedule" }, { status: 500 });
  }
}
