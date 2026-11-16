import type { AppEnums } from "@/types/database";

export type MissionStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "completed"
  | "closed";

export const MISSION_STATUS_FILTERS: ReadonlyArray<{
  value: MissionStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All missions" },
  { value: "pending", label: "Awaiting start" },
  { value: "accepted", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

/**
 * Accepts only the mission monitor's supported status filters. Any other query
 * value falls back to the all-missions view.
 */
export function normalizeMissionStatusFilter(
  value: string,
): MissionStatusFilter {
  return MISSION_STATUS_FILTERS.some((filter) => filter.value === value)
    ? (value as MissionStatusFilter)
    : "all";
}

/**
 * Maps one monitor filter to the assignment statuses it includes. The legacy
 * `declined` and `cancelled` statuses are grouped as closed records.
 */
export function getMissionStatusesForFilter(
  filter: MissionStatusFilter,
): AppEnums["assignment_status"][] | undefined {
  switch (filter) {
    case "pending":
      return ["pending"];
    case "accepted":
      return ["accepted"];
    case "completed":
      return ["completed"];
    case "closed":
      return ["declined", "cancelled"];
    case "all":
      return undefined;
  }
}
