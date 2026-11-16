import assert from "node:assert/strict";
import { test } from "node:test";

import {
  summarizeEmergencyRequests,
  summarizeRescueActivities,
} from "../lib/reports/summarize.ts";
import type { EmergencyRequestSummaryInput } from "../lib/reports/types.ts";

test("an empty emergency report has zero totals", () => {
  assert.deepEqual(summarizeEmergencyRequests([]), {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    byType: [],
  });
});

test("emergency counts match the report rows", () => {
  const rows: EmergencyRequestSummaryInput[] = [
    { emergency_type: "Flood", severity: "high", request_status: "pending" },
    { emergency_type: "Flood", severity: "critical", request_status: "approved" },
    { emergency_type: "Fire", severity: "high", request_status: "approved" },
    { emergency_type: "Medical", severity: "high", request_status: "rejected" },
  ];

  const summary = summarizeEmergencyRequests(rows);

  assert.equal(summary.total, 4);
  assert.equal(summary.pending, 1);
  assert.equal(summary.approved, 2);
  assert.equal(summary.rejected, 1);
  assert.equal(summary.low, 0);
  assert.equal(summary.medium, 0);
  assert.equal(summary.high, 3);
  assert.equal(summary.critical, 1);
});

test("emergency types are grouped and sorted by count then name", () => {
  const rows: EmergencyRequestSummaryInput[] = [
    { emergency_type: "Flood", severity: "low", request_status: "pending" },
    { emergency_type: "Medical", severity: "low", request_status: "pending" },
    { emergency_type: "Flood", severity: "low", request_status: "pending" },
    { emergency_type: "Fire", severity: "low", request_status: "pending" },
  ];

  assert.deepEqual(summarizeEmergencyRequests(rows).byType, [
    { type: "Flood", count: 2 },
    { type: "Fire", count: 1 },
    { type: "Medical", count: 1 },
  ]);
});

test("an empty rescue report has zero totals", () => {
  assert.deepEqual(summarizeRescueActivities([]), {
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    cancelled: 0,
    completed: 0,
    uniqueResponders: 0,
    uniqueVictims: 0,
  });
});

test("rescue counts and unique people match the report rows", () => {
  const rows = [
    { assignment_status: "completed" as const, responder_id: "r1", victim_id: "v1" },
    { assignment_status: "completed" as const, responder_id: "r1", victim_id: "v2" },
    { assignment_status: "accepted" as const, responder_id: "r2", victim_id: "v1" },
    { assignment_status: "pending" as const, responder_id: "r2", victim_id: null },
    { assignment_status: "cancelled" as const, responder_id: "r3", victim_id: "v3" },
    { assignment_status: "declined" as const, responder_id: "r3", victim_id: "v3" },
  ];

  const summary = summarizeRescueActivities(rows);

  assert.equal(summary.total, 6);
  assert.equal(summary.pending, 1);
  assert.equal(summary.accepted, 1);
  assert.equal(summary.declined, 1);
  assert.equal(summary.cancelled, 1);
  assert.equal(summary.completed, 2);
  assert.equal(summary.uniqueResponders, 3);
  assert.equal(summary.uniqueVictims, 3);
});
