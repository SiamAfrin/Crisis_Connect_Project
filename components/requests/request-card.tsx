import Link from "next/link";

import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import type { Tables } from "@/types/database";

import { MapPinIcon, UsersIcon } from "@/components/ui/icons";

import { RequestStatusBadge } from "./request-status-badge";
import { SeverityBadge } from "./severity-badge";

type RequestCardProps = {
  request: Tables<"emergency_requests">;
};

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Link
      href={`/victim/requests/${request.request_id}`}
      className="group block rounded-lg border border-line bg-white p-5 transition hover:border-ink-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">
            {formatDateTime(request.created_at)}
          </p>
          <h2 className="mt-1 text-base font-semibold text-ink-950 transition group-hover:text-signal-700">
            {request.emergency_type}
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={request.severity} />
          <RequestStatusBadge status={request.request_status} />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-600">
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
    </Link>
  );
}
