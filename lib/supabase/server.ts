import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabasePublicEnv } from "./env";

export type SupabaseServerClient = SupabaseClient<Database>;

/**
 * Creates a request-scoped Supabase client for Server Components, Server
 * Actions, and Route Handlers.
 *
 * Never cache or share this client between requests. Cookie writes are caught
 * because Server Components cannot mutate response cookies; the session-refresh
 * proxy can write them in a later authentication chunk.
 */
export async function createClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();
  const { url, publicKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, publicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. A route/proxy will handle cookie
          // persistence during the authentication chunk.
        }
      },
    },
  });
}
