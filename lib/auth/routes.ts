import type { AppEnums, Tables } from "@/types/database";

type ProfileRouting = Pick<Tables<"profiles">, "role" | "account_status">;

const ROLE_HOME: Readonly<Record<AppEnums["user_role"], string>> = {
  victim: "/victim/dashboard",
  volunteer: "/volunteer/dashboard",
  rescue_team_member: "/rescue/dashboard",
  administrator: "/admin/dashboard",
};

export const ACCOUNT_STATUS_PATH = "/account-status";
export const PROFILE_PATH = "/profile";
export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

/**
 * Returns the landing page for an active role.
 */
export function getRoleHome(role: AppEnums["user_role"]): string {
  return ROLE_HOME[role];
}

/**
 * Returns the page a profile is allowed to land on. Pending and rejected
 * responder accounts are sent to the account-status page instead of any
 * role-specific dashboard.
 */
export function getHomePathForProfile(profile: ProfileRouting): string {
  if (profile.account_status !== "active") {
    return ACCOUNT_STATUS_PATH;
  }

  return getRoleHome(profile.role);
}

export const PROTECTED_ROUTE_PREFIXES = [
  ACCOUNT_STATUS_PATH,
  PROFILE_PATH,
  "/victim",
  "/volunteer",
  "/rescue",
  "/admin",
] as const;

/**
 * Accepts only same-origin absolute paths. This prevents the `next` query
 * parameter from becoming an open redirect.
 */
export function sanitizeNextPath(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.startsWith("/login") ||
    trimmed.startsWith("/register")
  ) {
    return null;
  }

  return trimmed;
}

export function getLoginPath(nextPath?: string | null): string {
  const safeNext = sanitizeNextPath(nextPath);

  return safeNext
    ? `${LOGIN_PATH}?next=${encodeURIComponent(safeNext)}`
    : LOGIN_PATH;
}
