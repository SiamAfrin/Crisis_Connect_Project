import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type EmergencyRequestRow = Tables<"emergency_requests">;

export type RequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const EMPTY_STATS: RequestStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

/**
 * Lists a victim's own requests. RLS already limits rows to the signed-in
 * victim; the explicit `victim_id` filter is a second, request-scoped guard.
 */
export async function listVictimRequests(
  supabase: SupabaseServerClient,
  victimId: string,
  limit = 100,
): Promise<{ requests: EmergencyRequestRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("victim_id", victimId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: data ?? [] };
}

/**
 * Reads one request only when it belongs to the signed-in victim. A request
 * that belongs to someone else is indistinguishable from a missing request.
 */
export async function getVictimRequest(
  supabase: SupabaseServerClient,
  victimId: string,
  requestId: string,
): Promise<{ request: EmergencyRequestRow | null; error?: string }> {
  const { data, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("request_id", requestId)
    .eq("victim_id", victimId)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return { request: data };
}

/**
 * Counts a victim's requests by review status without downloading every row.
 */
export async function getVictimRequestStats(
  supabase: SupabaseServerClient,
  victimId: string,
): Promise<{ stats: RequestStats; error?: string }> {
  const countFor = (status?: "pending" | "approved" | "rejected") => {
    let query = supabase
      .from("emergency_requests")
      .select("*", { count: "exact", head: true })
      .eq("victim_id", victimId);

    if (status) {
      query = query.eq("request_status", status);
    }

    return query;
  };

  const [total, pending, approved, rejected] = await Promise.all([
    countFor(),
    countFor("pending"),
    countFor("approved"),
    countFor("rejected"),
  ]);

  const error =
    total.error ?? pending.error ?? approved.error ?? rejected.error;

  if (error) {
    return { stats: EMPTY_STATS, error: error.message };
  }

  return {
    stats: {
      total: total.count ?? 0,
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    },
  };
}

/**
 * Lists approved requests for active responders. RLS already limits the rows to
 * approved requests when the caller is an active volunteer or rescue team
 * member; the explicit status filter documents and enforces that intent.
 */
export async function listApprovedRequests(
  supabase: SupabaseServerClient,
  limit = 50,
): Promise<{ requests: EmergencyRequestRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("request_status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { requests: [], error: error.message };
  }

  return { requests: data ?? [] };
}

export type ResponderAcceptanceRow = Tables<"emergency_acceptances">;
export type ResponderAssignmentRow = Tables<"emergency_assignments">;

export type RequestVictimContact = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "phone" | "address"
>;

export type AssignedRequest = {
  assignment: ResponderAssignmentRow;
  request: EmergencyRequestRow | null;
};

export type ResponderWorkspace = {
  approved: EmergencyRequestRow[];
  acceptances: ResponderAcceptanceRow[];
  assignments: AssignedRequest[];
  victims: RequestVictimContact[];
  error?: string;
};

const EMPTY_WORKSPACE: ResponderWorkspace = {
  approved: [],
  acceptances: [],
  assignments: [],
  victims: [],
};

/**
 * Loads everything an active responder dashboard needs in one place: approved
 * requests, this responder's acceptances, this responder's assignments, and the
 * victim contact details that RLS allows for requests the responder accepted.
 *
 * Every query also filters by `responder_id` as a second, request-scoped guard
 * on top of RLS. Another responder's acceptances and assignments are never
 * returned.
 */
export async function getResponderWorkspace(
  supabase: SupabaseServerClient,
  responderId: string,
  approvedLimit = 50,
): Promise<ResponderWorkspace> {
  const [approvedResult, acceptanceResult, assignmentResult] =
    await Promise.all([
      listApprovedRequests(supabase, approvedLimit),
      supabase
        .from("emergency_acceptances")
        .select("*")
        .eq("responder_id", responderId)
        .order("accepted_at", { ascending: false }),
      supabase
        .from("emergency_assignments")
        .select("*")
        .eq("responder_id", responderId)
        .order("assigned_at", { ascending: false }),
    ]);

  const error =
    approvedResult.error ??
    acceptanceResult.error?.message ??
    assignmentResult.error?.message;

  if (error) {
    return { ...EMPTY_WORKSPACE, error };
  }

  const acceptances = acceptanceResult.data ?? [];
  const assignmentRows = assignmentResult.data ?? [];
  const assignmentRequestIds = [
    ...new Set(assignmentRows.map((assignment) => assignment.request_id)),
  ];

  const assignedRequestsResult =
    assignmentRequestIds.length > 0
      ? await supabase
          .from("emergency_requests")
          .select("*")
          .in("request_id", assignmentRequestIds)
      : { data: [] as EmergencyRequestRow[], error: null };

  if (assignedRequestsResult.error) {
    return {
      ...EMPTY_WORKSPACE,
      error: assignedRequestsResult.error.message,
    };
  }

  const assignedRequestsById = new Map(
    (assignedRequestsResult.data ?? []).map(
      (request) => [request.request_id, request] as const,
    ),
  );

  const acceptedRequestIds = new Set(
    acceptances.map((acceptance) => acceptance.request_id),
  );

  const victimIds = new Set<string>();

  for (const request of approvedResult.requests) {
    if (acceptedRequestIds.has(request.request_id)) {
      victimIds.add(request.victim_id);
    }
  }

  for (const request of assignedRequestsById.values()) {
    victimIds.add(request.victim_id);
  }

  const victimsResult =
    victimIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, phone, address")
          .in("id", [...victimIds])
      : { data: [] as RequestVictimContact[], error: null };

  if (victimsResult.error) {
    return { ...EMPTY_WORKSPACE, error: victimsResult.error.message };
  }

  return {
    approved: approvedResult.requests,
    acceptances,
    assignments: assignmentRows.map((assignment) => ({
      assignment,
      request: assignedRequestsById.get(assignment.request_id) ?? null,
    })),
    victims: victimsResult.data ?? [],
  };
}
