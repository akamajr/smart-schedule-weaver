"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={["Student"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
