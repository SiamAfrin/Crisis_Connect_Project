import { connection } from "next/server";

import { checkSupabaseHealth } from "@/lib/supabase/health";

export async function GET() {
  // Opt this route into runtime rendering so it always checks the currently
  // configured Supabase project instead of being prerendered at build time.
  await connection();

  const health = await checkSupabaseHealth();
  const statusCode = health.status === "ok" ? 200 : 503;

  return Response.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
