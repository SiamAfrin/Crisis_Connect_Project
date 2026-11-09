import type { Metadata } from "next";
import Link from "next/link";

import { RequestCard } from "@/components/requests/request-card";
import { buttonSignal } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { requireActiveRole } from "@/lib/auth/dal";
import { listVictimRequests } from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "My emergency requests",
  description: "Track the emergency requests you have submitted.",
};

// This page blocks on the victim session, so it cannot render an instant shell.
export const instant = false;

export default async function VictimRequestsPage() {
  const { supabase, profile } = await requireActiveRole("victim");
  const { requests, error } = await listVictimRequests(
    supabase,
    profile.id,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your requests"
        description="Every request is reviewed by an administrator. Open one to see its status and details."
        actions={
          <Link href="/victim/requests/new" className={buttonSignal}>
            New request
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        }
      />

      {error ? (
        <Notice tone="warning">
          We could not load your requests right now. Refresh the page to try
          again.
        </Notice>
      ) : null}

      {!error && requests.length === 0 ? (
        <EmptyState
          title="Submit your first emergency request"
          description="Include the emergency type, location, severity, number of affected people, and a clear description so an administrator can review it quickly."
          action={
            <Link href="/victim/requests/new" className={buttonSignal}>
              Create a request
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          }
        />
      ) : null}

      {requests.length > 0 ? (
        <section className="space-y-3" aria-label="Your emergency requests">
          {requests.map((request) => (
            <RequestCard key={request.request_id} request={request} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
