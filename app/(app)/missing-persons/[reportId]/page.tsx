import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MissingPersonStatusBadge } from "@/components/missing-persons/missing-person-status-badge";
import { MissingPersonPhoto } from "@/components/missing-persons/missing-person-photo";
import { MissingPersonStatusControls } from "@/components/missing-persons/missing-person-status-controls";
import { buttonSecondary } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { requireActiveAccount } from "@/lib/auth/dal";
import { MISSING_PERSON_GENDER_LABELS } from "@/lib/constants";
import {
  getMissingPerson,
  getMissingPersonReporter,
} from "@/lib/missing-persons/data";
import { missingPersonIdSchema } from "@/lib/missing-persons/schemas";
import { formatDateTime } from "@/lib/requests/format";

export const metadata: Metadata = {
  title: "Missing person details",
  description: "Review a missing person report and its current status.",
};

// This page reads the dynamic report id from the URL.
export const instant = false;

type MissingPersonDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function MissingPersonDetailPage({
  params,
}: MissingPersonDetailPageProps) {
  const { supabase, profile } = await requireActiveAccount();
  const { reportId } = await params;
  const parsedId = missingPersonIdSchema.safeParse(reportId);

  if (!parsedId.success) {
    notFound();
  }

  const { report, error } = await getMissingPerson(supabase, parsedId.data);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/missing-persons"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back to missing persons
        </Link>
        <section className="rounded-lg border border-signal-200 bg-signal-50 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-signal-950">
            We could not load this report
          </h1>
          <p className="mt-2 text-sm leading-6 text-signal-900">
            Refresh the page to try again, or return to the missing person
            directory.
          </p>
          <Link
            href="/missing-persons"
            className={`${buttonSecondary} mt-5`}
          >
            Back to missing persons
          </Link>
        </section>
      </div>
    );
  }

  if (!report) {
    notFound();
  }

  const isAdmin = profile.role === "administrator";
  const isReporter = report.reporter_id === profile.id;
  const canUpdate = isAdmin || isReporter;

  // Profile RLS returns the reporter's contact details only to the reporter
  // themselves or an active administrator, so responders never see them.
  const reporterResult = canUpdate
    ? await getMissingPersonReporter(supabase, report.reporter_id)
    : null;
  const reporter = reporterResult?.reporter ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/missing-persons"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to missing persons
      </Link>

      <header className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <MissingPersonPhoto
              src={report.photoUrl}
              alt={report.full_name}
              variant="detail"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-500">
                Reported {formatDateTime(report.created_at)}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-ink-950">
                {report.full_name}
              </h1>
              <p className="mt-2 text-sm text-ink-500">
                {report.age !== null
                  ? `${report.age} years old · ${MISSING_PERSON_GENDER_LABELS[report.gender]}`
                  : MISSING_PERSON_GENDER_LABELS[report.gender]}
              </p>
            </div>
          </div>
          <MissingPersonStatusBadge status={report.status} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="panel p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-ink-950">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-700">
            {report.description}
          </p>

          <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
            <div>
              <dt className="meta-label">Last seen location</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {report.last_seen_location}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Last seen at</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {formatDateTime(report.last_seen_at)}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Age</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {report.age ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Gender</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {MISSING_PERSON_GENDER_LABELS[report.gender]}
              </dd>
            </div>
            {report.resolved_at ? (
              <div>
                <dt className="meta-label">Found at</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {formatDateTime(report.resolved_at)}
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="meta-label">Reference</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink-600">
                {report.report_id}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-4">
          {reporter ? (
            <section className="panel p-6">
              <h2 className="text-sm font-semibold text-ink-950">
                Reporter contact
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="meta-label">Name</dt>
                  <dd className="mt-1 font-medium text-ink-900">
                    {reporter.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="meta-label">Phone</dt>
                  <dd className="mt-1 font-medium text-ink-900">
                    {reporter.phone}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 text-ink-500">
                Only the reporter and administrators can see this contact
                information.
              </p>
            </section>
          ) : null}

          {canUpdate ? (
            <section className="panel p-6">
              <h2 className="text-sm font-semibold text-ink-950">
                Manage report
              </h2>
              <MissingPersonStatusControls
                reportId={report.report_id}
                status={report.status}
                canReopen={isAdmin}
              />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
