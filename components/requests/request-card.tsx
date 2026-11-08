import Link from "next/link";

import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import type { Tables } from "@/types/database";

import { RequestStatusBadge } from "./request-status-badge";
import { SeverityBadge } from "./severity-badge";

type RequestCardProps = {
  request: Tables<"emergency_requests">;
};

export function RequestCard({ request }: RequestCardProps) {
  return (
    <Link
      href={`/victim/requests/${request.request_id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {formatDateTime(request.created_at)}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950 transition group-hover:text-rose-700">
            {request.emergency_type}
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={request.severity} />
          <RequestStatusBadge status={request.request_status} />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
        {request.description}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
        <div className="flex gap-1.5">
          <dt className="font-semibold text-slate-600">Location</dt>
          <dd className="max-w-72 truncate">{request.location}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold text-slate-600">Affected</dt>
          <dd>{formatAffectedPeople(request.affected_people)}</dd>
        </div>
      </dl>
    </Link>
  );
}
