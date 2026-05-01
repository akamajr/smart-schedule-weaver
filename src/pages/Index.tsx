import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "Admin") return <Navigate to="/dashboard" replace />;
  if (user.role === "Lecturer") return <Navigate to="/my-timetable" replace />;
  return <Navigate to="/courses-catalog" replace />;
};

export default Index;
