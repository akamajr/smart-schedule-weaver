"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import MyTimetable from "@/views/MyTimetable";

export default function MyTimetablePage() {
  return (
    <ProtectedRoute roles={["Lecturer"]}>
      <MyTimetable />
    </ProtectedRoute>
  );
}
