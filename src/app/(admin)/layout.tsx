"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
