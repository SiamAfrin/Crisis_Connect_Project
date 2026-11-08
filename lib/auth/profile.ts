import "server-only";

import type { User } from "@supabase/supabase-js";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AppEnums, Tables } from "@/types/database";

import { parseProfileSeed } from "./schemas";

export type ProfileRow = Tables<"profiles">;

type ProfileResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; reason: "database"; error: string }
  | { ok: false; reason: "missing_seed"; error: string };

function accountStatusForRole(
  role: AppEnums["user_role"],
): AppEnums["account_status"] {
  return role === "victim" ? "active" : "pending";
}

export async function fetchProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ profile: ProfileRow | null; error?: string }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data };
}

/**
 * Reads the profile for an auth user. If the profile is missing but the auth
 * user contains a valid registration seed in its metadata, the profile is
 * recreated. The role and account status are always derived from the
 * validated seed and never trusted directly from the browser.
 *
 * This is only called from the login action. It is not used while rendering,
 * so profile creation never happens as a side effect of a page request.
 */
export async function ensureProfileForUser(
  supabase: SupabaseServerClient,
  user: User,
): Promise<ProfileResult> {
  const existing = await fetchProfile(supabase, user.id);

  if (existing.error) {
    return {
      ok: false,
      reason: "database",
      error: existing.error,
    };
  }

  if (existing.profile) {
    return { ok: true, profile: existing.profile };
  }

  const seed = parseProfileSeed(user.user_metadata);

  if (!seed) {
    return {
      ok: false,
      reason: "missing_seed",
      error:
        "This account does not have a Crisis Connect profile yet. Contact an administrator to finish setting it up.",
    };
  }

  const rescueTeamCategory =
    seed.role === "rescue_team_member"
      ? (seed.rescueTeamCategory ?? null)
      : null;
  const defenceSubcategory =
    rescueTeamCategory === "defence"
      ? (seed.defenceSubcategory ?? null)
      : null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: seed.fullName,
      email: user.email?.trim().toLowerCase() ?? "",
      phone: seed.phone,
      address: seed.address,
      role: seed.role,
      rescue_team_category: rescueTeamCategory,
      defence_subcategory: defenceSubcategory,
      account_status: accountStatusForRole(seed.role),
    })
    .select("*")
    .single();

  if (error) {
    // A concurrent request may have created the row between the select and the
    // insert. Re-read once before reporting a failure.
    if (error.code === "23505") {
      const retry = await fetchProfile(supabase, user.id);

      if (retry.profile) {
        return { ok: true, profile: retry.profile };
      }
    }

    return {
      ok: false,
      reason: "database",
      error: error.message,
    };
  }

  return { ok: true, profile: data };
}
