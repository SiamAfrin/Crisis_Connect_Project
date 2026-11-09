import type { Metadata } from "next";

import { ResponderReviewCard } from "@/components/admin/responder-review-card";
import { ResponderSummaryCard } from "@/components/admin/responder-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Responder registrations"
        description="Approve volunteer and rescue team accounts so they can access the responder dashboard."
      />

      {error ? (
        <Notice tone="warning">
          We could not load responder registrations right now. Refresh the page
          to try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Awaiting approval
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Oldest registrations appear first.
          </p>
        </div>

        {!error && pendingResult.responders.length === 0 ? (
          <EmptyState
            title="No registrations are waiting"
            description="New volunteer and rescue team registrations will appear here for review."
          />
        ) : null}

        {pendingResult.responders.map((responder) => (
          <ResponderReviewCard key={responder.id} responder={responder} />
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Reviewed responders
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            The 20 most recently updated approved and rejected registrations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-950">
              Approved ({counts.active})
            </h3>
            {!error && approvedResult.responders.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
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
            <h3 className="text-sm font-semibold text-ink-950">
              Rejected ({counts.rejected})
            </h3>
            {!error && rejectedResult.responders.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
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
    </div>
  );
}
