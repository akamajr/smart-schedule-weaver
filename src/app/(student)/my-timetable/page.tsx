import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Client-only component wrapper for the timetable
const StudentTimetableUI = dynamic(
  () => import("./_components/StudentTimetableUI"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function StudentTimetablePage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          My Schedule
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View your personal level timetable and browse departmental schedules.
        </p>
      </div>

      <StudentTimetableUI />
    </div>
  );
}
