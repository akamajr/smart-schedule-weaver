"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ManualTimetable from "@/views/ManualTimetable";

export default function ManualTimetablePage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <ManualTimetable />
    </ProtectedRoute>
  );
}
