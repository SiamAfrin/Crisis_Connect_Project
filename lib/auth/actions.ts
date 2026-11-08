"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import {
  errorState,
  invalidState,
  type ActionState,
} from "./action-state";
import { ensureProfileForUser } from "./profile";
import {
  getHomePathForProfile,
  sanitizeNextPath,
} from "./routes";
import {
  loginSchema,
  profileUpdateSchema,
  registerSchema,
} from "./schemas";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptional(formData: FormData, key: string): string | undefined {
  const value = readString(formData, key).trim();
  return value.length > 0 ? value : undefined;
}

function describeSignUpError(error: AuthError): string {
  if (
    error.code === "user_already_exists" ||
    /already registered/i.test(error.message)
  ) {
    return "An account with this email already exists. Log in instead.";
  }

  if (error.code === "weak_password") {
    return error.message;
  }

  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit"
  ) {
    return "Too many attempts. Wait a moment and try again.";
  }

  return `We could not create your account: ${error.message}`;
}

function describeLoginError(error: AuthError): string {
  if (
    error.code === "invalid_credentials" ||
    /invalid login credentials/i.test(error.message)
  ) {
    return "Email or password is incorrect.";
  }

  if (error.code === "email_not_confirmed") {
    return "This account still needs email confirmation. Email confirmation must be disabled for Crisis Connect.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit"
  ) {
    return "Too many attempts. Wait a moment and try again.";
  }

  return `We could not sign you in: ${error.message}`;
}

export async function registerAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: readString(formData, "fullName"),
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
    phone: readString(formData, "phone"),
    address: readString(formData, "address"),
    role: readString(formData, "role"),
    rescueTeamCategory: readOptional(formData, "rescueTeamCategory"),
    defenceSubcategory: readOptional(formData, "defenceSubcategory"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const input = parsed.data;
  const rescueTeamCategory =
    input.role === "rescue_team_member"
      ? (input.rescueTeamCategory ?? null)
      : null;
  const defenceSubcategory =
    rescueTeamCategory === "defence"
      ? (input.defenceSubcategory ?? null)
      : null;
  const accountStatus =
    input.role === "victim" ? "active" : "pending";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        fullName: input.fullName,
        phone: input.phone,
        address: input.address,
        role: input.role,
        rescueTeamCategory,
        defenceSubcategory,
      },
    },
  });

  if (error) {
    return errorState(
      describeSignUpError(error),
      previousState.revision,
    );
  }

  if (!data.user) {
    return errorState(
      "Your account could not be created. Please try again.",
      previousState.revision,
    );
  }

  if (!data.session) {
    return errorState(
      "Your account was created, but Supabase email confirmation is enabled. Ask an administrator to disable email confirmation, then log in to finish setting up your profile.",
      previousState.revision,
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: data.user.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      role: input.role,
      rescue_team_category: rescueTeamCategory,
      defence_subcategory: defenceSubcategory,
      account_status: accountStatus,
    });

  if (profileError) {
    // Do not leave the browser authenticated with a half-created account.
    // The sign-up metadata is still available, so a later login can repair the
    // profile if the failure was transient.
    await supabase.auth.signOut();

    return errorState(
      "Your account was created, but your profile could not be saved. Log in to retry profile setup, or contact an administrator.",
      previousState.revision,
    );
  }

  redirect(
    getHomePathForProfile({
      role: input.role,
      account_status: accountStatus,
    }),
  );
}

export async function loginAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: readString(formData, "email"),
    password: readString(formData, "password"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return errorState(
      describeLoginError(error),
      previousState.revision,
    );
  }

  if (!data.user) {
    return errorState(
      "We could not sign you in. Please try again.",
      previousState.revision,
    );
  }

  const profileResult = await ensureProfileForUser(supabase, data.user);

  if (!profileResult.ok) {
    if (profileResult.reason === "missing_seed") {
      await supabase.auth.signOut();
    }

    return errorState(profileResult.error, previousState.revision);
  }

  const requestedPath = sanitizeNextPath(readString(formData, "next"));
  const destination =
    profileResult.profile.account_status === "active" && requestedPath
      ? requestedPath
      : getHomePathForProfile(profileResult.profile);

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  // Log out immediately. There is intentionally no confirmation step.
  await supabase.auth.signOut();

  redirect("/login");
}

export async function updateProfileAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = profileUpdateSchema.safeParse({
    fullName: readString(formData, "fullName"),
    phone: readString(formData, "phone"),
    address: readString(formData, "address"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  // Only these three columns are sent. Role, email, and account status are
  // never accepted from the form and remain immutable.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      address: parsed.data.address,
    })
    .eq("id", user.id);

  if (error) {
    return errorState(
      `Your profile could not be updated: ${error.message}`,
      previousState.revision,
    );
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Your profile has been updated.",
    revision: previousState.revision + 1,
  };
}
