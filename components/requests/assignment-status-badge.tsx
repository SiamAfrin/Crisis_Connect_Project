import { ASSIGNMENT_STATUS_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const STATUS_CLASSES: Readonly<
  Record<AppEnums["assignment_status"], string>
> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border-signal-200 bg-signal-50 text-signal-700",
  cancelled: "border-line bg-ink-50 text-ink-600",
  completed: "border-sky-200 bg-sky-50 text-sky-700",
};

export function AssignmentStatusBadge({
  status,
}: {
  status: AppEnums["assignment_status"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}
