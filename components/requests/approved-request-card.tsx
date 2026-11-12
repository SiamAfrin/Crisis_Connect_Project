import { SeverityBadge } from "@/components/requests/severity-badge";
import { MapPinIcon, UsersIcon } from "@/components/ui/icons";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import type { AppEnums, Tables } from "@/types/database";

import { AcceptRequestButton } from "./accept-request-button";
import { AssignmentStatusBadge } from "./assignment-status-badge";

type ApprovedRequestCardProps = {
  request: Tables<"emergency_requests">;
  acceptedAt?: string | null;
  assignmentStatus?: AppEnums["assignment_status"] | null;
};

/**
 * An approved request as seen by an active responder. The accept action is
 * offered until the responder accepts. Victim contact details are only shown on
 * the assigned-request card, so unassigned responders cannot read them.
 */
export function ApprovedRequestCard({
  request,
  acceptedAt,
  assignmentStatus,
}: ApprovedRequestCardProps) {
  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-500">
            {formatDateTime(request.created_at)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink-950">
            {request.emergency_type}
          </h3>
        </div>
        <SeverityBadge severity={request.severity} />
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-600">
        {request.description}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-3 text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <MapPinIcon aria-hidden="true" className="size-3.5 text-ink-400" />
          <dt className="sr-only">Location</dt>
          <dd className="max-w-72 truncate">{request.location}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon aria-hidden="true" className="size-3.5 text-ink-400" />
          <dt className="sr-only">Affected people</dt>
          <dd>{formatAffectedPeople(request.affected_people)}</dd>
        </div>
      </dl>

      {acceptedAt ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            You accepted this request
          </span>
          <span className="text-xs text-ink-500">
            {formatDateTime(acceptedAt)}
          </span>
          {assignmentStatus ? (
            <AssignmentStatusBadge status={assignmentStatus} />
          ) : (
            <span className="text-xs text-ink-500">
              Awaiting administrator assignment
            </span>
          )}
        </div>
      ) : (
        <AcceptRequestButton
          requestId={request.request_id}
          label={request.emergency_type}
        />
      )}
    </article>
  );
}
