import type { AppEnums, Tables } from "@/types/database";

export type VictimRequestAssignment = Pick<
  Tables<"emergency_assignments">,
  "request_id" | "assignment_status" | "assigned_at" | "accepted_at"
>;

export type VictimRequestStage =
  | "awaiting_review"
  | "not_approved"
  | "awaiting_responder"
  | "responder_assigned"
  | "responder_responding"
  | "mission_completed"
  | "response_closed"
  | "status_unavailable";

export type VictimRequestStatus = {
  stage: VictimRequestStage;
  label: string;
  summary: string;
  detail: string;
};

const AWAITING_REVIEW: VictimRequestStatus = {
  stage: "awaiting_review",
  label: "Awaiting review",
  summary: "An administrator is reviewing your request.",
  detail:
    "Your request is queued for administrator review. Responder assignment cannot begin until it is approved.",
};

const NOT_APPROVED: VictimRequestStatus = {
  stage: "not_approved",
  label: "Not approved",
  summary: "This request was not approved.",
  detail:
    "This request was not approved. Contact an administrator if you believe the decision should be reviewed.",
};

const AWAITING_RESPONDER: VictimRequestStatus = {
  stage: "awaiting_responder",
  label: "Awaiting responder",
  summary: "Approved. Waiting for an administrator to assign a responder.",
  detail:
    "An administrator approved this request. Verified responders can accept it, and an administrator will assign one responder to the response.",
};

const RESPONDER_ASSIGNED: VictimRequestStatus = {
  stage: "responder_assigned",
  label: "Responder assigned",
  summary: "A responder has been assigned and has not started the mission yet.",
  detail:
    "An administrator assigned a responder to your request. The responder has not started the mission yet.",
};

const RESPONDER_RESPONDING: VictimRequestStatus = {
  stage: "responder_responding",
  label: "Responder responding",
  summary: "The assigned responder accepted the mission and is responding.",
  detail:
    "The assigned responder accepted the mission and is responding to your request.",
};

const MISSION_COMPLETED: VictimRequestStatus = {
  stage: "mission_completed",
  label: "Mission completed",
  summary: "The assigned responder marked this mission completed.",
  detail:
    "The assigned responder marked this mission completed. If the situation is still urgent, submit a new request or contact emergency services.",
};

const RESPONSE_CLOSED: VictimRequestStatus = {
  stage: "response_closed",
  label: "Response closed",
  summary: "The assigned response is no longer active.",
  detail:
    "The assigned response is no longer active. Contact an administrator if you need help with this request.",
};

const STATUS_UNAVAILABLE: VictimRequestStatus = {
  stage: "status_unavailable",
  label: "Status unavailable",
  summary: "We could not load the latest response status.",
  detail:
    "We could not load the latest response status. Refresh the page to try again.",
};

/**
 * Combines the administrator review status with the assignment/mission status
 * into one victim-facing status. `undefined` means the assignment status could
 * not be loaded, which is different from `null` (no responder assigned yet).
 */
export function getVictimRequestStatus(
  requestStatus: AppEnums["request_status"],
  assignmentStatus: AppEnums["assignment_status"] | null | undefined,
): VictimRequestStatus {
  if (requestStatus === "pending") {
    return AWAITING_REVIEW;
  }

  if (requestStatus === "rejected") {
    return NOT_APPROVED;
  }

  if (assignmentStatus === undefined) {
    return STATUS_UNAVAILABLE;
  }

  if (assignmentStatus === null) {
    return AWAITING_RESPONDER;
  }

  switch (assignmentStatus) {
    case "pending":
      return RESPONDER_ASSIGNED;
    case "accepted":
      return RESPONDER_RESPONDING;
    case "completed":
      return MISSION_COMPLETED;
    case "declined":
    case "cancelled":
      return RESPONSE_CLOSED;
    default:
      return STATUS_UNAVAILABLE;
  }
}
