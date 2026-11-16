import type { AppEnums } from "@/types/database";

export type EmergencyRequestReportRow = {
  request_id: string;
  created_at: string;
  emergency_type: string;
  severity: AppEnums["emergency_severity"];
  request_status: AppEnums["request_status"];
  location: string;
  affected_people: number;
  victim_name: string | null;
};

export type RescueActivityReportRow = {
  assignment_id: string;
  assigned_at: string;
  accepted_at: string | null;
  assignment_status: AppEnums["assignment_status"];
  emergency_type: string | null;
  severity: AppEnums["emergency_severity"] | null;
  location: string | null;
  responder_id: string;
  responder_name: string | null;
  responder_role: AppEnums["user_role"] | null;
  victim_id: string | null;
  victim_name: string | null;
};

export type EmergencyTypeCount = {
  type: string;
  count: number;
};

export type EmergencyRequestSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
  byType: EmergencyTypeCount[];
};

export type RescueActivitySummary = {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  cancelled: number;
  completed: number;
  uniqueResponders: number;
  uniqueVictims: number;
};

export type EmergencyRequestReport = {
  rows: EmergencyRequestReportRow[];
  summary: EmergencyRequestSummary;
  truncated: boolean;
};

export type RescueActivityReport = {
  rows: RescueActivityReportRow[];
  summary: RescueActivitySummary;
  truncated: boolean;
};

export type EmergencyRequestSummaryInput = Pick<
  EmergencyRequestReportRow,
  "emergency_type" | "severity" | "request_status"
>;

export type RescueActivitySummaryInput = Pick<
  RescueActivityReportRow,
  "assignment_status" | "responder_id" | "victim_id"
>;
