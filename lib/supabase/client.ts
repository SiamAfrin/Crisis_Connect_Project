"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Returns a singleton Supabase client for Client Components.
 *
 * Auth cookies are managed by @supabase/ssr so the browser and server share
 * the same session.
 */
export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, publicKey } = getSupabasePublicEnv();
    browserClient = createBrowserClient<Database>(url, publicKey);
  }

  return browserClient;
}
