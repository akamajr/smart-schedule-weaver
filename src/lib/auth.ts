// Role types — real role data lives in the user_roles table on the backend.
export type Role = "Admin" | "Lecturer" | "Student";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  displayName?: string | null;
  avatarUrl?: string | null;
};
