"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Lecturers from "@/views/Lecturers";

export default function LecturersPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Lecturers />
    </ProtectedRoute>
  );
}
