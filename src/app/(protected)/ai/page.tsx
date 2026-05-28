"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AIScheduler from "@/views/AIScheduler";

export default function AIPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <AIScheduler />
    </ProtectedRoute>
  );
}
