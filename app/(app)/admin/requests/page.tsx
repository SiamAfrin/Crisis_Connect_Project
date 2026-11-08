import type { Metadata } from "next";
import Link from "next/link";

import { EmergencyRequestReviewCard } from "@/components/admin/emergency-request-review-card";
import { EmergencyRequestSummaryCard } from "@/components/admin/emergency-request-summary-card";
import { Notice } from "@/components/ui/form";
import {
  getEmergencyRequestCounts,
  listEmergencyRequestsByStatus,
} from "@/lib/admin/data";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Emergency request review",
  description:
    "Review pending victim emergency requests and record approval decisions.",
};

// This page blocks on the administrator session, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

export default async function AdminRequestsPage() {
  const { supabase } = await requireActiveRole("administrator");

  const [countsResult, pendingResult, approvedResult, rejectedResult] =
    await Promise.all([
      getEmergencyRequestCounts(supabase),
      listEmergencyRequestsByStatus(supabase, "pending"),
      listEmergencyRequestsByStatus(supabase, "approved", 20),
      listEmergencyRequestsByStatus(supabase, "rejected", 20),
    ]);

  const error =
    countsResult.error ??
    pendingResult.error ??
    approvedResult.error ??
    rejectedResult.error;

  const counts = countsResult.counts;

  const statCards = [
    {
      label: "Pending review",
      value: counts.pending,
      className: "border-amber-200 bg-amber-50 text-amber-950",
    },
    {
      label: "Approved",
      value: counts.approved,
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
          Administrator review
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Emergency requests
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Review victim submissions in the order they arrived. Approving a
          request makes it available to approved responders; rejecting keeps it
          out of the responder queue.
        </p>
      </header>

      <section
        aria-label="Emergency request summary"
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
          We could not load emergency requests right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Awaiting review
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Oldest submissions appear first.
          </p>
        </div>

        {!error && pendingResult.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <p className="text-sm leading-6 text-slate-600">
              No emergency requests are waiting for review.
            </p>
          </div>
        ) : null}

        {pendingResult.items.map((item) => (
          <EmergencyRequestReviewCard
            key={item.request.request_id}
            item={item}
          />
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Reviewed requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            The 20 most recently reviewed approved and rejected requests.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Approved ({counts.approved})
            </h3>
            {!error && approvedResult.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
                No approved requests yet.
              </p>
            ) : null}
            {approvedResult.items.map((item) => (
              <EmergencyRequestSummaryCard
                key={item.request.request_id}
                item={item}
              />
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">
              Rejected ({counts.rejected})
            </h3>
            {!error && rejectedResult.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
                No rejected requests yet.
              </p>
            ) : null}
            {rejectedResult.items.map((item) => (
              <EmergencyRequestSummaryCard
                key={item.request.request_id}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>

      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900">
        Only active administrators can approve or reject emergency requests.
        Decisions are applied by a server-side function that re-checks the
        administrator role, records the reviewer and review time, and only
        reviews pending requests. Approved requests become readable by active
        responders through Row Level Security; assignment and acceptance are
        added in Chunk 5.
      </p>
    </div>
  );
}
