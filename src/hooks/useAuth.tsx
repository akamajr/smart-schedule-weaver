import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

import type { AuthUser, Role } from "@/lib/auth";

type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
  role: Exclude<Role, "Admin">; // Admin is never granted via regular signup
  departmentId?: string;
  level?: number;
};

type Ctx = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const fetchUserContext = async (session: Session): Promise<AuthUser> => {
  const userId = session.user.id;
  const email = session.user.email ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();

  // Map DB role ("admin" | "lecturer" | "student") to app Role type
  const roleMap: Record<string, Role> = {
    admin: "Admin",
    lecturer: "Lecturer",
    student: "Student",
  };
  const role: Role = roleMap[profile?.role ?? ""] ?? "Student";

  return {
    id: userId,
    email,
    username: profile?.full_name || email.split("@")[0] || "user",
    role,
    displayName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setUser(null);
      return;
    }
    try {
      const u = await fetchUserContext(s);
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Set up listener BEFORE getSession (Supabase pattern).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer profile/role fetch to avoid deadlocks inside the callback.
      setSession(s);
      if (s) {
        setTimeout(() => {
          fetchUserContext(s).then(setUser).catch(() => setUser(null));
        }, 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      hydrate(data.session).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signIn: Ctx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: Ctx["signUp"] = async ({ email, password, displayName, role, departmentId, level }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { 
          display_name: displayName, 
          role,
          department_id: departmentId,
          level
        },
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle: Ctx["signInWithGoogle"] = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const resetPassword: Ctx["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword: Ctx["updatePassword"] = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  const value = useMemo<Ctx>(
    () => ({ user, session, loading, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, logout, refresh }),
    [user, session, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
