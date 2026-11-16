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

export type AdminUserCounts = {
  total: number;
  victims: number;
  volunteers: number;
  rescueTeamMembers: number;
  administrators: number;
  activeResponders: number;
  pendingResponders: number;
  rejectedResponders: number;
};

const EMPTY_USER_COUNTS: AdminUserCounts = {
  total: 0,
  victims: 0,
  volunteers: 0,
  rescueTeamMembers: 0,
  administrators: 0,
  activeResponders: 0,
  pendingResponders: 0,
  rejectedResponders: 0,
};

/**
 * Counts every registered account by role and counts responder accounts by
 * approval status. RLS already limits these rows to active administrators and
 * the count queries avoid downloading profile rows.
 */
export async function getAdminUserCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: AdminUserCounts; error?: string }> {
  const countRole = (role: AppEnums["user_role"]) =>
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", role);

  const countResponders = (status: AppEnums["account_status"]) =>
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", [...RESPONDER_ROLES])
      .eq("account_status", status);

  const [
    victims,
    volunteers,
    rescueTeamMembers,
    administrators,
    activeResponders,
    pendingResponders,
    rejectedResponders,
  ] = await Promise.all([
    countRole("victim"),
    countRole("volunteer"),
    countRole("rescue_team_member"),
    countRole("administrator"),
    countResponders("active"),
    countResponders("pending"),
    countResponders("rejected"),
  ]);

  const error =
    victims.error ??
    volunteers.error ??
    rescueTeamMembers.error ??
    administrators.error ??
    activeResponders.error ??
    pendingResponders.error ??
    rejectedResponders.error;

  if (error) {
    return { counts: EMPTY_USER_COUNTS, error: error.message };
  }

  const victimCount = victims.count ?? 0;
  const volunteerCount = volunteers.count ?? 0;
  const rescueTeamCount = rescueTeamMembers.count ?? 0;
  const administratorCount = administrators.count ?? 0;

  return {
    counts: {
      total:
        victimCount + volunteerCount + rescueTeamCount + administratorCount,
      victims: victimCount,
      volunteers: volunteerCount,
      rescueTeamMembers: rescueTeamCount,
      administrators: administratorCount,
      activeResponders: activeResponders.count ?? 0,
      pendingResponders: pendingResponders.count ?? 0,
      rejectedResponders: rejectedResponders.count ?? 0,
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

export type EmergencySeverityCounts = Record<
  AppEnums["emergency_severity"],
  number
>;

const EMPTY_SEVERITY_COUNTS: EmergencySeverityCounts = {
  low: 0,
  medium: 0,
  high: 0,
  critical: 0,
};

/**
 * Counts emergency requests by severity without downloading every row.
 */
export async function getEmergencySeverityCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: EmergencySeverityCounts; error?: string }> {
  const countFor = (severity: AppEnums["emergency_severity"]) =>
    supabase
      .from("emergency_requests")
      .select("*", { count: "exact", head: true })
      .eq("severity", severity);

  const [low, medium, high, critical] = await Promise.all([
    countFor("low"),
    countFor("medium"),
    countFor("high"),
    countFor("critical"),
  ]);

  const error = low.error ?? medium.error ?? high.error ?? critical.error;

  if (error) {
    return { counts: EMPTY_SEVERITY_COUNTS, error: error.message };
  }

  return {
    counts: {
      low: low.count ?? 0,
      medium: medium.count ?? 0,
      high: high.count ?? 0,
      critical: critical.count ?? 0,
    },
  };
}

/**
 * Attaches the submitting victim's contact details to a set of request rows.
 * RLS already limits both tables to active administrators.
 */
async function attachRequestVictims(
  supabase: SupabaseServerClient,
  requests: Tables<"emergency_requests">[],
): Promise<{ items: AdminEmergencyRequest[]; error?: string }> {
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

  return attachRequestVictims(supabase, data ?? []);
}

/**
 * Lists the most recent emergency requests across every review status for the
 * monitoring dashboard. The status-specific queues remain the place to act on
 * pending requests; this query is read-only and only supplies recent activity.
 */
export async function listRecentEmergencyRequestsForAdmin(
  supabase: SupabaseServerClient,
  limit = 5,
): Promise<{ items: AdminEmergencyRequest[]; error?: string }> {
  const { data, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { items: [], error: error.message };
  }

  return attachRequestVictims(supabase, data ?? []);
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

export type AdminAcceptedResponder = {
  acceptance: Tables<"emergency_acceptances">;
  responder: Tables<"profiles">;
  assignment: Tables<"emergency_assignments"> | null;
};

export type AdminAcceptedRequest = {
  request: Tables<"emergency_requests">;
  victim: EmergencyRequestVictim | null;
  responders: AdminAcceptedResponder[];
};

export type ResponderWorkflowCounts = {
  accepted: number;
  assigned: number;
};

const EMPTY_WORKFLOW_COUNTS: ResponderWorkflowCounts = {
  accepted: 0,
  assigned: 0,
};

/**
 * Lists approved requests that at least one responder has accepted, together
 * with each accepting responder, their assignment (if any), and the victim's
 * contact details. RLS already limits all of these rows to active
 * administrators; the explicit filters keep the query scoped to accepted work.
 */
export async function listAcceptedRequestsForAdmin(
  supabase: SupabaseServerClient,
  limit = 100,
): Promise<{ items: AdminAcceptedRequest[]; error?: string }> {
  const { data: requests, error } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("request_status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { items: [], error: error.message };
  }

  const approvedRequests = requests ?? [];

  if (approvedRequests.length === 0) {
    return { items: [] };
  }

  const requestIds = approvedRequests.map((request) => request.request_id);

  const [acceptanceResult, assignmentResult] = await Promise.all([
    supabase
      .from("emergency_acceptances")
      .select("*")
      .in("request_id", requestIds)
      .order("accepted_at", { ascending: true }),
    supabase.from("emergency_assignments").select("*").in("request_id", requestIds),
  ]);

  const relatedError =
    acceptanceResult.error?.message ?? assignmentResult.error?.message;

  if (relatedError) {
    return { items: [], error: relatedError };
  }

  const acceptances = acceptanceResult.data ?? [];
  const assignments = assignmentResult.data ?? [];

  if (acceptances.length === 0) {
    return { items: [] };
  }

  const profileIds = [
    ...new Set([
      ...approvedRequests.map((request) => request.victim_id),
      ...acceptances.map((acceptance) => acceptance.responder_id),
    ]),
  ];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  if (profileError) {
    return { items: [], error: profileError.message };
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const),
  );

  const assignmentsByPair = new Map(
    assignments.map(
      (assignment) =>
        [
          `${assignment.request_id}:${assignment.responder_id}`,
          assignment,
        ] as const,
    ),
  );

  const acceptancesByRequest = new Map<string, typeof acceptances>();

  for (const acceptance of acceptances) {
    const existing = acceptancesByRequest.get(acceptance.request_id);

    if (existing) {
      existing.push(acceptance);
    } else {
      acceptancesByRequest.set(acceptance.request_id, [acceptance]);
    }
  }

  const items: AdminAcceptedRequest[] = [];

  for (const request of approvedRequests) {
    const requestAcceptances = acceptancesByRequest.get(request.request_id);

    if (!requestAcceptances || requestAcceptances.length === 0) {
      continue;
    }

    const victimProfile = profilesById.get(request.victim_id);

    const responders: AdminAcceptedResponder[] = [];

    for (const acceptance of requestAcceptances) {
      const responder = profilesById.get(acceptance.responder_id);

      if (!responder) {
        continue;
      }

      responders.push({
        acceptance,
        responder,
        assignment:
          assignmentsByPair.get(
            `${request.request_id}:${acceptance.responder_id}`,
          ) ?? null,
      });
    }

    items.push({
      request,
      victim: victimProfile
        ? {
            id: victimProfile.id,
            full_name: victimProfile.full_name,
            email: victimProfile.email,
            phone: victimProfile.phone,
            address: victimProfile.address,
          }
        : null,
      responders,
    });
  }

  return { items };
}

/**
 * Counts responder acceptances and administrator assignments for the admin
 * dashboard without downloading every row.
 */
export async function getResponderWorkflowCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: ResponderWorkflowCounts; error?: string }> {
  const [accepted, assigned] = await Promise.all([
    supabase
      .from("emergency_acceptances")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("emergency_assignments")
      .select("*", { count: "exact", head: true }),
  ]);

  const error = accepted.error ?? assigned.error;

  if (error) {
    return { counts: EMPTY_WORKFLOW_COUNTS, error: error.message };
  }

  return {
    counts: {
      accepted: accepted.count ?? 0,
      assigned: assigned.count ?? 0,
    },
  };
}

export type MissionCounts = {
  pending: number;
  accepted: number;
  declined: number;
  cancelled: number;
  completed: number;
  total: number;
};

const EMPTY_MISSION_COUNTS: MissionCounts = {
  pending: 0,
  accepted: 0,
  declined: 0,
  cancelled: 0,
  completed: 0,
  total: 0,
};

/**
 * Counts mission assignments by status without downloading every row. Every
 * assignment is a mission record, including completed and legacy closed rows.
 */
export async function getMissionCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: MissionCounts; error?: string }> {
  const countFor = (status: AppEnums["assignment_status"]) =>
    supabase
      .from("emergency_assignments")
      .select("*", { count: "exact", head: true })
      .eq("assignment_status", status);

  const [pending, accepted, declined, cancelled, completed] = await Promise.all([
    countFor("pending"),
    countFor("accepted"),
    countFor("declined"),
    countFor("cancelled"),
    countFor("completed"),
  ]);

  const error =
    pending.error ??
    accepted.error ??
    declined.error ??
    cancelled.error ??
    completed.error;

  if (error) {
    return { counts: EMPTY_MISSION_COUNTS, error: error.message };
  }

  const pendingCount = pending.count ?? 0;
  const acceptedCount = accepted.count ?? 0;
  const declinedCount = declined.count ?? 0;
  const cancelledCount = cancelled.count ?? 0;
  const completedCount = completed.count ?? 0;

  return {
    counts: {
      pending: pendingCount,
      accepted: acceptedCount,
      declined: declinedCount,
      cancelled: cancelledCount,
      completed: completedCount,
      total:
        pendingCount +
        acceptedCount +
        declinedCount +
        cancelledCount +
        completedCount,
    },
  };
}

