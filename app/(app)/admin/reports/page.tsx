import type { Metadata } from "next";
import Link from "next/link";

import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AssignmentStatusBadge } from "@/components/requests/assignment-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Notice,
  inputClassName,
  selectClassName,
} from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { formatCount } from "@/lib/admin/format";
import { requireActiveRole } from "@/lib/auth/dal";
import {
  REPORT_TYPE_OPTIONS,
  REPORT_ROW_LIMIT,
  normalizeReportType,
  parseReportRange,
} from "@/lib/reports/params";
import {
  getEmergencyRequestReport,
  getRescueActivityReport,
} from "@/lib/reports/data";
import type {
  EmergencyRequestReport,
  RescueActivityReport,
} from "@/lib/reports/types";
import { formatAffectedPeople, formatDateTime } from "@/lib/requests/format";

export const metadata: Metadata = {
  title: "Administrator reports",
  description:
    "Generate basic reports from emergency requests and rescue activities.",
};

// This page blocks on the administrator session, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

type ReportsPageProps = {
  searchParams: Promise<{
    report?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

// Report dates are calendar days, so they are formatted without a time zone
// shift. Timestamps inside the report use Bangladesh time.
const calendarDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function firstValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function formatCalendarDate(value: string): string {
  return calendarDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function describeRange(from: string, to: string): string {
  if (from && to) {
    return `${formatCalendarDate(from)} – ${formatCalendarDate(to)}`;
  }

  if (from) {
    return `From ${formatCalendarDate(from)}`;
  }

  if (to) {
    return `Until ${formatCalendarDate(to)}`;
  }

  return "All time";
}

const thClassName =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500";
const tdClassName = "px-4 py-3 align-top text-sm text-ink-700";

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const { supabase } = await requireActiveRole("administrator");
  const params = await searchParams;

  const type = normalizeReportType(firstValue(params.report));
  const fromParam = firstValue(params.from).trim();
  const toParam = firstValue(params.to).trim();
  const { range, error: rangeError } = parseReportRange({
    from: fromParam,
    to: toParam,
  });

  let requestReport: EmergencyRequestReport | null = null;
  let rescueReport: RescueActivityReport | null = null;
  let loadError: string | undefined;

  if (!rangeError) {
    if (type === "missions") {
      const result = await getRescueActivityReport(supabase, range);
      rescueReport = result.report;
      loadError = result.error;
    } else {
      const result = await getEmergencyRequestReport(supabase, range);
      requestReport = result.report;
      loadError = result.error;
    }
  }

  const selectedType =
    REPORT_TYPE_OPTIONS.find((option) => option.value === type) ??
    REPORT_TYPE_OPTIONS[0];

  const rangeLabel = rangeError ? null : describeRange(fromParam, toParam);
  const rows =
    type === "missions"
      ? (rescueReport?.rows ?? [])
      : (requestReport?.rows ?? []);
  const truncated =
    type === "missions"
      ? (rescueReport?.truncated ?? false)
      : (requestReport?.truncated ?? false);

  const exportQuery = new URLSearchParams({ report: type });
  if (fromParam) {
    exportQuery.set("from", fromParam);
  }
  if (toParam) {
    exportQuery.set("to", toParam);
  }
  const exportHref = `/admin/reports/export?${exportQuery.toString()}`;
  const canExport = !rangeError && !loadError && rows.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Generate basic reports from emergency requests and rescue activities. Every report is built from current database records."
        actions={
          canExport ? (
            <a href={exportHref} className={buttonPrimary}>
              Download CSV
            </a>
          ) : null
        }
      />

      <form action="/admin/reports" method="get" className="panel p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_12rem_12rem_auto] lg:items-end">
          <div className="space-y-1.5">
            <label
              htmlFor="report-type"
              className="text-sm font-medium text-ink-800"
            >
              Report
            </label>
            <select
              id="report-type"
              name="report"
              defaultValue={type}
              className={selectClassName}
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="report-from"
              className="text-sm font-medium text-ink-800"
            >
              From
            </label>
            <input
              id="report-from"
              name="from"
              type="date"
              defaultValue={fromParam}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="report-to"
              className="text-sm font-medium text-ink-800"
            >
              To
            </label>
            <input
              id="report-to"
              name="to"
              type="date"
              defaultValue={toParam}
              className={inputClassName}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className={buttonPrimary}>
              Generate report
            </button>
            <Link href="/admin/reports" className={buttonSecondary}>
              Reset
            </Link>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-ink-500">
          Dates are inclusive and use Bangladesh Standard Time (UTC+6). Leave
          both dates blank to report on all records.
        </p>
      </form>

      {rangeError ? <Notice tone="warning">{rangeError}</Notice> : null}

      {loadError ? (
        <Notice tone="warning">
          The report could not be generated right now. Refresh the page or try a
          smaller period.
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            {selectedType.label}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {selectedType.description}
          </p>
        </div>
        {rangeLabel ? (
          <p className="text-sm font-medium text-ink-700">{rangeLabel}</p>
        ) : null}
      </div>

      {truncated ? (
        <Notice tone="warning">
          This report is limited to the first {formatCount(REPORT_ROW_LIMIT)}{" "}
          matching records. Narrow the date range for complete totals. The CSV
          export contains the same first {formatCount(REPORT_ROW_LIMIT)} records.
        </Notice>
      ) : null}

      {type === "requests" && requestReport && !loadError ? (
        <>
          <section className="space-y-4" aria-label="Emergency request totals">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="Total requests"
                value={requestReport.summary.total}
              />
              <AdminStatCard
                label="Pending review"
                value={requestReport.summary.pending}
                tone="warning"
              />
              <AdminStatCard
                label="Approved"
                value={requestReport.summary.approved}
                tone="success"
              />
              <AdminStatCard
                label="Rejected"
                value={requestReport.summary.rejected}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="Low severity"
                value={requestReport.summary.low}
              />
              <AdminStatCard
                label="Medium severity"
                value={requestReport.summary.medium}
              />
              <AdminStatCard
                label="High severity"
                value={requestReport.summary.high}
                tone="warning"
              />
              <AdminStatCard
                label="Critical severity"
                value={requestReport.summary.critical}
                tone="warning"
              />
            </div>
          </section>

          {requestReport.summary.byType.length > 0 ? (
            <section className="space-y-3" aria-label="Requests by emergency type">
              <h3 className="text-sm font-semibold text-ink-950">
                Requests by emergency type
              </h3>
              <div className="overflow-x-auto rounded-lg border border-line bg-white">
                <table className="min-w-full divide-y divide-line">
                  <thead className="bg-ink-50">
                    <tr>
                      <th scope="col" className={thClassName}>
                        Emergency type
                      </th>
                      <th scope="col" className={thClassName}>
                        Requests
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {requestReport.summary.byType.map((entry) => (
                      <tr key={entry.type}>
                        <td className={`${tdClassName} font-medium text-ink-900`}>
                          {entry.type}
                        </td>
                        <td className={tdClassName}>{formatCount(entry.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="space-y-3" aria-label="Emergency request records">
            <h3 className="text-sm font-semibold text-ink-950">
              Request records
            </h3>

            {requestReport.rows.length === 0 && !loadError ? (
              <EmptyState
                title="No emergency requests in this period"
                description="No requests were submitted in the selected period. Widen the dates and generate the report again."
              />
            ) : null}

            {requestReport.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-line bg-white">
                <table
                  className="min-w-full divide-y divide-line"
                  aria-label="Emergency request records"
                >
                  <thead className="bg-ink-50">
                    <tr>
                      <th scope="col" className={thClassName}>
                        Submitted
                      </th>
                      <th scope="col" className={thClassName}>
                        Emergency type
                      </th>
                      <th scope="col" className={thClassName}>
                        Severity
                      </th>
                      <th scope="col" className={thClassName}>
                        Status
                      </th>
                      <th scope="col" className={thClassName}>
                        Location
                      </th>
                      <th scope="col" className={thClassName}>
                        Affected people
                      </th>
                      <th scope="col" className={thClassName}>
                        Victim
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {requestReport.rows.map((row) => (
                      <tr key={row.request_id}>
                        <td className={`${tdClassName} whitespace-nowrap`}>
                          {formatDateTime(row.created_at)}
                        </td>
                        <td className={`${tdClassName} font-medium text-ink-900`}>
                          {row.emergency_type}
                        </td>
                        <td className={tdClassName}>
                          <SeverityBadge severity={row.severity} />
                        </td>
                        <td className={tdClassName}>
                          <RequestStatusBadge status={row.request_status} />
                        </td>
                        <td className={tdClassName}>{row.location}</td>
                        <td className={tdClassName}>
                          {formatAffectedPeople(row.affected_people)}
                        </td>
                        <td className={tdClassName}>
                          {row.victim_name ?? "Unavailable"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {type === "missions" && rescueReport && !loadError ? (
        <>
          <section className="space-y-4" aria-label="Rescue activity totals">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="Total missions"
                value={rescueReport.summary.total}
              />
              <AdminStatCard
                label="Completed"
                value={rescueReport.summary.completed}
                tone="success"
              />
              <AdminStatCard
                label="In progress"
                value={rescueReport.summary.accepted}
                tone="info"
              />
              <AdminStatCard
                label="Awaiting start"
                value={rescueReport.summary.pending}
                tone="warning"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="Unique responders"
                value={rescueReport.summary.uniqueResponders}
              />
              <AdminStatCard
                label="Unique victims"
                value={rescueReport.summary.uniqueVictims}
              />
              <AdminStatCard
                label="Declined missions"
                value={rescueReport.summary.declined}
              />
              <AdminStatCard
                label="Cancelled missions"
                value={rescueReport.summary.cancelled}
              />
            </div>
          </section>

          <section className="space-y-3" aria-label="Rescue activity records">
            <h3 className="text-sm font-semibold text-ink-950">
              Mission records
            </h3>

            {rescueReport.rows.length === 0 && !loadError ? (
              <EmptyState
                title="No rescue activity in this period"
                description="No missions were assigned in the selected period. Widen the dates and generate the report again."
              />
            ) : null}

            {rescueReport.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-line bg-white">
                <table
                  className="min-w-full divide-y divide-line"
                  aria-label="Rescue activity records"
                >
                  <thead className="bg-ink-50">
                    <tr>
                      <th scope="col" className={thClassName}>
                        Assigned
                      </th>
                      <th scope="col" className={thClassName}>
                        Accepted
                      </th>
                      <th scope="col" className={thClassName}>
                        Mission status
                      </th>
                      <th scope="col" className={thClassName}>
                        Emergency type
                      </th>
                      <th scope="col" className={thClassName}>
                        Severity
                      </th>
                      <th scope="col" className={thClassName}>
                        Location
                      </th>
                      <th scope="col" className={thClassName}>
                        Responder
                      </th>
                      <th scope="col" className={thClassName}>
                        Victim
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {rescueReport.rows.map((row) => (
                      <tr key={row.assignment_id}>
                        <td className={`${tdClassName} whitespace-nowrap`}>
                          {formatDateTime(row.assigned_at)}
                        </td>
                        <td className={`${tdClassName} whitespace-nowrap`}>
                          {row.accepted_at
                            ? formatDateTime(row.accepted_at)
                            : "Not accepted"}
                        </td>
                        <td className={tdClassName}>
                          <AssignmentStatusBadge
                            status={row.assignment_status}
                          />
                        </td>
                        <td className={`${tdClassName} font-medium text-ink-900`}>
                          {row.emergency_type ?? "Unavailable"}
                        </td>
                        <td className={tdClassName}>
                          {row.severity ? (
                            <SeverityBadge severity={row.severity} />
                          ) : (
                            "Unavailable"
                          )}
                        </td>
                        <td className={tdClassName}>
                          {row.location ?? "Unavailable"}
                        </td>
                        <td className={tdClassName}>
                          {row.responder_name ?? "Unavailable"}
                        </td>
                        <td className={tdClassName}>
                          {row.victim_name ?? "Unavailable"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      <p className="border-t border-line pt-4 text-xs leading-5 text-ink-500">
        Generated {formatDateTime(new Date().toISOString())} from current
        database records. Reports cover only the selected period and are not
        real-time.
      </p>
    </div>
  );
}
