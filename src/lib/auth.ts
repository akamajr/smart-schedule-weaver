export type Role = "Admin" | "Lecturer";

export type AuthUser = {
  username: string;
  email: string;
  role: Role;
};

const KEY = "stt_auth_user";

export const authService = {
  login(email: string, _password: string, role: Role): AuthUser {
    const user: AuthUser = {
      username: email.split("@")[0] || "user",
      email,
      role,
    };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  logout() {
    localStorage.removeItem(KEY);
  },
  current(): AuthUser | null {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
