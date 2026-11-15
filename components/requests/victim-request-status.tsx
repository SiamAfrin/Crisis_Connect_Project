import { AssignmentStatusBadge } from "@/components/requests/assignment-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { formatDateTime } from "@/lib/requests/format";
import {
  getVictimRequestStatus,
  type VictimRequestAssignment,
  type VictimRequestStage,
} from "@/lib/requests/status";
import type { AppEnums } from "@/types/database";

const BADGE_CLASSES: Readonly<Record<VictimRequestStage, string>> = {
  awaiting_review: "border-amber-200 bg-amber-50 text-amber-800",
  not_approved: "border-signal-200 bg-signal-50 text-signal-700",
  awaiting_responder: "border-sky-200 bg-sky-50 text-sky-700",
  responder_assigned: "border-amber-200 bg-amber-50 text-amber-800",
  responder_responding: "border-emerald-200 bg-emerald-50 text-emerald-700",
  mission_completed: "border-sky-200 bg-sky-50 text-sky-700",
  response_closed: "border-line bg-ink-50 text-ink-600",
  status_unavailable: "border-line bg-ink-50 text-ink-600",
};

const PANEL_CLASSES: Readonly<Record<VictimRequestStage, string>> = {
  awaiting_review: "border-amber-200 bg-amber-50 text-amber-950",
  not_approved: "border-signal-200 bg-signal-50 text-signal-950",
  awaiting_responder: "border-sky-200 bg-sky-50 text-sky-950",
  responder_assigned: "border-amber-200 bg-amber-50 text-amber-950",
  responder_responding: "border-emerald-200 bg-emerald-50 text-emerald-950",
  mission_completed: "border-sky-200 bg-sky-50 text-sky-950",
  response_closed: "border-line bg-ink-50 text-ink-700",
  status_unavailable: "border-line bg-ink-50 text-ink-700",
};

type VictimRequestStatusBadgeProps = {
  requestStatus: AppEnums["request_status"];
  assignmentStatus: AppEnums["assignment_status"] | null | undefined;
};

export function VictimRequestStatusBadge({
  requestStatus,
  assignmentStatus,
}: VictimRequestStatusBadgeProps) {
  const status = getVictimRequestStatus(requestStatus, assignmentStatus);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[status.stage]}`}
    >
      {status.label}
    </span>
  );
}

type VictimRequestStatusPanelProps = {
  requestStatus: AppEnums["request_status"];
  assignmentStatus: AppEnums["assignment_status"] | null | undefined;
  assignment: VictimRequestAssignment | null;
};

export function VictimRequestStatusPanel({
  requestStatus,
  assignmentStatus,
  assignment,
}: VictimRequestStatusPanelProps) {
  const status = getVictimRequestStatus(requestStatus, assignmentStatus);

  return (
    <section className={`rounded-lg border p-6 ${PANEL_CLASSES[status.stage]}`}>
      <h2 className="text-sm font-semibold">Request status</h2>
      <p className="mt-2 text-base font-semibold">{status.label}</p>
      <p className="mt-2 text-sm leading-6">{status.detail}</p>

      <dl className="mt-5 space-y-2 border-t border-black/10 pt-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt>Review</dt>
          <dd>
            <RequestStatusBadge status={requestStatus} />
          </dd>
        </div>

        {assignment ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt>Mission</dt>
              <dd>
                <AssignmentStatusBadge status={assignment.assignment_status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Assigned</dt>
              <dd className="text-right">
                {formatDateTime(assignment.assigned_at)}
              </dd>
            </div>
            {assignment.accepted_at ? (
              <div className="flex items-center justify-between gap-3">
                <dt>Accepted</dt>
                <dd className="text-right">
                  {formatDateTime(assignment.accepted_at)}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
    </section>
  );
}
