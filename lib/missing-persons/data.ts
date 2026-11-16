import "server-only";

import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AppEnums, Tables } from "@/types/database";

import { createMissingPersonPhotoUrls } from "./photos";

export type MissingPersonRow = Tables<"missing_persons">;

/**
 * A report row plus a short-lived signed photo URL. `photoUrl` is null when the
 * reporter did not upload a photo or Storage could not sign the object.
 */
export type MissingPersonRecord = MissingPersonRow & {
  photoUrl: string | null;
};

export type MissingPersonReporter = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "phone"
>;

export type MissingPersonFilters = {
  query?: string;
  status?: AppEnums["missing_person_status"] | "all";
  limit?: number;
};

export type MissingPersonCounts = {
  missing: number;
  found: number;
};

const EMPTY_MISSING_PERSON_COUNTS: MissingPersonCounts = {
  missing: 0,
  found: 0,
};

/**
 * PostgREST `or` filters split on commas, use SQL wildcard characters, and can
 * treat quotes as delimiters. Removing those characters keeps user input inside
 * the search value instead of letting it change the filter structure.
 */
function sanitizeSearchTerm(value: string): string {
  return value
    .trim()
    .slice(0, 100)
    .replace(/[%,()\\_*'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lists missing person reports for any active authenticated user. RLS limits
 * rows to active victims, responders, and administrators. The explicit status
 * filter and search term keep the directory scoped to the requested view.
 */
export async function listMissingPersons(
  supabase: SupabaseServerClient,
  { query = "", status = "missing", limit = 100 }: MissingPersonFilters = {},
): Promise<{ reports: MissingPersonRecord[]; error?: string }> {
  let request = supabase
    .from("missing_persons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    request = request.eq("status", status);
  }

  const term = sanitizeSearchTerm(query);

  if (term) {
    request = request.or(
      `full_name.ilike.%${term}%,last_seen_location.ilike.%${term}%`,
    );
  }

  const { data, error } = await request;

  if (error) {
    return { reports: [], error: error.message };
  }

  const rows = data ?? [];
  const photoUrls = await createMissingPersonPhotoUrls(
    supabase,
    rows.map((report) => report.photo_path),
  );

  return {
    reports: rows.map((report) => ({
      ...report,
      photoUrl: report.photo_path
        ? photoUrls.get(report.photo_path) ?? null
        : null,
    })),
  };
}

/**
 * Reads one missing person report and signs its optional photo. RLS limits the
 * row to active authenticated users, and the report id is validated before
 * this query runs.
 */
export async function getMissingPerson(
  supabase: SupabaseServerClient,
  reportId: string,
): Promise<{ report: MissingPersonRecord | null; error?: string }> {
  const { data, error } = await supabase
    .from("missing_persons")
    .select("*")
    .eq("report_id", reportId)
    .maybeSingle();

  if (error) {
    return { report: null, error: error.message };
  }

  if (!data) {
    return { report: null };
  }

  const photoUrls = await createMissingPersonPhotoUrls(supabase, [
    data.photo_path,
  ]);

  return {
    report: {
      ...data,
      photoUrl: data.photo_path
        ? photoUrls.get(data.photo_path) ?? null
        : null,
    },
  };
}

/**
 * Reads the reporter's contact details. Profile RLS only returns the row to the
 * reporter themselves or an active administrator, so responders and other
 * victims cannot read reporter contact information.
 */
export async function getMissingPersonReporter(
  supabase: SupabaseServerClient,
  reporterId: string,
): Promise<{ reporter: MissingPersonReporter | null; error?: string }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", reporterId)
    .maybeSingle();

  if (error) {
    return { reporter: null, error: error.message };
  }

  return { reporter: data };
}

/**
 * Counts missing person reports by status without downloading every row.
 */
export async function getMissingPersonCounts(
  supabase: SupabaseServerClient,
): Promise<{ counts: MissingPersonCounts; error?: string }> {
  const countFor = (status: AppEnums["missing_person_status"]) =>
    supabase
      .from("missing_persons")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

  const [missing, found] = await Promise.all([
    countFor("missing"),
    countFor("found"),
  ]);

  const error = missing.error ?? found.error;

  if (error) {
    return { counts: EMPTY_MISSING_PERSON_COUNTS, error: error.message };
  }

  return {
    counts: {
      missing: missing.count ?? 0,
      found: found.count ?? 0,
    },
  };
}

export type MissingPersonSummary = Pick<
  Tables<"missing_persons">,
  | "report_id"
  | "full_name"
  | "last_seen_location"
  | "status"
  | "created_at"
  | "resolved_at"
>;

/**
 * Lists lightweight report summaries for the administrator monitoring
 * dashboard. Photographs and descriptions are deliberately omitted here so the
 * dashboard does not need to sign Storage URLs just to show a record list.
 */
export async function listMissingPersonSummaries(
  supabase: SupabaseServerClient,
  {
    status,
    limit = 5,
  }: {
    status: AppEnums["missing_person_status"];
    limit?: number;
  },
): Promise<{ reports: MissingPersonSummary[]; error?: string }> {
  const { data, error } = await supabase
    .from("missing_persons")
    .select(
      "report_id, full_name, last_seen_location, status, created_at, resolved_at",
    )
    .eq("status", status)
    .order(status === "found" ? "resolved_at" : "created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    return { reports: [], error: error.message };
  }

  return { reports: data ?? [] };
}
