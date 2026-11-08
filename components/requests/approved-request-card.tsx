import { SeverityBadge } from "@/components/requests/severity-badge";
import {
  formatAffectedPeople,
  formatDateTime,
} from "@/lib/requests/format";
import type { Tables } from "@/types/database";

type ApprovedRequestCardProps = {
  request: Tables<"emergency_requests">;
};

/**
 * Read-only view of an approved request for active responders. Victim contact
 * details are intentionally omitted: responder profile access is limited by RLS
 * until assignment is introduced in Chunk 5.
 */
export function ApprovedRequestCard({ request }: ApprovedRequestCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {formatDateTime(request.created_at)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {request.emergency_type}
          </h3>
        </div>
        <SeverityBadge severity={request.severity} />
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
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
    </article>
  );
}
