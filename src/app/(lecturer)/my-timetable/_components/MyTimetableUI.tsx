"use client";

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

type Session = { title: string; venue?: string };

const SCHEDULE: Record<string, Record<string, Session>> = {
  "7am to 9am": {
    Tuesday: { title: "Data Analysis", venue: "u block" },
    Thursday: { title: "Information security", venue: "CT1" },
  },
  "9am to 11am": {
    Wednesday: { title: "Mobile app", venue: "u block E" },
  },
  "11am to 1pm": {
    Friday: { title: "Data Analysis", venue: "u block" },
  },
  "1pm to 3pm": {
    Tuesday: { title: "Information security", venue: "CT1" },
    Thursday: { title: "SPQ", venue: "G block 100" },
  },
  "3pm to 5pm": {
    Saturday: { title: "Mobile app for embeded system", venue: "ODC" },
  },
  "5pm to 7pm": {},
};

const MyTimetable = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[hsl(var(--primary))] p-8 text-center text-primary-foreground shadow-elegant" style={{ background: "hsl(240 60% 18%)" }}>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Lecturer Teaching Timetable
        </h1>
        <p className="mt-3 text-sm opacity-90 md:text-base">Smart Timetable Generator System</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 gap-2">
            <div className="rounded-xl px-4 py-3 text-center text-sm font-bold text-primary-foreground" style={{ background: "hsl(240 60% 18%)" }}>
              Time
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="rounded-xl px-4 py-3 text-center text-sm font-bold text-primary-foreground"
                style={{ background: "hsl(240 60% 18%)" }}
              >
                {d}
              </div>
            ))}
          </div>

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
                      <div className="h-full rounded-lg p-2 text-xs text-primary-foreground" style={{ background: "hsl(240 50% 55%)" }}>
                        <p className="font-bold">{session.title}</p>
                        {session.venue && <p className="mt-1 opacity-90">Venue: {session.venue}</p>}
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

export default MyTimetable;

