import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const STATUS_CLASSES: Readonly<
  Record<AppEnums["request_status"], string>
> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_DOTS: Readonly<Record<AppEnums["request_status"], string>> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
};

export function RequestStatusBadge({
  status,
}: {
  status: AppEnums["request_status"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${STATUS_CLASSES[status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${STATUS_DOTS[status]}`}
      />
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
