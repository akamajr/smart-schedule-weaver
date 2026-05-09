import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "7am to 9am",
  "9am to 11am",
  "11am to 1pm",
  "1pm to 3pm",
  "3pm to 5pm",
  "5pm to 7pm",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Session = {
  title: string;
  lecturer?: string;
  venue?: string;
};

const SCHEDULE: Record<string, Record<string, Session>> = {
  "7am to 9am": {
    Tuesday: { title: "Data Analysis", lecturer: "Mr KOMETA", venue: "u block" },
    Thursday: { title: "Information security", lecturer: "Dr Sone", venue: "CT1" },
  },
  "9am to 11am": {
    Wednesday: { title: "Mobile app", lecturer: "Mr Megoze", venue: "u block E" },
  },
  "11am to 1pm": {
    Friday: { title: "Data Analysis", lecturer: "Mr KOMETA" },
  },
  "1pm to 3pm": {
    Tuesday: { title: "Information security", lecturer: "Dr Sone", venue: "CT1" },
    Thursday: { title: "SPQ", lecturer: "MR Nyanga", venue: "G block 100" },
  },
  "3pm to 5pm": {
    Saturday: { title: "Mobile app for embeded system", lecturer: "DR Melingui", venue: "ODC" },
  },
  "5pm to 7pm": {},
};

const StudentCourses = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-elegant">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Student Weekly Timetable
        </h1>
        <p className="mt-3 text-sm opacity-90 md:text-base">Smart Timetable System Generator</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div className="grid grid-cols-7 gap-2">
            <div className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
              Time
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Body rows */}
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="mt-2 grid grid-cols-7 gap-2">
              <div className="flex items-center justify-center rounded-xl bg-primary-soft px-3 py-6 text-center text-sm font-bold text-foreground">
                {slot}
              </div>
              {DAYS.map((day) => {
                const session = SCHEDULE[slot]?.[day];
                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-[96px] rounded-xl border border-border bg-card p-2",
                      session && "shadow-sm"
                    )}
                  >
                    {session && (
                      <div className="h-full rounded-lg border-l-4 border-primary bg-secondary/60 p-2 text-xs">
                        <p className="font-bold text-foreground">{session.title}</p>
                        {session.lecturer && (
                          <p className="mt-1 text-muted-foreground">
                            Lecturer: {session.lecturer}
                          </p>
                        )}
                        {session.venue && (
                          <p className="text-muted-foreground">venue: {session.venue}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;
