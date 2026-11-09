import { ACCOUNT_STATUS_LABELS } from "@/lib/constants";
import type { AppEnums } from "@/types/database";

const LIGHT_CLASSES: Readonly<Record<AppEnums["account_status"], string>> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-signal-200 bg-signal-50 text-signal-700",
};

const DARK_CLASSES: Readonly<Record<AppEnums["account_status"], string>> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  rejected: "border-signal-300/30 bg-signal-300/10 text-signal-200",
};

export function StatusBadge({
  status,
  tone = "light",
}: {
  status: AppEnums["account_status"];
  tone?: "light" | "dark";
}) {
  const classes = tone === "dark" ? DARK_CLASSES[status] : LIGHT_CLASSES[status];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {ACCOUNT_STATUS_LABELS[status]}
    </span>
  );
}
