import { Bell, Search, Moon, Sun, Menu, History, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Topbar = ({ onMenu }: { onMenu?: () => void }) => {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-8">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 max-w-xl md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search academic records..."
          className="h-11 rounded-2xl border-transparent bg-primary-soft/60 pl-11 text-sm placeholder:text-muted-foreground/80 focus-visible:bg-card focus-visible:ring-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl text-muted-foreground hover:text-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <History className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hidden sm:inline-flex">
          <HelpCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive animate-pulse-soft" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-2xl">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="font-medium">3 conflicts detected</span>
              <span className="text-xs text-muted-foreground">Tap Conflicts to resolve</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="font-medium">AI suggestion ready</span>
              <span className="text-xs text-muted-foreground">Optimized 2 sessions for next week</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 py-2.5">
              <span className="font-medium">New lecturer onboarded</span>
              <span className="text-xs text-muted-foreground">Dr. Emmy Noether — Pure Mathematics</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-1 flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold leading-none">{user?.role === "Admin" ? "Dr. Julian Vance" : `Dr. ${user?.username}`}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role === "Admin" ? "Head Administrator" : "Senior Fellow"}</p>
          </div>
          <InitialsAvatar seed={user?.username || "User"} size={38} />
        </div>
      </div>
    </header>
  );
};
