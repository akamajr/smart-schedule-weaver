import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { lecturerSchedule } from "@/lib/mockData";
import {
  CalendarPlus, Download, MapPin, Users, MoreVertical, Sparkles, BookOpen,
  ChevronRight, Navigation, HelpCircle, Bell, Map,
} from "lucide-react";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";

const MyTimetable = () => {
  const { user } = useAuth();
  const displayName = user?.username ? `Dr. ${user.username.split(/[._]/)[0].replace(/^\w/, c => c.toUpperCase())}` : "Dr. Sterling";

  return (
    <div className="space-y-6 pb-24">
      {/* Top brand bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <InitialsAvatar seed={displayName} size={42} />
          <div>
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Senior Fellow</p>
          </div>
        </div>
        <p className="font-display text-sm font-bold tracking-wider text-foreground">THE SCHOLARLY CURATOR</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-2xl border-primary/40 text-primary hover:bg-primary-soft">
            <CalendarPlus className="mr-2 h-4 w-4" /> Sync to Calendar
          </Button>
          <Button className="rounded-2xl gradient-deep text-primary-foreground shadow-glow">
            <Download className="mr-2 h-4 w-4" /> Download Weekly PDF
          </Button>
          <div className="flex">
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><Bell className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground"><HelpCircle className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Good Morning, {displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Your Teaching Week at a Glance.</p>

          <div className="mt-6 space-y-8">
            {lecturerSchedule.map((day) => (
              <section key={day.day}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {day.day}
                </p>

                <div className="mt-3 space-y-3">
                  {day.sessions.map((s) => {
                    const isNow = s.status === "now";
                    return (
                      <div
                        key={s.code + s.time}
                        className={cn(
                          "flex flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 md:flex-row md:items-stretch",
                          isNow ? "border-l-4 border-l-primary border-border" : "border-border"
                        )}
                      >
                        <div className="md:w-44 shrink-0">
                          <p className={cn("text-sm font-semibold", isNow ? "text-primary" : "text-foreground")}>{s.time}</p>
                          {isNow && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" /> Now Teaching
                            </p>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                              <BookOpen className="h-3.5 w-3.5" />
                            </span>
                            <h3 className="font-display text-lg font-bold leading-tight">
                              {s.code}: {s.name}
                            </h3>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-1.5 font-medium text-primary">
                              <MapPin className="h-3.5 w-3.5" /> {s.venue}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-1.5 font-medium text-muted-foreground">
                              <Users className="h-3.5 w-3.5" /> {s.students} Students
                            </span>
                          </div>
                        </div>

                        <button className="self-start rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-primary/15 bg-primary-soft/60 p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Smart Insights</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Optimal Prep Time</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review "Lecture 4: Microservices" before 08:00 AM. 15 mins recommended.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                  <BookOpen className="h-4 w-4 text-success" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Guest Speaker Alert</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mark from TechCorp joining the afternoon DisMath session remotely.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="relative h-32 bg-gradient-to-br from-secondary via-muted to-secondary">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--background))_0%,transparent_70%)] opacity-50" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-deep shadow-glow">
                  <Navigation className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campus Navigator</p>
              <p className="mt-2 text-sm font-semibold">Engineering Hall B is 4 mins away via the Skywalk.</p>
              <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Open route <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer status bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current Venue</p>
              <p className="font-semibold">Eng. Hall B, Lvl 2</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next Up (01:00 PM)</p>
              <p className="font-semibold">Science Block 4</p>
            </div>
          </div>
          <p className="flex-1 text-xs text-muted-foreground sm:text-sm">
            <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground">!</span>
            Elevator in Block 4 is currently under maintenance. Use the north stairs.
          </p>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg">
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyTimetable;
