import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap, Loader2, Eye, EyeOff, AtSign, KeyRound, QrCode, Lock, Sparkles, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
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
      {/* LEFT — Login */}
      <div className="flex min-h-screen flex-col px-6 py-10 sm:px-12 lg:px-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <BrandLogo size={48} />
          <div>
            <p className="font-display text-lg font-bold leading-none">SmartTimetable</p>
            <p className="mt-1 text-xs text-muted-foreground">AI Schedule Generator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="my-auto w-full max-w-md space-y-7 animate-fade-in">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Optimize your academic schedule.</p>
          </div>

          {/* Role pill */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-secondary/40 p-1">
            {(["Admin", "Lecturer"] as Role[]).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-xl py-3 text-sm font-semibold transition-smooth",
                    active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <div className="relative mt-2">
                <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <button type="button" className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
            ) : "Sign In"}
          </Button>

          {/* Access protocol divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Access Protocol</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => toast.info("QR login coming soon")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold transition-smooth hover:border-primary/40 hover:bg-primary-soft"
            >
              <QrCode className="h-4 w-4" /> QR Login
            </button>
            <button
              type="button"
              onClick={() => toast.info("SSO not configured")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold transition-smooth hover:border-primary/40 hover:bg-primary-soft"
            >
              <Lock className="h-4 w-4" /> SSO
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Smart Timetable AI</span>
          <button className="font-medium text-primary hover:underline">Contact Support</button>
        </div>
      </div>

      {/* RIGHT — Visual */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-soft via-background to-success-soft lg:flex lg:flex-col lg:justify-between p-12">
        <div className="max-w-md animate-scale-in">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-soft">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight">Algorithmic Efficiency</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Our genetic algorithms process thousands of scheduling variables in seconds, ensuring
            conflict-free academic environments.
          </p>
        </div>

        {/* Floating tile composition */}
        <div className="relative mx-auto my-8 grid h-[360px] w-full max-w-md grid-cols-3 grid-rows-3 gap-4">
          <div className="rounded-2xl bg-primary/30" />
          <div className="rounded-2xl bg-primary-soft" />
          <div className="rounded-2xl bg-primary/15" />
          <div className="rounded-2xl bg-[hsl(160_55%_55%/0.55)]" />
          <div className="z-10 flex items-center justify-center rounded-3xl bg-card shadow-elegant">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-deep shadow-glow">
              <Network className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div className="rounded-2xl bg-primary-deep" />
          <div className="rounded-2xl bg-primary-soft" />
          <div className="rounded-2xl bg-[hsl(160_55%_45%)]" />
          <div className="rounded-2xl bg-primary-soft/70" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["Aiden", "Bea", "Cyrus"].map((s) => (
                <div key={s} className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-primary to-primary-deep" />
              ))}
            </div>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">+2k</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
            System Operational
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
