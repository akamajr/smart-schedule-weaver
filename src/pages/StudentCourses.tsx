import { useMemo, useState } from "react";
import { courses, lecturers } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Search, User } from "lucide-react";

const StudentCourses = () => {
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState<"All" | "First" | "Second">("All");

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    []
  );

  const filtered = courses.filter((c) => {
    const matchesQuery =
      !query ||
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase());
    const matchesSem = semester === "All" || c.semester === semester;
    return matchesQuery && matchesSem;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Course Catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse all courses offered this academic year.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <Tabs value={semester} onValueChange={(v) => setSemester(v as typeof semester)}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="First">First Semester</TabsTrigger>
            <TabsTrigger value="Second">Second Semester</TabsTrigger>
          </TabsList>
          <TabsContent value={semester} />
        </Tabs>
      </div>

      {/* Pinterest-style masonry */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-5">
        {filtered.map((c) => {
          const lecturer = lecturerById[c.lecturerId];
          return (
            <article
              key={c.id}
              className="break-inside-avoid rounded-3xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {c.semester} Sem
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.code}
              </p>
              <p className="mt-1 font-display text-lg font-bold leading-snug">{c.name}</p>
              {lecturer && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {lecturer.title} {lecturer.name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5">{c.credits} credits</span>
                <span className="rounded-full bg-secondary px-2 py-0.5">{c.level}</span>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No courses match your search.</p>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
