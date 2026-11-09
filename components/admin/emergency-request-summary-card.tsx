import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import type { AdminEmergencyRequest } from "@/lib/admin/data";
import { EMERGENCY_SEVERITY_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/requests/format";

type EmergencyRequestSummaryCardProps = {
  item: AdminEmergencyRequest;
};

export function EmergencyRequestSummaryCard({
  item,
}: EmergencyRequestSummaryCardProps) {
  const { request, victim } = item;

  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-950">
            {request.emergency_type}
          </h3>
          <p className="mt-1 break-all text-xs text-ink-500">
            {victim ? victim.full_name : "Victim profile unavailable"}
          </p>
        </div>
        <RequestStatusBadge status={request.request_status} />
      </div>

      <dl className="mt-4 space-y-2 border-t border-line-soft pt-3 text-xs text-ink-600">
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-ink-500">Severity</dt>
          <dd className="text-right">
            {EMERGENCY_SEVERITY_LABELS[request.severity]}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-ink-500">Location</dt>
          <dd className="max-w-56 truncate text-right">{request.location}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-ink-500">Reviewed</dt>
          <dd className="text-right">
            {request.reviewed_at
              ? formatDateTime(request.reviewed_at)
              : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
