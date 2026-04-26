import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarRange, Loader2, ShieldCheck, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Please enter a valid email");
    if (password.length < 4) return setError("Password must be at least 4 characters");
    setLoading(true);
    setTimeout(() => {
      login(email, password, role);
      toast.success(`Welcome back, ${role}!`);
      setLoading(false);
      navigate(role === "Admin" ? "/dashboard" : "/my-timetable");
    }, 700);
  };

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      {/* Left visual panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(0_0%_100%/0.2),transparent_60%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <CalendarRange className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">SmartTime</span>
          </div>

          <div className="space-y-6 max-w-md animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered scheduling
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Smart Timetables.
              <br />
              Zero Conflicts.
            </h1>
            <p className="text-base text-white/85">
              Generate optimized class schedules in seconds. Detect conflicts, balance workloads, and keep
              every lecturer and room in sync.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { v: "12k+", l: "Sessions" },
                { v: "98%", l: "Accuracy" },
                { v: "0", l: "Conflicts" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <p className="font-display text-xl font-bold">{s.v}</p>
                  <p className="text-xs text-white/75">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/70">© {new Date().getFullYear()} SmartTime · Built for academia</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 animate-scale-in">
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow lg:hidden">
              <CalendarRange className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose your role to continue</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["Admin", "Lecturer"] as Role[]).map((r) => {
              const Icon = r === "Admin" ? ShieldCheck : GraduationCap;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-smooth",
                    active
                      ? "border-primary bg-primary-soft shadow-soft"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{r}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {r === "Admin" ? "Manage everything" : "View my schedule"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email or username</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@uni.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl gradient-primary text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              `Sign in as ${role}`
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo: enter any email + password (4+ chars).
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
