import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AppEnums, Tables } from "@/types/database";

export const RESPONDER_ROLES = [
  "volunteer",
  "rescue_team_member",
] as const;

export type ResponderProfile = Tables<"profiles">;

export type ResponderCounts = {
  pending: number;
  active: number;
  rejected: number;
};

const EMPTY_COUNTS: ResponderCounts = {
  pending: 0,
  active: 0,
  rejected: 0,
};

/**
 * Lists volunteer and rescue team profiles in one account status. RLS already
 * limits these rows to active administrators; the role and status filters keep
 * victims and administrators out of the approval interface.
 */
export async function listRespondersByStatus(
  supabase: SupabaseServerClient,
  status: AppEnums["account_status"],
  limit = 100,
): Promise<{ responders: ResponderProfile[]; error?: string }> {
  const isPending = status === "pending";
  const orderColumn = isPending ? "created_at" : "updated_at";

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", [...RESPONDER_ROLES])
    .eq("account_status", status)
    .order(orderColumn, { ascending: isPending })
    .limit(limit);

  if (error) {
    return { responders: [], error: error.message };
  }

  return { responders: data ?? [] };
}

/**
 * Counts responder registrations by approval status without downloading every
 * profile row.
 */
export async function getResponderCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: ResponderCounts; error?: string }> {
  const countFor = (status: AppEnums["account_status"]) =>
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", [...RESPONDER_ROLES])
      .eq("account_status", status);

  const [pending, active, rejected] = await Promise.all([
    countFor("pending"),
    countFor("active"),
    countFor("rejected"),
  ]);

  const error =
    pending.error ?? active.error ?? rejected.error;

  if (error) {
    return { counts: EMPTY_COUNTS, error: error.message };
  }

  return {
    counts: {
      pending: pending.count ?? 0,
      active: active.count ?? 0,
      rejected: rejected.count ?? 0,
    },
  };
}

export type EmergencyRequestVictim = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "phone" | "address"
>;

export type AdminEmergencyRequest = {
  request: Tables<"emergency_requests">;
  victim: EmergencyRequestVictim | null;
};

export type EmergencyRequestCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

const EMPTY_REQUEST_COUNTS: EmergencyRequestCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
};

/**
 * Lists emergency requests in one review status with the submitting victim's
 * contact details. RLS already limits these rows to active administrators; the
 * status filter keeps pending work separate from reviewed history.
 */
export async function listEmergencyRequestsByStatus(
  supabase: SupabaseServerClient,
  status: AppEnums["request_status"],
  limit = 100,
): Promise<{ items: AdminEmergencyRequest[]; error?: string }> {
  const isPending = status === "pending";
  const orderColumn = isPending ? "created_at" : "reviewed_at";

  const { data, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("request_status", status)
    .order(orderColumn, { ascending: isPending })
    .limit(limit);

  if (error) {
    return { items: [], error: error.message };
  }

  const requests = data ?? [];

  if (requests.length === 0) {
    return { items: [] };
  }

  const victimIds = [...new Set(requests.map((request) => request.victim_id))];
  const { data: victims, error: victimError } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address")
    .in("id", victimIds);

  if (victimError) {
    return { items: [], error: victimError.message };
  }

  const victimsById = new Map(
    (victims ?? []).map((victim) => [victim.id, victim] as const),
  );

  return {
    items: requests.map((request) => ({
      request,
      victim: victimsById.get(request.victim_id) ?? null,
    })),
  };
}

/**
 * Counts emergency requests by review status without downloading every row.
 */
export async function getEmergencyRequestCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: EmergencyRequestCounts; error?: string }> {
  const countFor = (status: AppEnums["request_status"]) =>
    supabase
      .from("emergency_requests")
      .select("*", { count: "exact", head: true })
      .eq("request_status", status);

  const [pending, approved, rejected] = await Promise.all([
    countFor("pending"),
    countFor("approved"),
    countFor("rejected"),
  ]);

  const error = pending.error ?? approved.error ?? rejected.error;

  if (error) {
    return { counts: EMPTY_REQUEST_COUNTS, error: error.message };
  }

  return {
    counts: {
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    },
  };
}
