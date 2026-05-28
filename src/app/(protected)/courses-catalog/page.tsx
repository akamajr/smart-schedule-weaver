"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import StudentCourses from "@/views/StudentCourses";

export default function CoursesCatalogPage() {
  return (
    <ProtectedRoute roles={["Student"]}>
      <StudentCourses />
    </ProtectedRoute>
  );
}
