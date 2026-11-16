import type { Metadata } from "next";
import Link from "next/link";

import { AdminMissionCard } from "@/components/admin/admin-mission-card";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EmergencyRequestSummaryCard } from "@/components/admin/emergency-request-summary-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { buttonSecondary } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import {
  getAdminUserCounts,
  getEmergencyRequestCounts,
  getEmergencySeverityCounts,
  getMissionCounts,
  listMissionsForAdmin,
  listRecentEmergencyRequestsForAdmin,
} from "@/lib/admin/data";
import { formatCount } from "@/lib/admin/format";
import { requireActiveRole } from "@/lib/auth/dal";
import {
  getMissingPersonCounts,
  listMissingPersonSummaries,
} from "@/lib/missing-persons/data";
import { formatDateTime } from "@/lib/requests/format";

export const metadata: Metadata = {
  title: "Administrator dashboard",
  description:
    "Monitor emergency requests, user accounts, rescue missions, and missing person records.",
};

// This page blocks on the administrator session, so it cannot render an instant shell.
export const instant = false;

type SectionHeaderProps = {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
};

function SectionHeader({
  title,
  description,
  href,
  linkLabel,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
        <p className="mt-1 text-sm text-ink-500">{description}</p>
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 underline-offset-4 transition hover:text-ink-950 hover:underline"
        >
          {linkLabel}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireActiveRole("administrator");

  const [
    userResult,
    requestResult,
    severityResult,
    missionResult,
    missingPersonResult,
    recentRequestResult,
    activeMissionResult,
    completedMissionResult,
    foundReportResult,
  ] = await Promise.all([
    getAdminUserCounts(supabase),
    getEmergencyRequestCounts(supabase),
    getEmergencySeverityCounts(supabase),
    getMissionCounts(supabase),
    getMissingPersonCounts(supabase),
    listRecentEmergencyRequestsForAdmin(supabase, 5),
    listMissionsForAdmin(supabase, {
      statuses: ["pending", "accepted"],
      limit: 3,
    }),
    listMissionsForAdmin(supabase, { statuses: ["completed"], limit: 3 }),
    listMissingPersonSummaries(supabase, { status: "found", limit: 5 }),
  ]);

  const error =
    userResult.error ??
    requestResult.error ??
    severityResult.error ??
    missionResult.error ??
    missingPersonResult.error ??
    recentRequestResult.error ??
    activeMissionResult.error ??
    completedMissionResult.error ??
    foundReportResult.error;

  const userCounts = userResult.counts;
  const requestCounts = requestResult.counts;
  const severityCounts = severityResult.counts;
  const missionCounts = missionResult.counts;
  const missingPersonCounts = missingPersonResult.counts;

  const requestTotal =
    requestCounts.pending + requestCounts.approved + requestCounts.rejected;
  const missingTotal =
    missingPersonCounts.missing + missingPersonCounts.found;
  const closedMissions =
    missionCounts.declined + missionCounts.cancelled;
  const activeMissions = missionCounts.pending + missionCounts.accepted;

  const queues = [
    {
      href: "/admin/responders",
      label: "Responder registrations",
      detail: `${userCounts.pendingResponders} awaiting review`,
    },
    {
      href: "/admin/requests",
      label: "Emergency requests",
      detail: `${requestCounts.pending} awaiting review`,
    },
    {
      href: "/admin/assignments",
      label: "Responder assignments",
      detail: `${activeMissions} active · ${missionCounts.completed} completed`,
    },
    {
      href: "/missing-persons",
      label: "Missing persons",
      detail: `${missingPersonCounts.missing} active · ${missingPersonCounts.found} found`,
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="Monitoring dashboard"
        description={`Signed in as ${profile.full_name}. Monitor emergency requests, users, rescue missions, and missing person records from current database counts.`}
        actions={
          <Link href="/missing-persons/new" className={buttonSecondary}>
            Report missing person
          </Link>
        }
      />

      {error ? (
        <Notice tone="warning">
          We could not load the monitoring summary right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-3" aria-label="Action queues">
        <SectionHeader
          title="Action queues"
          description="Open the queue that needs an administrator decision."
        />

        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {queues.map((queue) => (
            <li key={queue.href}>
              <Link
                href={queue.href}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink-950"
              >
                <span>
                  <span className="block text-sm font-medium text-ink-950">
                    {queue.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {queue.detail}
                  </span>
                </span>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-label="Emergency request counts">
        <SectionHeader
          title="Emergency requests"
          description="Review status and severity counts for every submitted request."
          href="/admin/requests"
          linkLabel="Review requests"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Pending review"
            value={requestCounts.pending}
            tone="warning"
          />
          <AdminStatCard
            label="Approved"
            value={requestCounts.approved}
            tone="success"
          />
          <AdminStatCard label="Rejected" value={requestCounts.rejected} />
          <AdminStatCard label="Total requests" value={requestTotal} />
        </div>

        <div className="rounded-lg border border-line bg-white px-5 py-4">
          <h3 className="text-sm font-semibold text-ink-950">By severity</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-ink-50 px-3 py-2">
              <dt className="meta-label">Low</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {formatCount(severityCounts.low)}
              </dd>
            </div>
            <div className="rounded-md bg-ink-50 px-3 py-2">
              <dt className="meta-label">Medium</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {formatCount(severityCounts.medium)}
              </dd>
            </div>
            <div className="rounded-md bg-ink-50 px-3 py-2">
              <dt className="meta-label">High</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {formatCount(severityCounts.high)}
              </dd>
            </div>
            <div className="rounded-md bg-ink-50 px-3 py-2">
              <dt className="meta-label">Critical</dt>
              <dd className="mt-1 font-semibold text-ink-950">
                {formatCount(severityCounts.critical)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-4" aria-label="User counts">
        <SectionHeader
          title="Users"
          description="Registered accounts by role and responder approval status."
          href="/admin/responders"
          linkLabel="View responder accounts"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Total users" value={userCounts.total} />
          <AdminStatCard label="Victims" value={userCounts.victims} />
          <AdminStatCard
            label="Volunteers"
            value={userCounts.volunteers}
            hint="All approval statuses"
          />
          <AdminStatCard
            label="Rescue team members"
            value={userCounts.rescueTeamMembers}
            hint="All approval statuses"
          />
          <AdminStatCard
            label="Administrators"
            value={userCounts.administrators}
          />
          <AdminStatCard
            label="Active responders"
            value={userCounts.activeResponders}
            hint="Volunteers and rescue team"
            tone="success"
          />
          <AdminStatCard
            label="Awaiting approval"
            value={userCounts.pendingResponders}
            hint="Responder accounts"
            tone="warning"
          />
          <AdminStatCard
            label="Rejected responders"
            value={userCounts.rejectedResponders}
            hint="Responder accounts"
          />
        </div>
      </section>

      <section className="space-y-4" aria-label="Rescue mission counts">
        <SectionHeader
          title="Rescue missions"
          description="Every assignment is a mission record. Mission status is updated by the assigned responder."
          href="/admin/assignments"
          linkLabel="Open mission monitor"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard
            label="Awaiting start"
            value={missionCounts.pending}
            tone="warning"
          />
          <AdminStatCard
            label="In progress"
            value={missionCounts.accepted}
            tone="info"
          />
          <AdminStatCard
            label="Completed"
            value={missionCounts.completed}
            tone="success"
          />
          <AdminStatCard label="Closed" value={closedMissions} />
          <AdminStatCard label="Total missions" value={missionCounts.total} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-950">
              Active missions
            </h3>
            {!error && activeMissionResult.items.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
                No missions are awaiting start or in progress.
              </p>
            ) : null}
            {activeMissionResult.items.map((mission) => (
              <AdminMissionCard
                key={mission.assignment.assignment_id}
                mission={mission}
                compact
              />
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink-950">
              Completed missions
            </h3>
            {!error && completedMissionResult.items.length === 0 ? (
              <p className="rounded-lg border border-line bg-white px-5 py-4 text-sm text-ink-500">
                No missions have been completed yet.
              </p>
            ) : null}
            {completedMissionResult.items.map((mission) => (
              <AdminMissionCard
                key={mission.assignment.assignment_id}
                mission={mission}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-label="Missing person counts">
        <SectionHeader
          title="Missing persons"
          description="Active and resolved reports. Open a record to mark it found or reopen it."
          href="/missing-persons"
          linkLabel="Open missing persons"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard
            label="Missing"
            value={missingPersonCounts.missing}
            tone="warning"
          />
          <AdminStatCard
            label="Found"
            value={missingPersonCounts.found}
            tone="success"
          />
          <AdminStatCard label="Total reports" value={missingTotal} />
        </div>

        <div className="rounded-lg border border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-950">
                Recently found
              </h3>
              <p className="mt-1 text-xs text-ink-500">
                The five most recently found reports.
              </p>
            </div>
            <Link
              href="/missing-persons?status=found"
              className="text-xs font-medium text-ink-600 underline-offset-4 transition hover:text-ink-950 hover:underline"
            >
              View found records
            </Link>
          </div>

          {!error && foundReportResult.reports.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">
              No reports have been marked found yet.
            </p>
          ) : null}

          {foundReportResult.reports.length > 0 ? (
            <ul className="mt-3 divide-y divide-line-soft">
              {foundReportResult.reports.map((report) => (
                <li key={report.report_id}>
                  <Link
                    href={`/missing-persons/${report.report_id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm transition hover:text-ink-950"
                  >
                    <span className="font-medium text-ink-900">
                      {report.full_name}
                    </span>
                    <span className="text-xs text-ink-500">
                      {report.last_seen_location} · Found{" "}
                      {report.resolved_at
                        ? formatDateTime(report.resolved_at)
                        : "status recorded"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="space-y-4" aria-label="Recent emergency requests">
        <SectionHeader
          title="Recent emergency requests"
          description="The five most recent submissions across every review status."
          href="/admin/requests"
          linkLabel="View all requests"
        />

        {!error && recentRequestResult.items.length === 0 ? (
          <EmptyState
            title="No emergency requests yet"
            description="New victim submissions will appear here for monitoring."
          />
        ) : null}

        {recentRequestResult.items.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {recentRequestResult.items.map((item) => (
              <EmergencyRequestSummaryCard
                key={item.request.request_id}
                item={item}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
