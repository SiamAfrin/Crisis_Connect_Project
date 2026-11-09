import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const STATUS_CLASSES: Readonly<
  Record<AppEnums["request_status"], string>
> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-signal-200 bg-signal-50 text-signal-700",
};

export function RequestStatusBadge({
  status,
}: {
  status: AppEnums["request_status"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
