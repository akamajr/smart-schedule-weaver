import { useEffect, useState, useRef } from "react";
import { Bell, Moon, Sun, Menu, History, HelpCircle, LogOut, School, Building2, BookOpen, DoorOpen, Users, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Notification type ──────────────────────────────────────────────────────────
type Notif = {
  id: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  read: boolean;
  at: Date;
};

const relTime = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
};

// ── Component ─────────────────────────────────────────────────────────────────
export const Topbar = ({ onMenu }: { onMenu?: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const loadedRef = useRef(false);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // ── Build notifications from live DB counts ───────────────────────────────
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const build = async () => {
      const now = new Date();

      const [courses, halls, departments, faculties, lecturers] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("halls").select("id", { count: "exact", head: true }),
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("faculties").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
      ]);

      const list: Notif[] = [];

      if ((courses.count ?? 0) > 0) {
        list.push({
          id: "courses",
          title: `${courses.count} courses loaded`,
          body: `Course registry is populated and ready for scheduling.`,
          icon: <BookOpen className="h-4 w-4 text-primary" />,
          read: false,
          at: new Date(now.getTime() - 2 * 60000),
        });
      }

      if ((halls.count ?? 0) > 0) {
        list.push({
          id: "halls",
          title: `${halls.count} halls available`,
          body: `All exam venues are configured. ${halls.count} halls ready.`,
          icon: <DoorOpen className="h-4 w-4 text-violet-500" />,
          read: false,
          at: new Date(now.getTime() - 5 * 60000),
        });
      }

      if ((departments.count ?? 0) > 0) {
        list.push({
          id: "depts",
          title: `${departments.count} departments across ${faculties.count ?? 0} faculties`,
          body: "Academic structure is fully populated.",
          icon: <Building2 className="h-4 w-4 text-success" />,
          read: false,
          at: new Date(now.getTime() - 10 * 60000),
        });
      }

      if ((lecturers.count ?? 0) === 0) {
        list.push({
          id: "lecturers-warn",
          title: "No lecturers onboarded yet",
          body: "Invite lecturers to sign up so they can be assigned to courses.",
          icon: <Users className="h-4 w-4 text-warning" />,
          read: false,
          at: new Date(now.getTime() - 15 * 60000),
        });
      } else {
        list.push({
          id: "lecturers",
          title: `${lecturers.count} lecturer${(lecturers.count ?? 0) > 1 ? "s" : ""} active`,
          body: "Staff registry is up to date.",
          icon: <Users className="h-4 w-4 text-success" />,
          read: true,
          at: new Date(now.getTime() - 20 * 60000),
        });
      }

      if ((faculties.count ?? 0) > 0) {
        list.push({
          id: "faculties",
          title: `${faculties.count} faculties registered`,
          body: "Faculty registry loaded from production data.",
          icon: <School className="h-4 w-4 text-primary" />,
          read: true,
          at: new Date(now.getTime() - 30 * 60000),
        });
      }

      setNotifs(list);
    };

    build();
  }, []);

  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.displayName || user?.username || "User";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-8">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl text-muted-foreground hover:text-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <History className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Notification bell */}
        <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) { /* mark none auto—user sees them */ } }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-destructive px-1.5 text-[11px] font-bold leading-none text-white shadow-sm animate-pulse-soft"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 rounded-2xl p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="font-semibold text-sm">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs text-primary hover:bg-primary-soft" onClick={markAllRead}>
                  <Check className="mr-1 h-3 w-3" /> Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading notifications…
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border last:border-0",
                      !n.read && "bg-primary-soft/30"
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{relTime(n.at)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-4 py-2.5">
              <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground">
                View all activity
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile */}
        <div className="ml-1 flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role ?? "User"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <InitialsAvatar seed={displayName} size={38} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span>{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
