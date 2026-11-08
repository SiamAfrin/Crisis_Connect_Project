import type { Metadata } from "next";
import Link from "next/link";

import { ResponderReviewCard } from "@/components/admin/responder-review-card";
import { ResponderSummaryCard } from "@/components/admin/responder-summary-card";
import { Notice } from "@/components/ui/form";
import { getResponderCounts, listRespondersByStatus } from "@/lib/admin/data";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Responder approvals",
  description:
    "Review pending volunteer and rescue team registrations.",
};

// This page blocks on the administrator session, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

export default async function AdminRespondersPage() {
  const { supabase } = await requireActiveRole("administrator");

  const [countsResult, pendingResult, approvedResult, rejectedResult] =
    await Promise.all([
      getResponderCounts(supabase),
      listRespondersByStatus(supabase, "pending"),
      listRespondersByStatus(supabase, "active", 20),
      listRespondersByStatus(supabase, "rejected", 20),
    ]);

  const error =
    countsResult.error ??
    pendingResult.error ??
    approvedResult.error ??
    rejectedResult.error;

  const counts = countsResult.counts;

  const statCards = [
    {
      label: "Pending approval",
      value: counts.pending,
      className: "border-amber-200 bg-amber-50 text-amber-950",
    },
    {
      label: "Approved",
      value: counts.active,
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    {
      label: "Rejected",
      value: counts.rejected,
      className: "border-rose-200 bg-rose-50 text-rose-950",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Administrator approvals
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Responder registrations
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Review pending volunteer and rescue team accounts. Approving grants
          access to the responder dashboard; rejecting keeps the account signed
          in but blocked.
        </p>
      </header>

      <section
        aria-label="Responder summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        {statCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border p-5 shadow-sm ${card.className}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      {error ? (
        <Notice tone="warning">
          We could not load responder registrations right now. Refresh the page
          to try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Awaiting approval
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Oldest registrations appear first.
          </p>
        </div>

        {!error && pendingResult.responders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <p className="text-sm leading-6 text-slate-600">
              No registrations are waiting for approval.
            </p>
          </div>
        ) : null}

        {pendingResult.responders.map((responder) => (
          <ResponderReviewCard key={responder.id} responder={responder} />
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Reviewed responders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            The 20 most recently updated approved and rejected registrations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Approved ({counts.active})
            </h3>
            {!error && approvedResult.responders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
                No approved responders yet.
              </p>
            ) : null}
            {approvedResult.responders.map((responder) => (
              <ResponderSummaryCard
                key={responder.id}
                responder={responder}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">
              Rejected ({counts.rejected})
            </h3>
            {!error && rejectedResult.responders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
                No rejected registrations yet.
              </p>
            ) : null}
            {rejectedResult.responders.map((responder) => (
              <ResponderSummaryCard
                key={responder.id}
                responder={responder}
              />
            ))}
          </div>
        </div>
      </section>

      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900">
        Only active administrators can approve or reject registrations. Decisions
        are applied by a server-side function that re-checks the administrator
        role, and only pending volunteer or rescue team accounts can be
        reviewed.
      </p>
    </div>
  );
}
