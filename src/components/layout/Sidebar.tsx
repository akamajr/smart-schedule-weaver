import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  DoorOpen,
  CalendarRange,
  Sparkles,
  AlertTriangle,
  Settings,
  LogOut,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/lecturers", label: "Lecturers", icon: Users },
  { to: "/classrooms", label: "Classrooms", icon: DoorOpen },
  { to: "/generator", label: "Timetable Generator", icon: CalendarRange },
  { to: "/ai", label: "AI Scheduler", icon: Sparkles },
  { to: "/conflicts", label: "Conflicts", icon: AlertTriangle },
  { to: "/settings", label: "Settings & Users", icon: Settings },
];

const lecturerLinks = [
  { to: "/my-timetable", label: "My Timetable", icon: CalendarCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === "Admin" ? adminLinks : lecturerLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <CalendarRange className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-display font-bold leading-none">SmartTime</p>
          <p className="text-[10px] text-muted-foreground">Timetable AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};
