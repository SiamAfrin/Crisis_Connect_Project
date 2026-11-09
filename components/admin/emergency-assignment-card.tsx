import { AssignmentStatusBadge } from "@/components/requests/assignment-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
import { MapPinIcon, PhoneIcon, UsersIcon } from "@/components/ui/icons";
import type { AdminAcceptedRequest } from "@/lib/admin/data";
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

import { AssignResponderButton } from "./assign-responder-button";

type EmergencyAssignmentCardProps = {
  item: AdminAcceptedRequest;
};

/**
 * One approved request with every responder who accepted it. Each responder can
 * be assigned once; already assigned responders show their assignment status
 * instead of an assign button.
 */
export function EmergencyAssignmentCard({
  item,
}: EmergencyAssignmentCardProps) {
  const { request, victim, responders } = item;

  return (
    <article className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-500">
            Submitted {formatDateTime(request.created_at)}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink-950">
            {request.emergency_type}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon
                aria-hidden="true"
                className="size-3.5 text-ink-400"
              />
              {request.location}
            </span>
            <span aria-hidden="true" className="text-ink-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon
                aria-hidden="true"
                className="size-3.5 text-ink-400"
              />
              {formatAffectedPeople(request.affected_people)} affected
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={request.severity} />
          <RequestStatusBadge status={request.request_status} />
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-700">
        {request.description}
      </p>

      <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
        <div>
          <dt className="meta-label">Severity</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {EMERGENCY_SEVERITY_LABELS[request.severity]}
          </dd>
        </div>
        <div>
          <dt className="meta-label">Reference</dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink-600">
            {request.request_id}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="meta-label">Victim contact</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-900">
            {victim ? (
              <>
                <span className="font-medium">{victim.full_name}</span>
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-ink-600">
                  <PhoneIcon
                    aria-hidden="true"
                    className="size-3.5 text-ink-400"
                  />
                  {victim.phone}
                </span>
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
                <span className="text-ink-600">{victim.address}</span>
              </>
            ) : (
              "Victim profile unavailable"
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
          Accepted responders
          <span className="rounded-md bg-ink-50 px-1.5 py-0.5 text-xs font-semibold text-ink-600">
            {responders.length}
          </span>
        </h3>

        <ul className="mt-3 space-y-3">
          {responders.map(({ acceptance, responder, assignment }) => {
            const categoryLabel = getRescueCategoryLabel(
              responder.rescue_team_category,
            );
            const subcategoryLabel = getDefenceSubcategoryLabel(
              responder.defence_subcategory,
            );

            return (
              <li
                key={acceptance.acceptance_id}
                className="rounded-lg border border-line bg-ink-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-950">
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
                    <p className="mt-2 text-xs text-ink-500">
                      Accepted {formatDateTime(acceptance.accepted_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    {assignment ? (
                      <>
                        <AssignmentStatusBadge
                          status={assignment.assignment_status}
                        />
                        <p className="text-xs text-ink-500">
                          Assigned {formatDateTime(assignment.assigned_at)}
                        </p>
                      </>
                    ) : (
                      <AssignResponderButton
                        requestId={request.request_id}
                        responderId={responder.id}
                        responderName={responder.full_name}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
