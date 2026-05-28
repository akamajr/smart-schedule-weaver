import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

const ResetPassword = () => {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    // Recovery flow: Supabase appends type=recovery in the URL hash.
    const hash = window.location.hash || "";
    setHasRecovery(hash.includes("type=recovery") || hash.includes("access_token"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error: err } = await updatePassword(parsed.data.password);
    setLoading(false);
    if (err) return setError(err);
    setDone(true);
    toast.success("Password updated. You can now sign in.");
    setTimeout(() => router.push("/login"), 1800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-elegant animate-fade-in">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} />
          <div>
            <p className="font-display text-base font-bold leading-none">SmartTimetable</p>
            <p className="mt-1 text-xs text-muted-foreground">Password reset</p>
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password you haven't used elsewhere.
          </p>
        </div>

        {!hasRecovery && (
          <div className="rounded-xl bg-warning-soft px-4 py-3 text-xs text-warning">
            This page expects a recovery link from your email. If you arrived here directly,
            request a new reset link from the sign-in page.
          </div>
        )}

        {done ? (
          <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft/40 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p>Password changed. Redirecting to sign in…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <PwdField id="new" label="New password" value={password} onChange={setPassword} show={show} setShow={setShow} />
            <PwdField id="confirm" label="Confirm password" value={confirm} onChange={setConfirm} show={show} setShow={setShow} />
            {error && <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
            </Button>
          </form>
        )}

        <button
          onClick={() => router.push("/login")}
          className="block w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};

const PwdField = ({
  id, label, value, onChange, show, setShow,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void;
}) => (
  <div>
    <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
    <div className="relative mt-2">
      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id} type={show ? "text" : "password"} placeholder="••••••••"
        value={value} onChange={(e) => onChange(e.target.value)} maxLength={72} required
        className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11 pr-11"
      />
      <button
        type="button" onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export default ResetPassword;
