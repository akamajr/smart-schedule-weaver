import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "Admin" ? "/dashboard" : "/my-timetable"} replace />;
};

export default Index;
