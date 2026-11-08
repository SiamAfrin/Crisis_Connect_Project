import type { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /**
   * Incremented after every action result. Forms use it as a key so the
   * browser's automatic form reset cannot leave controlled inputs displaying
   * stale DOM values after a validation error.
   */
  revision: number;
};

export const initialActionState: ActionState = {
  status: "idle",
  revision: 0,
};

/**
 * Converts a Zod error into the serialisable shape consumed by the auth and
 * profile forms. Only the first path segment is used because the forms are
 * flat.
 */
export function invalidState(
  error: ZodError,
  revision = 0,
  message = "Please correct the highlighted fields and try again.",
): ActionState {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }

  return {
    status: "error",
    message,
    fieldErrors,
    revision: revision + 1,
  };
}

export function errorState(
  message: string,
  revision = 0,
): ActionState {
  return {
    status: "error",
    message,
    revision: revision + 1,
  };
}
