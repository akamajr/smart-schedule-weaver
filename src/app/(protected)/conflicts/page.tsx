"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Conflicts from "@/views/Conflicts";

export default function ConflictsPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Conflicts />
    </ProtectedRoute>
  );
}
