import { redirect } from "next/navigation";

// /admin has no page — redirect admins straight to the dashboard.
export default function AdminRootPage() {
  redirect("/dashboard");
}