export type AdminMissionResponder = Pick<
  Tables<"profiles">,
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "role"
  | "rescue_team_category"
  | "defence_subcategory"
>;

export type AdminMission = {
  assignment: Tables<"emergency_assignments">;
  request: Tables<"emergency_requests"> | null;
  responder: AdminMissionResponder | null;
  victim: EmergencyRequestVictim | null;
};

export type MissionListOptions = {
  statuses?: AppEnums["assignment_status"][];
  limit?: number;
};

/**
 * Lists mission assignment records with the emergency request, assigned
 * responder, and victim. RLS limits every table to active administrators; the
 * optional status filter keeps the dashboard and the assignment monitor scoped
 * without changing the underlying records.
 */
export async function listMissionsForAdmin(
  supabase: SupabaseServerClient,
  { statuses, limit = 50 }: MissionListOptions = {},
): Promise<{ items: AdminMission[]; error?: string }> {
  let query = supabase
    .from("emergency_assignments")
    .select("*")
    .order("assigned_at", { ascending: false })
    .limit(limit);

  if (statuses && statuses.length > 0) {
    query = query.in("assignment_status", statuses);
  }

  const { data: assignments, error } = await query;

  if (error) {
    return { items: [], error: error.message };
  }

  const assignmentRows = assignments ?? [];

  if (assignmentRows.length === 0) {
    return { items: [] };
  }

  const requestIds = [
    ...new Set(assignmentRows.map((assignment) => assignment.request_id)),
  ];

  const { data: requests, error: requestError } = await supabase
    .from("emergency_requests")
    .select("*")
    .in("request_id", requestIds);

  if (requestError) {
    return { items: [], error: requestError.message };
  }

  const requestsById = new Map(
    (requests ?? []).map((request) => [request.request_id, request] as const),
  );

  const profileIds = [
    ...new Set([
      ...assignmentRows.map((assignment) => assignment.responder_id),
      ...Array.from(requestsById.values(), (request) => request.victim_id),
    ]),
  ];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, address, rescue_team_category, defence_subcategory",
    )
    .in("id", profileIds);

  if (profileError) {
    return { items: [], error: profileError.message };
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const),
  );

  const items: AdminMission[] = [];

  for (const assignment of assignmentRows) {
    const request = requestsById.get(assignment.request_id) ?? null;
    const responderProfile = profilesById.get(assignment.responder_id);
    const victimProfile = request
      ? profilesById.get(request.victim_id)
      : undefined;

    items.push({
      assignment,
      request,
      responder: responderProfile
        ? {
            id: responderProfile.id,
            full_name: responderProfile.full_name,
            email: responderProfile.email,
            phone: responderProfile.phone,
            role: responderProfile.role,
            rescue_team_category: responderProfile.rescue_team_category,
            defence_subcategory: responderProfile.defence_subcategory,
          }
        : null,
      victim: victimProfile
        ? {
            id: victimProfile.id,
            full_name: victimProfile.full_name,
            email: victimProfile.email,
            phone: victimProfile.phone,
            address: victimProfile.address,
          }
        : null,
    });
  }

  return { items };
}
