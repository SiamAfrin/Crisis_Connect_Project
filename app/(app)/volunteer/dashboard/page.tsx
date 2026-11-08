import type { Metadata } from "next";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { ApprovedRequestCard } from "@/components/requests/approved-request-card";
import { Notice } from "@/components/ui/form";
import { requireActiveResponder } from "@/lib/auth/dal";
import { listApprovedRequests } from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "Volunteer dashboard",
  description: "Your Crisis Connect volunteer dashboard.",
};

// This page blocks on the volunteer session, so it cannot render an instant shell.
export const instant = false;

export default async function VolunteerDashboardPage() {
  const { supabase, profile } = await requireActiveResponder("volunteer");
  const { requests, error } = await listApprovedRequests(supabase);

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
          Your volunteer account is approved and active. Approved emergency
          requests are visible below; assignment and acceptance arrive in a
          later approved chunk.
        </p>
      </header>

      <section className="space-y-4" aria-label="Approved emergency requests">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Approved requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Requests an administrator has approved for responder visibility.
          </p>
        </div>

        {error ? (
          <Notice tone="warning">
            We could not load approved requests right now. Refresh the page to
            try again.
          </Notice>
        ) : null}

        {!error && requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <p className="text-sm leading-6 text-slate-600">
              No approved emergency requests are available yet.
            </p>
          </div>
        ) : null}

        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <ApprovedRequestCard
                key={request.request_id}
                request={request}
              />
            ))}
          </div>
        ) : null}
      </section>

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
