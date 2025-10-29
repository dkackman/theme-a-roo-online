// User role types
export type UserRole = "admin" | "user" | "creator";

// Extended user type with role
export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}
