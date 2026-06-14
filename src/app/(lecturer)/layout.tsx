"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={["Lecturer"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
