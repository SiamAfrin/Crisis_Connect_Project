import type { Metadata } from "next";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { requireActiveResponder } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Volunteer dashboard",
  description: "Your Crisis Connect volunteer dashboard.",
};

export default async function VolunteerDashboardPage() {
  const { profile } = await requireActiveResponder("volunteer");

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Volunteer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Welcome, {profile.full_name}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Your volunteer account is approved and active. Responder assignment
          and acceptance features arrive in a later approved chunk.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="Assigned requests"
          description="View emergency requests that an administrator has assigned to you."
        />
        <PlaceholderCard
          title="Accept or decline"
          description="Respond to an assignment and record when you accept it."
        />
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-emerald-950">
          Access confirmed
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">
          This page is server-protected. It checks your session, your{" "}
          <strong>volunteer</strong> role, and your <strong>active</strong>{" "}
          account status before rendering. Pending or rejected accounts are
          redirected to the account-status page.
        </p>
      </section>
    </div>
  );
}
