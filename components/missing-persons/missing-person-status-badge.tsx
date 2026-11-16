import { MISSING_PERSON_STATUS_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const STATUS_CLASSES: Readonly<
  Record<AppEnums["missing_person_status"], string>
> = {
  missing: "border-amber-200 bg-amber-50 text-amber-800",
  found: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function MissingPersonStatusBadge({
  status,
}: {
  status: AppEnums["missing_person_status"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {MISSING_PERSON_STATUS_LABELS[status]}
    </span>
  );
}
