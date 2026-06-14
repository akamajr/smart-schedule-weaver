import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  School,
  Building2,
  PencilRuler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculties", label: "Faculties", icon: School },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/lecturers", label: "Lecturers", icon: Users },
  { to: "/classrooms", label: "Classrooms", icon: DoorOpen },
  { to: "/manual-timetable", label: "Manual Timetable", icon: PencilRuler },
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

type SidebarProps = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  floating?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
};

export const Sidebar = ({
  onNavigate,
  collapsed = false,
  onMouseEnter,
  onMouseLeave,
  floating = false,
  isPinned = false,
  onTogglePin,
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "Admin";
  const isStudent = user?.role === "Student";
  const links = isAdmin ? adminLinks : isStudent ? studentLinks : lecturerLinks;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-[70px]" : "w-64 shadow-xl",
        floating && "absolute left-0 top-0 z-[90]",
      )}
    >
      {/* Toggle Pin Button */}
      {onTogglePin && (
        <div className={cn("flex items-center justify-between px-4 pb-2 pt-4 border-b border-border/50", collapsed && "justify-center px-2")}>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider text-muted-foreground", collapsed && "hidden")}>
            Navigation
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onTogglePin}
            title={isPinned ? "Collapse Sidebar" : "Pin Sidebar"}
          >
            {isPinned ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 pb-5 pt-5", collapsed && "justify-center px-2")}>
        <BrandLogo size={44} />
        <div className={cn(collapsed && "hidden")}>
          <p className="font-display text-base font-bold leading-none">SmartTimetable</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {isAdmin ? "AI Schedule Generator" : "Faculty Portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          const link = (
            <Link
              key={to}
              href={to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              <span className={cn(collapsed && "hidden")}>{label}</span>
            </Link>
          );
          return collapsed ? (
            <Tooltip key={to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ) : link;
        })}

        {!isAdmin && (
          <div className="pt-1">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                collapsed && "justify-center px-2",
                settingsOpen
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
              aria-expanded={settingsOpen}
            >
              <Settings className={cn("h-4 w-4", settingsOpen && "text-primary")} />
              <span className={cn(collapsed && "hidden")}>Settings</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 transition-transform",
                  collapsed && "hidden",
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => router.push("/manual-timetable")}
                className={cn("h-11 w-full rounded-xl gradient-deep text-primary-foreground shadow-glow transition-smooth hover:opacity-95", collapsed && "px-0")}
              >
                <Plus className={cn("h-4 w-4", !collapsed && "mr-1.5")} />
                <span className={cn(collapsed && "hidden")}>Create Timetable</span>
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Create Timetable</TooltipContent>}
          </Tooltip>
        )}
      </div>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <SidebarAction collapsed={collapsed} label="Support" icon={HelpCircle} onClick={() => {/* support stub */}} />
        <SidebarAction collapsed={collapsed} label="Sign Out" icon={LogOut} onClick={handleLogout} destructive />
      </div>
    </aside>
  );
};

const SidebarAction = ({
  collapsed,
  label,
  icon: Icon,
  onClick,
  destructive = false,
}: {
  collapsed: boolean;
  label: string;
  icon: typeof HelpCircle;
  onClick: () => void;
  destructive?: boolean;
}) => {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
        collapsed && "justify-center px-2",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn(collapsed && "hidden")}>{label}</span>
    </button>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : button;
};
