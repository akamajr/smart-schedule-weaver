import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
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
  GraduationCap,
  HelpCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/lecturers", label: "Lecturers", icon: Users },
  { to: "/classrooms", label: "Classrooms", icon: DoorOpen },
  { to: "/generator", label: "AI Generator", icon: Sparkles },
  { to: "/conflicts", label: "Conflicts & Alerts", icon: AlertTriangle },
  { to: "/ai", label: "Resource Lab", icon: CalendarRange },
  { to: "/settings", label: "System Settings", icon: Settings },
];

const lecturerLinks = [
  { to: "/my-timetable", label: "My Schedule", icon: CalendarCheck },
];

const studentLinks = [
  { to: "/courses-catalog", label: "Course Catalog", icon: BookOpen },
];

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "Admin";
  const isStudent = user?.role === "Student";
  const links = isAdmin ? adminLinks : isStudent ? studentLinks : lecturerLinks;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <BrandLogo size={44} />
        <div>
          <p className="font-display text-base font-bold leading-none">SmartTimetable</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {isAdmin ? "AI Schedule Generator" : "Faculty Portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
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
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {label}
            </NavLink>
          );
        })}

        {!isAdmin && (
          <div className="pt-1">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                settingsOpen
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
              aria-expanded={settingsOpen}
            >
              <Settings className={cn("h-4 w-4", settingsOpen && "text-primary")} />
              Settings
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 transition-transform",
                  settingsOpen && "rotate-180"
                )}
              />
            </button>
            {settingsOpen && (
              <div className="mt-1 ml-4 border-l border-border pl-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-smooth hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="space-y-3 px-4 pb-3 pt-4">
        {isAdmin && (
          <Button
            onClick={() => navigate("/generator")}
            className="h-11 w-full rounded-xl gradient-deep text-primary-foreground shadow-glow transition-smooth hover:opacity-95"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Quick Schedule
          </Button>
        )}
      </div>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <button
          onClick={() => {/* support stub */}}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Support
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-smooth hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
