import type { Metadata } from "next";

import { EmergencyRequestReviewCard } from "@/components/admin/emergency-request-review-card";
import { EmergencyRequestSummaryCard } from "@/components/admin/emergency-request-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Emergency requests"
        description="Review victim submissions in the order they arrived. Approved requests become available to verified responders."
      />

      {error ? (
        <Notice tone="warning">
          We could not load emergency requests right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Awaiting review
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Oldest submissions appear first.
          </p>
        </div>

        {!error && pendingResult.items.length === 0 ? (
          <EmptyState
            title="No requests are waiting"
            description="New victim emergency requests will appear here for review."
          />
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
          <h2 className="text-lg font-semibold text-ink-950">
            Reviewed requests
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            The 20 most recently reviewed approved and rejected requests.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-950">
              Approved ({counts.approved})
            </h3>
            {!error && approvedResult.items.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
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
            <h3 className="text-sm font-semibold text-ink-950">
              Rejected ({counts.rejected})
            </h3>
            {!error && rejectedResult.items.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
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
    </div>
  );
}
