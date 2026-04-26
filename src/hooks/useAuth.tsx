import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authService, AuthUser, Role } from "@/lib/auth";

type Ctx = {
  user: AuthUser | null;
  login: (email: string, password: string, role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.current());

  useEffect(() => {
    setUser(authService.current());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      login: (email, password, role) => setUser(authService.login(email, password, role)),
      logout: () => {
        authService.logout();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
