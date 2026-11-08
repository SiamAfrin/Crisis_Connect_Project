import type { Database } from "@/types/database";

type AppEnums = Database["public"]["Enums"];

type Option<TValue extends string> = {
  value: TValue;
  label: string;
  description: string;
};

export const USER_ROLE_OPTIONS: ReadonlyArray<
  Option<AppEnums["user_role"]>
> = [
  {
    value: "victim",
    label: "Victim",
    description: "Request emergency assistance and track a request.",
  },
  {
    value: "volunteer",
    label: "Volunteer",
    description: "Offer support after administrator approval.",
  },
  {
    value: "rescue_team_member",
    label: "Rescue Team Member",
    description: "Respond through a government, hospital, defence, or NGO team.",
  },
  {
    value: "administrator",
    label: "Administrator",
    description: "Review responders, requests, and assignments.",
  },
];

export const RESCUE_TEAM_CATEGORY_OPTIONS: ReadonlyArray<
  Option<AppEnums["rescue_team_category"]>
> = [
  {
    value: "government",
    label: "Government",
    description: "Government emergency and public service teams.",
  },
  {
    value: "hospital",
    label: "Hospital",
    description: "Hospitals and medical response teams.",
  },
  {
    value: "defence",
    label: "Defence",
    description: "Police or Fire Service response teams.",
  },
  {
    value: "ngo",
    label: "NGO",
    description: "Non-governmental humanitarian organisations.",
  },
];

export const DEFENCE_SUBCATEGORY_OPTIONS: ReadonlyArray<
  Option<AppEnums["defence_subcategory"]>
> = [
  {
    value: "police",
    label: "Police",
    description: "Police response personnel.",
  },
  {
    value: "fire_service",
    label: "Fire Service",
    description: "Fire and rescue personnel.",
  },
];

export const ACCOUNT_STATUS_LABELS: Readonly<
  Record<AppEnums["account_status"], string>
> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
};

export function getRoleLabel(role: AppEnums["user_role"]): string {
  return (
    USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
  );
}

export function getRescueCategoryLabel(
  category: AppEnums["rescue_team_category"] | null,
): string | null {
  if (!category) {
    return null;
  }

  return (
    RESCUE_TEAM_CATEGORY_OPTIONS.find(
      (option) => option.value === category,
    )?.label ?? category
  );
}

export function getDefenceSubcategoryLabel(
  subcategory: AppEnums["defence_subcategory"] | null,
): string | null {
  if (!subcategory) {
    return null;
  }

  return (
    DEFENCE_SUBCATEGORY_OPTIONS.find(
      (option) => option.value === subcategory,
    )?.label ?? subcategory
  );
}

export const REQUEST_STATUS_LABELS: Readonly<
  Record<AppEnums["request_status"], string>
> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const ASSIGNMENT_STATUS_LABELS: Readonly<
  Record<AppEnums["assignment_status"], string>
> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const EMERGENCY_SEVERITY_LABELS: Readonly<
  Record<AppEnums["emergency_severity"], string>
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
