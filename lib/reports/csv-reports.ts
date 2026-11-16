import {
  ASSIGNMENT_STATUS_LABELS,
  EMERGENCY_SEVERITY_LABELS,
  REQUEST_STATUS_LABELS,
  getRoleLabel,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/requests/format";

import { buildCsv } from "./csv";
import type {
  EmergencyRequestReportRow,
  RescueActivityReportRow,
} from "./types";

const EMERGENCY_REQUEST_HEADERS = [
  "Reference",
  "Submitted",
  "Emergency type",
  "Severity",
  "Status",
  "Location",
  "Affected people",
  "Victim",
] as const;

const RESCUE_ACTIVITY_HEADERS = [
  "Reference",
  "Assigned",
  "Accepted",
  "Mission status",
  "Emergency type",
  "Severity",
  "Location",
  "Responder",
  "Responder role",
  "Victim",
] as const;

export function buildEmergencyRequestCsv(
  rows: ReadonlyArray<EmergencyRequestReportRow>,
): string {
  return buildCsv(
    EMERGENCY_REQUEST_HEADERS,
    rows.map((row) => [
      row.request_id,
      formatDateTime(row.created_at),
      row.emergency_type,
      EMERGENCY_SEVERITY_LABELS[row.severity],
      REQUEST_STATUS_LABELS[row.request_status],
      row.location,
      row.affected_people,
      row.victim_name ?? "Unavailable",
    ]),
  );
}

export function buildRescueActivityCsv(
  rows: ReadonlyArray<RescueActivityReportRow>,
): string {
  return buildCsv(
    RESCUE_ACTIVITY_HEADERS,
    rows.map((row) => [
      row.assignment_id,
      formatDateTime(row.assigned_at),
      row.accepted_at ? formatDateTime(row.accepted_at) : "Not accepted",
      ASSIGNMENT_STATUS_LABELS[row.assignment_status],
      row.emergency_type ?? "Unavailable",
      row.severity ? EMERGENCY_SEVERITY_LABELS[row.severity] : "Unavailable",
      row.location ?? "Unavailable",
      row.responder_name ?? "Unavailable",
      row.responder_role ? getRoleLabel(row.responder_role) : "Unavailable",
      row.victim_name ?? "Unavailable",
    ]),
  );
}
