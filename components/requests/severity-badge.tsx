import { EMERGENCY_SEVERITY_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const SEVERITY_CLASSES: Readonly<
  Record<AppEnums["emergency_severity"], string>
> = {
  low: "border-sky-200 bg-sky-50 text-sky-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

export function SeverityBadge({
  severity,
}: {
  severity: AppEnums["emergency_severity"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${SEVERITY_CLASSES[severity]}`}
    >
      {EMERGENCY_SEVERITY_LABELS[severity]} severity
    </span>
  );
}
