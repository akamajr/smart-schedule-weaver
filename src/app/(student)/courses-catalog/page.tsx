import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const StudentCoursesUI = dynamic(() => import("./_components/StudentCoursesUI"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export default function CoursesCatalogPage() {
  return <StudentCoursesUI />;
}
