import { StatusBadge } from "@/components/ui/status-badge";
import { formatRegistrationDate } from "@/lib/admin/format";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
  getRoleLabel,
} from "@/lib/constants";
import type { Tables } from "@/types/database";

type ResponderSummaryCardProps = {
  responder: Tables<"profiles">;
};

export function ResponderSummaryCard({
  responder,
}: ResponderSummaryCardProps) {
  const categoryLabel = getRescueCategoryLabel(
    responder.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    responder.defence_subcategory,
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {responder.full_name}
          </h3>
          <p className="mt-1 break-all text-xs text-slate-500">
            {responder.email}
          </p>
        </div>
        <StatusBadge status={responder.account_status} />
      </div>

      <dl className="mt-4 space-y-2 text-xs text-slate-600">
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-slate-500">Role</dt>
          <dd className="text-right">{getRoleLabel(responder.role)}</dd>
        </div>
        {categoryLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">
              Rescue team category
            </dt>
            <dd className="text-right">{categoryLabel}</dd>
          </div>
        ) : null}
        {subcategoryLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">
              Defence subcategory
            </dt>
            <dd className="text-right">{subcategoryLabel}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="font-semibold text-slate-500">Last updated</dt>
          <dd className="text-right">
            {formatRegistrationDate(responder.updated_at)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
