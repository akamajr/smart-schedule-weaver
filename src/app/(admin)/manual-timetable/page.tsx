import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ManualTimetableUI = dynamic(() => import("./_components/ManualTimetableUI"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export default function ManualTimetablePage() {
  return <ManualTimetableUI />;
}
