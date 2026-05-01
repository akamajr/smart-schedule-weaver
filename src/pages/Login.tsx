import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Eye, EyeOff, AtSign, KeyRound, Sparkles, Network, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/BrandLogo";

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(["Student", "Lecturer"]),
});

type SignupRole = "Student" | "Lecturer";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign-up only
  const [displayName, setDisplayName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("Student");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error: err } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (err) return setError(err);
    toast.success("Welcome back!");
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = signUpSchema.safeParse({ email, password, displayName, role: signupRole });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error: err } = await signUp(parsed.data);
    setLoading(false);
    if (err) return setError(err);
    toast.success(`Account created. Welcome, ${parsed.data.displayName}!`);
    navigate("/");
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setLoading(false);
      setError(err);
    }
    // On success the page redirects.
  };

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      {/* LEFT — Auth */}
      <div className="flex min-h-screen flex-col px-6 py-10 sm:px-12 lg:px-16">
        <div className="flex items-center gap-3">
          <BrandLogo size={48} />
          <div>
            <p className="font-display text-lg font-bold leading-none">SmartTimetable</p>
            <p className="mt-1 text-xs text-muted-foreground">AI Schedule Generator</p>
          </div>
        </div>

        <div className="my-auto w-full max-w-md space-y-6 animate-fade-in">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to manage your academic schedule."
                : "Join as a Student or Lecturer."}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => { setMode(v as "signin" | "signup"); setError(""); }}>
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-secondary/40 p-1">
              <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-5 pt-5">
                <EmailField email={email} setEmail={setEmail} />
                <PasswordField password={password} setPassword={setPassword} show={showPwd} setShow={setShowPwd} />
                {error && <ErrorBox text={error} />}
                <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5 pt-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                  <div className="relative mt-2">
                    <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe" maxLength={80} required
                      className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
                    />
                  </div>
                </div>
                <EmailField email={email} setEmail={setEmail} />
                <PasswordField password={password} setPassword={setPassword} show={showPwd} setShow={setShowPwd} />

                <div>
                  <Label className="text-sm font-semibold">Sign up as</Label>
                  <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-secondary/40 p-1">
                    {(["Student", "Lecturer"] as SignupRole[]).map((r) => {
                      const active = signupRole === r;
                      return (
                        <button
                          key={r} type="button" onClick={() => setSignupRole(r)}
                          className={cn(
                            "rounded-xl py-2.5 text-sm font-semibold transition-smooth",
                            active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Admin accounts are created internally and cannot be self-registered.
                  </p>
                </div>

                {error && <ErrorBox text={error} />}
                <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card text-sm font-semibold transition-smooth hover:border-primary/40 hover:bg-primary-soft disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SmartTimetable</span>
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

const EmailField = ({ email, setEmail }: { email: string; setEmail: (v: string) => void }) => (
  <div>
    <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
    <div className="relative mt-2">
      <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="email" type="email" placeholder="name@university.edu"
        value={email} onChange={(e) => setEmail(e.target.value)}
        maxLength={255} required
        className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
      />
    </div>
  </div>
);

const PasswordField = ({
  password, setPassword, show, setShow,
}: {
  password: string; setPassword: (v: string) => void; show: boolean; setShow: (v: boolean) => void;
}) => (
  <div>
    <div className="flex items-center justify-between">
      <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
    </div>
    <div className="relative mt-2">
      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="password" type={show ? "text" : "password"} placeholder="••••••••"
        value={password} onChange={(e) => setPassword(e.target.value)}
        maxLength={72} required
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

const ErrorBox = ({ text }: { text: string }) => (
  <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{text}</p>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

export default Login;
