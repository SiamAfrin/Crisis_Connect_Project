import { AssignmentStatusBadge } from "@/components/requests/assignment-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
import { MapPinIcon, PhoneIcon, UserIcon, UsersIcon } from "@/components/ui/icons";
import type { AdminMission } from "@/lib/admin/data";
import {
  EMERGENCY_SEVERITY_LABELS,
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
  getRoleLabel,
} from "@/lib/constants";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";

type AdminMissionCardProps = {
  mission: AdminMission;
  compact?: boolean;
};

/**
 * A mission is an emergency assignment. Administrators can monitor the assigned
 * responder, the request, and the current mission status, but mission status
 * changes remain reserved for the assigned responder.
 */
export function AdminMissionCard({
  mission,
  compact = false,
}: AdminMissionCardProps) {
  const { assignment, request, responder, victim } = mission;
  const categoryLabel = getRescueCategoryLabel(
    responder?.rescue_team_category ?? null,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    responder?.defence_subcategory ?? null,
  );

  if (compact) {
    return (
      <article className="rounded-lg border border-line bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-ink-500">
              Assigned {formatDateTime(assignment.assigned_at)}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-ink-950">
              {request ? request.emergency_type : "Emergency request"}
            </h3>
          </div>
          <AssignmentStatusBadge status={assignment.assignment_status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
          <span>
            Responder:{" "}
            <span className="font-medium text-ink-900">
              {responder ? responder.full_name : "Unavailable"}
            </span>
          </span>
          <span>
            Victim:{" "}
            <span className="font-medium text-ink-900">
              {victim ? victim.full_name : "Unavailable"}
            </span>
          </span>
          {request ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon
                aria-hidden="true"
                className="size-3.5 text-ink-400"
              />
              <span className="max-w-56 truncate">{request.location}</span>
            </span>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-500">
            Assigned {formatDateTime(assignment.assigned_at)}
          </p>
          {assignment.accepted_at ? (
            <p className="mt-0.5 text-xs text-ink-500">
              Mission accepted {formatDateTime(assignment.accepted_at)}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink-950">
            {request ? request.emergency_type : "Emergency request"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {responder
              ? `${responder.full_name} · ${getRoleLabel(responder.role)}`
              : "Assigned responder unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {request ? <SeverityBadge severity={request.severity} /> : null}
          {request ? (
            <RequestStatusBadge status={request.request_status} />
          ) : null}
          <AssignmentStatusBadge status={assignment.assignment_status} />
        </div>
      </div>

      {request ? (
        <>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-700">
            {request.description}
          </p>

          <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
            <div className="flex gap-2.5">
              <MapPinIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-ink-400"
              />
              <div>
                <dt className="meta-label">Location</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {request.location}
                </dd>
              </div>
            </div>
            <div className="flex gap-2.5">
              <UsersIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-ink-400"
              />
              <div>
                <dt className="meta-label">Affected people</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {formatAffectedPeople(request.affected_people)}
                </dd>
              </div>
            </div>
            <div>
              <dt className="meta-label">Severity</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {EMERGENCY_SEVERITY_LABELS[request.severity]}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Request submitted</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {formatDateTime(request.created_at)}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Request reviewed</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {request.reviewed_at
                  ? formatDateTime(request.reviewed_at)
                  : "Not reviewed"}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Reference</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink-600">
                {request.request_id}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The emergency request for this mission is no longer available.
        </p>
      )}

      <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-ink-50 px-4 py-3">
          <p className="meta-label">Assigned responder</p>
          {responder ? (
            <>
              <p className="mt-1.5 text-sm font-semibold text-ink-950">
                {responder.full_name}
              </p>
              <p className="mt-1 break-all text-xs text-ink-500">
                {responder.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-ink-700">
                <span className="rounded-md border border-line bg-white px-2 py-0.5 font-medium">
                  {getRoleLabel(responder.role)}
                </span>
                {categoryLabel ? (
                  <span className="rounded-md border border-line bg-white px-2 py-0.5">
                    {categoryLabel}
                  </span>
                ) : null}
                {subcategoryLabel ? (
                  <span className="rounded-md border border-line bg-white px-2 py-0.5">
                    {subcategoryLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-600">
                <PhoneIcon
                  aria-hidden="true"
                  className="size-3.5 text-ink-400"
                />
                {responder.phone}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-600">
              Responder profile unavailable.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-line bg-ink-50 px-4 py-3">
          <p className="meta-label">Victim contact</p>
          {victim ? (
            <>
              <p className="mt-1.5 text-sm font-semibold text-ink-950">
                {victim.full_name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon
                    aria-hidden="true"
                    className="size-3.5 text-ink-400"
                  />
                  {victim.phone}
                </span>
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon
                    aria-hidden="true"
                    className="size-3.5 text-ink-400"
                  />
                  {victim.address}
                </span>
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-600">
              Victim profile unavailable.
            </p>
          )}
        </div>
      </div>

      {assignment.assignment_status === "completed" ? (
        <p className="mt-4 text-xs leading-5 text-ink-500">
          This completed mission record is retained for monitoring. The database
          stores the assignment and mission-acceptance times; completion changes
          the mission status to completed.
        </p>
      ) : null}
    </article>
  );
}
