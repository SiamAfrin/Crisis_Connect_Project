import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  getMissingSupabaseEnv,
  getSupabasePublicEnv,
} from "./env";

export type SupabaseHealth = {
  status: "ok" | "degraded" | "not_configured";
  auth:
    | "reachable"
    | "unreachable"
    | "not_configured";
  database:
    | "ready"
    | "migration_required"
    | "unreachable"
    | "not_configured";
  missingEnvironmentVariables?: string[];
  detail?: string;
  checkedAt: string;
};

async function checkAuthService(url: string, publicKey: string) {
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: publicKey,
      },
      cache: "no-store",
    });

    return { reachable: response.ok };
  } catch {
    return { reachable: false };
  }
}

async function checkDatabase(
  url: string,
  publicKey: string,
): Promise<{
  ready: boolean;
  migrationRequired: boolean;
  detail?: string;
}> {
  try {
    const supabase = createClient<Database>(url, publicKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    // Use a normal GET rather than a HEAD/count request. PostgREST can return
    // 204 for a HEAD request even when the table is missing, which would create
    // a false-positive health result.
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!error) {
      return { ready: true, migrationRequired: false };
    }

    // PostgREST returns PGRST205 when a table exists in the migration files
    // but has not been added to the exposed schema cache yet.
    if (error.code === "PGRST205") {
      return { ready: false, migrationRequired: true };
    }

    // 42501 means the table exists but the anonymous role has no table
    // privilege. That is the intended security posture after the initial
    // migration, so treat it as evidence that the schema is ready rather than
    // as a database outage.
    if (error.code === "42501") {
      return { ready: true, migrationRequired: false };
    }

    return {
      ready: false,
      migrationRequired: false,
      detail: error.message,
    };
  } catch (error) {
    return {
      ready: false,
      migrationRequired: false,
      detail:
        error instanceof Error ? error.message : "Database check failed.",
    };
  }
}

/**
 * Verifies that the configured Supabase project is reachable and that the
 * initial migration has been applied. It never returns keys or row data.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const checkedAt = new Date().toISOString();
  const missing = getMissingSupabaseEnv();

  if (missing.length > 0) {
    return {
      status: "not_configured",
      auth: "not_configured",
      database: "not_configured",
      missingEnvironmentVariables: missing,
      checkedAt,
    };
  }

  let env: ReturnType<typeof getSupabasePublicEnv>;

  try {
    env = getSupabasePublicEnv();
  } catch (error) {
    return {
      status: "not_configured",
      auth: "not_configured",
      database: "not_configured",
      detail:
        error instanceof Error
          ? error.message
          : "Supabase environment variables are missing.",
      checkedAt,
    };
  }

  const [auth, database] = await Promise.all([
    checkAuthService(env.url, env.publicKey),
    checkDatabase(env.url, env.publicKey),
  ]);

  const databaseState = database.ready
    ? "ready"
    : database.migrationRequired
      ? "migration_required"
      : "unreachable";

  const isHealthy =
    auth.reachable &&
    databaseState === "ready";

  return {
    status: isHealthy ? "ok" : "degraded",
    auth: auth.reachable ? "reachable" : "unreachable",
    database: databaseState,
    detail: database.detail,
    checkedAt,
  };
}
