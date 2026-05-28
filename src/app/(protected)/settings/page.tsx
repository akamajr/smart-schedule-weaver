"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Settings from "@/views/Settings";

export default function SettingsPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <Settings />
    </ProtectedRoute>
  );
}
