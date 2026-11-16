import type { Metadata } from "next";
import Link from "next/link";

import { AdminMissionCard } from "@/components/admin/admin-mission-card";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { EmergencyAssignmentCard } from "@/components/admin/emergency-assignment-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  getMissionCounts,
  listAcceptedRequestsForAdmin,
  listMissionsForAdmin,
} from "@/lib/admin/data";
import {
  getMissionStatusesForFilter,
  MISSION_STATUS_FILTERS,
  normalizeMissionStatusFilter,
} from "@/lib/admin/mission-filters";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Responder assignments",
  description:
    "Assign accepted responders and monitor rescue mission statuses.",
};

// This page blocks on the administrator session, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

type AdminAssignmentsPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminAssignmentsPage({
  searchParams,
}: AdminAssignmentsPageProps) {
  const { supabase } = await requireActiveRole("administrator");
  const params = await searchParams;
  const status = normalizeMissionStatusFilter(
    typeof params.status === "string" ? params.status : "",
  );

  const [countsResult, acceptedResult, missionResult] = await Promise.all([
    getMissionCounts(supabase),
    listAcceptedRequestsForAdmin(supabase),
    listMissionsForAdmin(supabase, {
      statuses: getMissionStatusesForFilter(status),
      limit: 100,
    }),
  ]);

  const error =
    countsResult.error ?? acceptedResult.error ?? missionResult.error;
  const counts = countsResult.counts;

  const filterCounts = {
    all: counts.total,
    pending: counts.pending,
    accepted: counts.accepted,
    completed: counts.completed,
    closed: counts.declined + counts.cancelled,
  } as const;

  const filters = MISSION_STATUS_FILTERS.map((filter) => ({
    ...filter,
    count: filterCounts[filter.value],
  }));

  return (
    <div className="space-y-10">
      <PageHeader
        title="Responder assignments"
        description="Assign one accepted responder to each approved request, then monitor every assigned mission and its status. Completed missions remain available as records."
      />

      {error ? (
        <Notice tone="warning">
          We could not load responder assignments right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-4" aria-label="Mission status counts">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Mission status summary
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Counts come from every assignment record, including completed and
            closed missions.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard
            label="Awaiting start"
            value={counts.pending}
            tone="warning"
          />
          <AdminStatCard
            label="In progress"
            value={counts.accepted}
            tone="info"
          />
          <AdminStatCard
            label="Completed"
            value={counts.completed}
            tone="success"
          />
          <AdminStatCard
            label="Closed"
            value={counts.declined + counts.cancelled}
          />
          <AdminStatCard label="Total missions" value={counts.total} />
        </div>
      </section>

      <section className="space-y-4" aria-label="Accepted requests">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Accepted requests
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Only responders who accepted a request are eligible for assignment.
            A request can have one assigned responder.
          </p>
        </div>

        {!error && acceptedResult.items.length === 0 ? (
          <EmptyState
            title="No accepted requests yet"
            description="When a verified responder accepts an approved request, it will appear here for assignment."
          />
        ) : null}

        {acceptedResult.items.map((item) => (
          <EmergencyAssignmentCard
            key={item.request.request_id}
            item={item}
          />
        ))}
      </section>

      <section className="space-y-4" aria-label="Mission monitor">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">
            Mission monitor
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Every assigned rescue mission with its current status. Mission status
            changes remain reserved for the assigned responder.
          </p>
        </div>

        <nav aria-label="Filter missions by status" className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = status === filter.value;

            return (
              <Link
                key={filter.value}
                href={`/admin/assignments?status=${filter.value}`}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "inline-flex items-center gap-2 rounded-lg border border-ink-950 bg-ink-950 px-3 py-2 text-xs font-semibold text-white"
                    : "inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-300 hover:text-ink-950"
                }
              >
                {filter.label}
                <span
                  className={
                    isActive
                      ? "rounded-md bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold"
                      : "rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600"
                  }
                >
                  {filter.count}
                </span>
              </Link>
            );
          })}
        </nav>

        {!error && missionResult.items.length === 0 ? (
          <EmptyState
            title="No missions match this status"
            description="Assigned missions will appear here. Choose another status filter to review other mission records."
          />
        ) : null}

        {missionResult.items.map((mission) => (
          <AdminMissionCard
            key={mission.assignment.assignment_id}
            mission={mission}
          />
        ))}
      </section>
    </div>
  );
}
