import type {
  EmergencyRequestSummary,
  EmergencyRequestSummaryInput,
  RescueActivitySummary,
  RescueActivitySummaryInput,
} from "./types";

/**
 * Builds the emergency request report summary from the report rows. Both the
 * page and the CSV export use this function, so the displayed counts always
 * match the exported records.
 */
export function summarizeEmergencyRequests(
  items: ReadonlyArray<EmergencyRequestSummaryInput>,
): EmergencyRequestSummary {
  const summary: EmergencyRequestSummary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    byType: [],
  };

  const typeCounts = new Map<string, number>();

  for (const item of items) {
    summary.total += 1;
    summary[item.request_status] += 1;
    summary[item.severity] += 1;
    typeCounts.set(
      item.emergency_type,
      (typeCounts.get(item.emergency_type) ?? 0) + 1,
    );
  }

  summary.byType = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.type.localeCompare(right.type),
    );

  return summary;
}

/**
 * Builds the rescue activity summary. A responder and a victim are counted once
 * each even when they appear on several missions in the selected period.
 */
export function summarizeRescueActivities(
  items: ReadonlyArray<RescueActivitySummaryInput>,
): RescueActivitySummary {
  const summary: RescueActivitySummary = {
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    cancelled: 0,
    completed: 0,
    uniqueResponders: 0,
    uniqueVictims: 0,
  };

  const responders = new Set<string>();
  const victims = new Set<string>();

  for (const item of items) {
    summary.total += 1;
    summary[item.assignment_status] += 1;
    responders.add(item.responder_id);

    if (item.victim_id) {
      victims.add(item.victim_id);
    }
  }

  summary.uniqueResponders = responders.size;
  summary.uniqueVictims = victims.size;

  return summary;
}
