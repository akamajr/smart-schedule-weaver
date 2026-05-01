import { Navigate } from "react-router-dom";
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
  children: JSX.Element;
  roles?: Role[];
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }
  return children;
};
