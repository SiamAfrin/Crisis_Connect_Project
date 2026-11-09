import { SeverityBadge } from "@/components/requests/severity-badge";
import { MapPinIcon, UsersIcon } from "@/components/ui/icons";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import type { Tables } from "@/types/database";

import { AssignmentStatusBadge } from "./assignment-status-badge";

type RequestVictimContact = Pick<
  Tables<"profiles">,
  "full_name" | "phone" | "address"
>;

type AssignedRequestCardProps = {
  assignment: Tables<"emergency_assignments">;
  request: Tables<"emergency_requests"> | null;
  victim?: RequestVictimContact | null;
};

/**
 * An emergency request assigned to the signed-in responder. Only the
 * responder's own assignment is passed in; other responders' assignments are
 * excluded by RLS and by the request-scoped query filter.
 */
export function AssignedRequestCard({
  assignment,
  request,
  victim,
}: AssignedRequestCardProps) {
  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-500">
            Assigned {formatDateTime(assignment.assigned_at)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink-950">
            {request ? request.emergency_type : "Emergency request"}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {request ? <SeverityBadge severity={request.severity} /> : null}
          <AssignmentStatusBadge status={assignment.assignment_status} />
        </div>
      </div>

      {request ? (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">
            {request.description}
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-3 text-xs text-ink-500">
            <div className="flex items-center gap-1.5">
              <MapPinIcon
                aria-hidden="true"
                className="size-3.5 text-ink-400"
              />
              <dt className="sr-only">Location</dt>
              <dd className="max-w-72 truncate">{request.location}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <UsersIcon
                aria-hidden="true"
                className="size-3.5 text-ink-400"
              />
              <dt className="sr-only">Affected people</dt>
              <dd>{formatAffectedPeople(request.affected_people)}</dd>
            </div>
            <div>
              <dt className="sr-only">Submitted</dt>
              <dd>Submitted {formatDateTime(request.created_at)}</dd>
            </div>
          </dl>

          {victim ? (
            <div className="mt-4 rounded-lg border border-line bg-ink-50 px-4 py-3">
              <p className="meta-label">Victim contact</p>
              <p className="mt-1.5 text-sm font-semibold text-ink-950">
                {victim.full_name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-ink-600">
                <span>{victim.phone}</span>
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
                <span>{victim.address}</span>
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The request details are not available for this assignment.
        </p>
      )}
    </article>
  );
}
