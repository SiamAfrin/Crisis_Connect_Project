import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { AppEnums, Tables } from "@/types/database";

import { fetchProfile } from "./profile";
import { getHomePathForProfile, getLoginPath } from "./routes";

export type ProfileContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
    email?: string;
  };
  profile: Tables<"profiles">;
};

/**
 * Reads the current session and profile once per request. A session read can
 * never be cached across users because the Supabase client is request-scoped
 * and React's cache only lives for the current request.
 */
const loadProfileContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const result = await fetchProfile(supabase, user.id);

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: result.profile,
  };
});

/**
 * Requires an authenticated user with a profile. Missing profiles are sent to
 * the login page, where the login action can repair a partially created
 * account from validated sign-up metadata.
 */
export async function requireProfile(): Promise<ProfileContext> {
  const context = await loadProfileContext();

  if (!context) {
    redirect(getLoginPath());
  }

  if (!context.profile) {
    redirect("/login?notice=profile-missing");
  }

  return {
    supabase: context.supabase,
    user: context.user,
    profile: context.profile,
  };
}

/**
 * Requires an authenticated user and redirects to the login page when absent.
 * Used by pages that do not need to read a profile.
 */
export async function requireUser(): Promise<{
  supabase: SupabaseServerClient;
  user: { id: string; email?: string };
}> {
  const context = await loadProfileContext();

  if (!context) {
    redirect(getLoginPath());
  }

  return {
    supabase: context.supabase,
    user: context.user,
  };
}

/**
 * Server-side role authorization. Pending and rejected accounts are sent to
 * the account-status page, and a user who is signed in with the wrong active
 * role is sent to their own dashboard.
 */
export async function requireActiveRole(
  role: AppEnums["user_role"],
): Promise<ProfileContext> {
  const context = await requireProfile();

  if (context.profile.account_status !== "active") {
    redirect("/account-status");
  }

  if (context.profile.role !== role) {
    redirect(getHomePathForProfile(context.profile));
  }

  return context;
}

/**
 * Server-side authorization for the responder dashboards. Only active
 * volunteers and rescue team members may pass.
 */
export async function requireActiveResponder(
  role?: Extract<
    AppEnums["user_role"],
    "volunteer" | "rescue_team_member"
  >,
): Promise<ProfileContext> {
  const context = await requireProfile();

  if (context.profile.account_status !== "active") {
    redirect("/account-status");
  }

  if (
    context.profile.role !== "volunteer" &&
    context.profile.role !== "rescue_team_member"
  ) {
    redirect(getHomePathForProfile(context.profile));
  }

  if (role && context.profile.role !== role) {
    redirect(getHomePathForProfile(context.profile));
  }

  return context;
}
