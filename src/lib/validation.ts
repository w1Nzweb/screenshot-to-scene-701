export const USERNAME_RE = /^[A-Za-z0-9_.]{3,24}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "At least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Use letters and numbers.";
  return null;
}

export type AppRole = "owner" | "admin" | "moderator" | "support" | "user";
export const ROLES: AppRole[] = ["owner", "admin", "moderator", "support", "user"];
export const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  moderator: "Moderator",
  support: "Support",
  user: "User",
};
export const ROLE_RANK: Record<AppRole, number> = { owner: 5, admin: 4, moderator: 3, support: 2, user: 1 };
export const atLeast = (role: AppRole | undefined | null, min: AppRole) =>
  ROLE_RANK[role ?? "user"] >= ROLE_RANK[min];

/** Whether `actor` may set `target` (currently `current`) to `next`. Mirrors server rules. */
export function canAssignRole(actor: AppRole, current: AppRole, next: AppRole, isSelf: boolean): string | null {
  if (isSelf) return "You cannot change your own role.";
  if (current === "owner") return "The Owner role can only change through ownership transfer.";
  if (next === "owner") return "Use ownership transfer to assign Owner.";
  if (!atLeast(actor, "admin")) return "Only administrators can change roles.";
  if (ROLE_RANK[current] >= ROLE_RANK[actor]) return "You cannot change an account at or above your level.";
  if (ROLE_RANK[next] >= ROLE_RANK[actor]) return "You cannot grant a role at or above your level.";
  return null;
}
