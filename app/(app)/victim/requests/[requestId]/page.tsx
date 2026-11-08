import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
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
      "An administrator approved this request. Responder assignment and response tracking are added in a later approved chunk.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  rejected: {
    title: "Request not approved",
    detail:
      "This request was not approved. Contact an administrator if you believe the decision should be reviewed.",
    className: "border-rose-200 bg-rose-50 text-rose-950",
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
          className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          ← Back to requests
        </Link>
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-rose-950">
            We could not load this request
          </h1>
          <p className="mt-2 text-sm leading-6 text-rose-900">
            Refresh the page to try again, or return to your request list.
          </p>
          <Link
            href="/victim/requests"
            className="mt-5 inline-flex rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/victim/requests"
          className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          ← Back to requests
        </Link>
      </div>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              Emergency request
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {request.emergency_type}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
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
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {request.description}
          </p>

          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Location
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {request.location}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Affected people
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatAffectedPeople(request.affected_people)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Severity
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {EMERGENCY_SEVERITY_LABELS[request.severity]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Submitted
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(request.created_at)}
              </dd>
            </div>
            {request.reviewed_at ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Reviewed
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(request.reviewed_at)}
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Reference
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-600">
                {request.request_id}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-4">
          <section className={`rounded-3xl border p-6 ${copy.className}`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
              Review status
            </h2>
            <p className="mt-2 text-base font-semibold">{copy.title}</p>
            <p className="mt-2 text-sm leading-6">{copy.detail}</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              What you can do
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600">
              <li>Track the review decision on this page.</li>
              <li>Keep your phone and address current in your profile.</li>
              <li>
                Responder assignment and live tracking arrive in a later
                approved chunk.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
