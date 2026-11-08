export type SupabasePublicEnv = {
  url: string;
  publicKey: string;
};

type SupabaseEnvName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

/**
 * Reads the browser-safe Supabase configuration.
 *
 * NEXT_PUBLIC_* values are inlined by Next.js and are safe to expose. The
 * service role/secret key is deliberately not read here.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const missing: SupabaseEnvName[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publicKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (!url || !publicKey) {
    throw new Error(
      `Supabase is not configured. Missing: ${missing.join(", ")}. ` +
        "Copy .env.example to .env.local and add your project values.",
    );
  }

  return { url, publicKey };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )?.trim(),
  );
}

export function getMissingSupabaseEnv(): SupabaseEnvName[] {
  const missing: SupabaseEnvName[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (
    !(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )?.trim()
  ) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return missing;
}
