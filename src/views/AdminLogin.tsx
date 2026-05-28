"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createAdminAccount } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Eye, EyeOff, AtSign, KeyRound, ShieldCheck, User as UserIcon, Lock
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandLogo } from "@/components/BrandLogo";

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

type View = "signin" | "signup";

interface AdminLoginProps {
  initialView?: View;
}

const AdminLogin = ({ initialView = "signin" }: AdminLoginProps) => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [view, setView] = useState<View>(initialView);

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign-up only
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const switchView = (v: View) => {
    setView(v);
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error: err } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (err) return setError(err);
    toast.success(`Admin Authentication Successful`);
    router.push("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!displayName || displayName.length < 2) return setError("Name must be at least 2 characters");
    if (!inviteCode) return setError("Invite code is required");
    
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("displayName", displayName);
    formData.append("inviteCode", inviteCode);

    const res = await createAdminAccount(formData);
    
    if (res.error) {
      setLoading(false);
      return setError(res.error);
    }
    
    // Once the user is created via the server action, sign them in on the client
    const { error: signinErr } = await signIn(email, password);
    setLoading(false);
    
    if (signinErr) {
      toast.success("Admin account created, but sign in failed. Please sign in manually.");
      switchView("signin");
      return;
    }
    
    toast.success(`Admin account created successfully!`);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-3xl shadow-elegant border border-border">
        
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="p-3 bg-primary-soft rounded-2xl">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">Authorized Personnel Only</p>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v) => switchView(v as View)}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-secondary/40 p-1">
            <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-5 pt-5">
              <EmailField email={email} setEmail={setEmail} />
              <PasswordField password={password} setPassword={setPassword} show={showPwd} setShow={setShowPwd} />
              {error && <ErrorBox text={error} />}
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating…</> : "Secure Sign In"}
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
                    placeholder="Admin Name" maxLength={80} required
                    className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
                  />
                </div>
              </div>
              
              <EmailField email={email} setEmail={setEmail} />
              <PasswordField password={password} setPassword={setPassword} show={showPwd} setShow={setShowPwd} />
              
              <div>
                <Label htmlFor="inviteCode" className="text-sm font-semibold">Secret Invite Code</Label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="inviteCode" type="password" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="••••••••" required
                    className="h-12 rounded-2xl border-transparent bg-primary-soft/60 pl-11"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Contact system owner to obtain an administrator invite code.
                </p>
              </div>

              {error && <ErrorBox text={error} />}
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl gradient-deep text-base font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning Account…</> : "Create Admin Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 text-center">
          <button type="button" onClick={() => router.push("/login")} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            Return to User Login
          </button>
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
        id="email" type="email" placeholder="admin@university.edu"
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
    <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
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
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

const ErrorBox = ({ text }: { text: string }) => (
  <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{text}</p>
);

export default AdminLogin;
