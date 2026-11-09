import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
import { buttonSecondary } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { requireActiveRole } from "@/lib/auth/dal";
import { EMERGENCY_SEVERITY_LABELS } from "@/lib/constants";
import { getVictimRequest } from "@/lib/requests/data";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import { requestIdSchema } from "@/lib/requests/schemas";

export const metadata: Metadata = {
  title: "Request details",
  description: "Review the details and status of your emergency request.",
};

// This page reads the dynamic request id from the URL.
export const instant = false;

type RequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

const statusCopy = {
  pending: {
    title: "Awaiting administrator review",
    detail:
      "Your request is queued for review. Responder assignment cannot begin until an administrator approves it.",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  approved: {
    title: "Request approved",
    detail:
      "An administrator approved this request. Verified responders can now accept it, and an administrator will assign the responder for the response.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  rejected: {
    title: "Request not approved",
    detail:
      "This request was not approved. Contact an administrator if you believe the decision should be reviewed.",
    className: "border-signal-200 bg-signal-50 text-signal-950",
  },
} as const;

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { supabase, profile } = await requireActiveRole("victim");
  const { requestId } = await params;
  const parsedId = requestIdSchema.safeParse(requestId);

  if (!parsedId.success) {
    notFound();
  }

  const { request, error } = await getVictimRequest(
    supabase,
    profile.id,
    parsedId.data,
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/victim/requests"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back to requests
        </Link>
        <section className="rounded-lg border border-signal-200 bg-signal-50 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-signal-950">
            We could not load this request
          </h1>
          <p className="mt-2 text-sm leading-6 text-signal-900">
            Refresh the page to try again, or return to your request list.
          </p>
          <Link href="/victim/requests" className={`${buttonSecondary} mt-5`}>
            Back to requests
          </Link>
        </section>
      </div>
    );
  }

  if (!request) {
    notFound();
  }

  const copy = statusCopy[request.request_status];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/victim/requests"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to requests
      </Link>

      <header className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
              {request.emergency_type}
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Submitted {formatDateTime(request.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SeverityBadge severity={request.severity} />
            <RequestStatusBadge status={request.request_status} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="panel p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-ink-950">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-700">
            {request.description}
          </p>

          <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
            <div>
              <dt className="meta-label">Location</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {request.location}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Affected people</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {formatAffectedPeople(request.affected_people)}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Severity</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {EMERGENCY_SEVERITY_LABELS[request.severity]}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Submitted</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {formatDateTime(request.created_at)}
              </dd>
            </div>
            {request.reviewed_at ? (
              <div>
                <dt className="meta-label">Reviewed</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {formatDateTime(request.reviewed_at)}
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="meta-label">Reference</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink-600">
                {request.request_id}
              </dd>
            </div>
          </dl>
        </section>

        <aside>
          <section className={`rounded-lg border p-6 ${copy.className}`}>
            <h2 className="text-sm font-semibold">Review status</h2>
            <p className="mt-2 text-base font-semibold">{copy.title}</p>
            <p className="mt-2 text-sm leading-6">{copy.detail}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
