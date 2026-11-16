import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { REPORT_ROW_LIMIT, type ReportRange } from "./params";
import {
  summarizeEmergencyRequests,
  summarizeRescueActivities,
} from "./summarize";
import type {
  EmergencyRequestReport,
  RescueActivityReport,
} from "./types";

// PostgREST filters travel in the request URL. Looking up report joins in small
// batches keeps a 1,000-row report from producing an oversized `in.(...)` URL.
const LOOKUP_BATCH_SIZE = 100;

type RequestLookupRow = Pick<
  Tables<"emergency_requests">,
  "request_id" | "victim_id" | "emergency_type" | "severity" | "location"
>;

type ProfileLookupRow = Pick<Tables<"profiles">, "id" | "full_name" | "role">;

type VictimLookupRow = Pick<Tables<"profiles">, "id" | "full_name">;

async function loadRequestLookup(
  supabase: SupabaseServerClient,
  requestIds: string[],
): Promise<{ rows: RequestLookupRow[]; error?: string }> {
  const rows: RequestLookupRow[] = [];

  for (let index = 0; index < requestIds.length; index += LOOKUP_BATCH_SIZE) {
    const batch = requestIds.slice(index, index + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase
      .from("emergency_requests")
      .select("request_id, victim_id, emergency_type, severity, location")
      .in("request_id", batch);

    if (error) {
      return { rows: [], error: error.message };
    }

    rows.push(...(data ?? []));
  }

  return { rows };
}

async function loadProfileLookup(
  supabase: SupabaseServerClient,
  profileIds: string[],
): Promise<{ rows: ProfileLookupRow[]; error?: string }> {
  const rows: ProfileLookupRow[] = [];

  for (let index = 0; index < profileIds.length; index += LOOKUP_BATCH_SIZE) {
    const batch = profileIds.slice(index, index + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", batch);

    if (error) {
      return { rows: [], error: error.message };
    }

    rows.push(...(data ?? []));
  }

  return { rows };
}

async function loadVictimNames(
  supabase: SupabaseServerClient,
  victimIds: string[],
): Promise<{ names: Map<string, string>; error?: string }> {
  const names = new Map<string, string>();

  for (let index = 0; index < victimIds.length; index += LOOKUP_BATCH_SIZE) {
    const batch = victimIds.slice(index, index + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", batch);

    if (error) {
      return { names, error: error.message };
    }

    for (const victim of (data ?? []) as VictimLookupRow[]) {
      names.set(victim.id, victim.full_name);
    }
  }

  return { names };
}

function emptyEmergencyRequestReport(): EmergencyRequestReport {
  return {
    rows: [],
    summary: summarizeEmergencyRequests([]),
    truncated: false,
  };
}

function emptyRescueActivityReport(): RescueActivityReport {
  return {
    rows: [],
    summary: summarizeRescueActivities([]),
    truncated: false,
  };
}

/**
 * Loads the emergency request report for one period. Requests are filtered by
 * their submission time (`created_at`). RLS already limits the rows to active
 * administrators, and the cap keeps one report request bounded.
 */
export async function getEmergencyRequestReport(
  supabase: SupabaseServerClient,
  range: ReportRange,
): Promise<{ report: EmergencyRequestReport; error?: string }> {
  let query = supabase
    .from("emergency_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (range.fromIso) {
    query = query.gte("created_at", range.fromIso);
  }

  if (range.toIso) {
    query = query.lte("created_at", range.toIso);
  }

  const { data, error } = await query;

  if (error) {
    return { report: emptyEmergencyRequestReport(), error: error.message };
  }

  const requests = data ?? [];
  const victimIds = [...new Set(requests.map((request) => request.victim_id))];
  const { names, error: victimError } = await loadVictimNames(
    supabase,
    victimIds,
  );

  if (victimError) {
    return { report: emptyEmergencyRequestReport(), error: victimError };
  }

  const rows = requests.map((request) => ({
    request_id: request.request_id,
    created_at: request.created_at,
    emergency_type: request.emergency_type,
    severity: request.severity,
    request_status: request.request_status,
    location: request.location,
    affected_people: request.affected_people,
    victim_name: names.get(request.victim_id) ?? null,
  }));

  return {
    report: {
      rows,
      summary: summarizeEmergencyRequests(rows),
      truncated: rows.length === REPORT_ROW_LIMIT,
    },
  };
}

/**
 * Loads the rescue activity report for one period. Missions are filtered by
 * their assignment time (`assigned_at`); acceptance time is included for
 * accepted and completed missions. The schema has no completed-at column, so
 * this report never claims a completion timestamp.
 */
export async function getRescueActivityReport(
  supabase: SupabaseServerClient,
  range: ReportRange,
): Promise<{ report: RescueActivityReport; error?: string }> {
  let query = supabase
    .from("emergency_assignments")
    .select("*")
    .order("assigned_at", { ascending: false })
    .limit(REPORT_ROW_LIMIT);

  if (range.fromIso) {
    query = query.gte("assigned_at", range.fromIso);
  }

  if (range.toIso) {
    query = query.lte("assigned_at", range.toIso);
  }

  const { data, error } = await query;

  if (error) {
    return { report: emptyRescueActivityReport(), error: error.message };
  }

  const assignments = data ?? [];

  if (assignments.length === 0) {
    return { report: emptyRescueActivityReport() };
  }

  const requestIds = [
    ...new Set(assignments.map((assignment) => assignment.request_id)),
  ];
  const { rows: requests, error: requestError } = await loadRequestLookup(
    supabase,
    requestIds,
  );

  if (requestError) {
    return { report: emptyRescueActivityReport(), error: requestError };
  }

  const requestsById = new Map(
    requests.map((request) => [request.request_id, request] as const),
  );

  const profileIds = [
    ...new Set([
      ...assignments.map((assignment) => assignment.responder_id),
      ...requests.map((request) => request.victim_id),
    ]),
  ];
  const { rows: profiles, error: profileError } = await loadProfileLookup(
    supabase,
    profileIds,
  );

  if (profileError) {
    return { report: emptyRescueActivityReport(), error: profileError };
  }

  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile] as const),
  );

  const rows = assignments.map((assignment) => {
    const request = requestsById.get(assignment.request_id) ?? null;
    const responder = profilesById.get(assignment.responder_id);
    const victim = request ? profilesById.get(request.victim_id) : undefined;

    return {
      assignment_id: assignment.assignment_id,
      assigned_at: assignment.assigned_at,
      accepted_at: assignment.accepted_at,
      assignment_status: assignment.assignment_status,
      emergency_type: request?.emergency_type ?? null,
      severity: request?.severity ?? null,
      location: request?.location ?? null,
      responder_id: assignment.responder_id,
      responder_name: responder?.full_name ?? null,
      responder_role: responder?.role ?? null,
      victim_id: request?.victim_id ?? null,
      victim_name: victim?.full_name ?? null,
    };
  });

  return {
    report: {
      rows,
      summary: summarizeRescueActivities(rows),
      truncated: rows.length === REPORT_ROW_LIMIT,
    },
  };
}
