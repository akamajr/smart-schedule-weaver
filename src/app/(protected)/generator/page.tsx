"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Generator from "@/views/Generator";

export default function GeneratorPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Generator />
    </ProtectedRoute>
  );
}
