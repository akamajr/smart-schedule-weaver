import { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_pinned");
    if (stored) {
      setIsPinned(stored === "true");
    }
  }, []);

  const handleTogglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    localStorage.setItem("sidebar_pinned", String(next));
  };

  const isCollapsed = !isPinned && !sidebarHoverOpen;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="sticky top-0 z-[80] hidden h-screen w-[70px] shrink-0 md:block">
        <Sidebar
          collapsed={isCollapsed}
          isPinned={isPinned}
          onTogglePin={handleTogglePin}
          onMouseEnter={() => setSidebarHoverOpen(true)}
          onMouseLeave={() => setSidebarHoverOpen(false)}
          floating
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar onNavigate={() => setOpen(false)} collapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
