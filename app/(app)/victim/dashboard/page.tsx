import type { Metadata } from "next";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Victim dashboard",
  description: "Your Crisis Connect victim dashboard.",
};

export default async function VictimDashboardPage() {
  const { profile } = await requireActiveRole("victim");

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Victim dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Welcome, {profile.full_name}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Your victim account is active. In a later approved chunk you will be
          able to submit emergency requests, track their review status, and see
          which responder teams have been assigned.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title="Create an emergency request"
          description="Submit the emergency type, location, description, severity, and number of affected people."
        />
        <PlaceholderCard
          title="Track request review"
          description="See whether an administrator has approved or rejected each request you submit."
        />
        <PlaceholderCard
          title="Follow assignments"
          description="View which approved responders have been assigned to your request."
        />
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-sky-950">
          Chunk 2 boundary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">
          This chunk implements authentication, profiles, protected routes, and
          server-side role checks. Emergency request submission begins only
          after this chunk is explicitly approved.
        </p>
      </section>
    </div>
  );
}
