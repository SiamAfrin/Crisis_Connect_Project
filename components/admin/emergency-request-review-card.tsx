import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { SeverityBadge } from "@/components/requests/severity-badge";
import { MapPinIcon, PhoneIcon, UserIcon, UsersIcon } from "@/components/ui/icons";
import type { AdminEmergencyRequest } from "@/lib/admin/data";
import { EMERGENCY_SEVERITY_LABELS } from "@/lib/constants";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";

import { EmergencyRequestReviewActions } from "./emergency-request-review-actions";

type EmergencyRequestReviewCardProps = {
  item: AdminEmergencyRequest;
};

export function EmergencyRequestReviewCard({
  item,
}: EmergencyRequestReviewCardProps) {
  const { request, victim } = item;

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
          <p className="mt-1 break-all text-sm text-ink-500">
            {victim
              ? `${victim.full_name} · ${victim.email}`
              : "Victim profile unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={request.severity} />
          <RequestStatusBadge status={request.request_status} />
        </div>
      </div>

      <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink-700">
        {request.description}
      </p>

      <dl className="mt-5 grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
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
        {victim ? (
          <div className="flex gap-2.5">
            <PhoneIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-ink-400"
            />
            <div>
              <dt className="meta-label">Victim phone</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {victim.phone}
              </dd>
            </div>
          </div>
        ) : null}
        {victim ? (
          <div className="flex gap-2.5 sm:col-span-2">
            <UserIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-ink-400"
            />
            <div>
              <dt className="meta-label">Victim address</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {victim.address}
              </dd>
            </div>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="meta-label">Reference</dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink-600">
            {request.request_id}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-line pt-5">
        <EmergencyRequestReviewActions
          requestId={request.request_id}
          label={request.emergency_type}
        />
      </div>
    </article>
  );
}
