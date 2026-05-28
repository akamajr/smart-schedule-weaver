"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Courses from "@/views/Courses";

export default function CoursesPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Courses />
    </ProtectedRoute>
  );
}
