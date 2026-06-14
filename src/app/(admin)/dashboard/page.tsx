import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DashboardUI = dynamic(() => import("./_components/DashboardUI"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardUI />;
}
