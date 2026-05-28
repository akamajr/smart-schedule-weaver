import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const roleHome: Record<Role, string> = {
  Admin: "/dashboard",
  Lecturer: "/my-timetable",
  Student: "/courses-catalog",
};

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(roleHome[user.role]);
    }
  }, [loading, roles, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return children;
};
