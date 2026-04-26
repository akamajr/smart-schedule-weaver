import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/auth";

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: Role[];
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};
