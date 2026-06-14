import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LoginUI = dynamic(() => import("./_components/LoginUI"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export default function LoginPage() {
  return <LoginUI />;
}
