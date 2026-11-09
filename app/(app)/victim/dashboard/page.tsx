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
  title: "Victim dashboard",
  description: "Your Crisis Connect victim dashboard.",
};

// This page blocks on the victim session, so it cannot render an instant shell.
export const instant = false;

export default async function VictimDashboardPage() {
  const { supabase, profile } = await requireActiveRole("victim");
  const { requests: recent, error } = await listVictimRequests(
    supabase,
    profile.id,
    5,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your recent emergency requests and their review status."
        actions={
          <Link href="/victim/requests/new" className={buttonSignal}>
            New emergency request
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink-950">
            Recent requests
          </h2>
          <Link
            href="/victim/requests"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-600 underline-offset-4 transition hover:text-signal-700 hover:underline"
          >
            View all requests
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          </Link>
        </div>

        {!error && recent.length === 0 ? (
          <EmptyState
            title="No emergency requests yet"
            description="When you submit a request, it will appear here with its review status."
            action={
              <Link href="/victim/requests/new" className={buttonSignal}>
                Create your first request
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            }
          />
        ) : null}

        {recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((request) => (
              <RequestCard key={request.request_id} request={request} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
