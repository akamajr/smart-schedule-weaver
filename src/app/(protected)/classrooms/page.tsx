"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Classrooms from "@/views/Classrooms";

export default function ClassroomsPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Classrooms />
    </ProtectedRoute>
  );
}
