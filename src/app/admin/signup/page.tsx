import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AdminLoginUI = dynamic(() => import("../_components/AdminLoginUI"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

export default function AdminSignupPage() {
  return <AdminLoginUI initialView="signup" />;
}
