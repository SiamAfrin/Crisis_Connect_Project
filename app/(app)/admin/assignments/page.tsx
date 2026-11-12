import type { Metadata } from "next";

import { EmergencyAssignmentCard } from "@/components/admin/emergency-assignment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { listAcceptedRequestsForAdmin } from "@/lib/admin/data";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Responder assignments",
  description:
    "Assign active responders who accepted approved emergency requests.",
};

// This page blocks on the administrator session, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

export default async function AdminAssignmentsPage() {
  const { supabase } = await requireActiveRole("administrator");

  const { items, error } = await listAcceptedRequestsForAdmin(supabase);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Responder assignments"
        description="Approved requests that responders have accepted appear here. Assign one accepted responder to each request; once assigned, the request stays visible but is closed to other responders."
      />

      {error ? (
        <Notice tone="warning">
          We could not load responder assignments right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Accepted requests
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Only responders who accepted a request are eligible for assignment.
            A request can have one assigned responder.
          </p>
        </div>

        {!error && items.length === 0 ? (
          <EmptyState
            title="No accepted requests yet"
            description="When a verified responder accepts an approved request, it will appear here for assignment."
          />
        ) : null}

        {items.map((item) => (
          <EmergencyAssignmentCard
            key={item.request.request_id}
            item={item}
          />
        ))}
      </section>
    </div>
  );
}
