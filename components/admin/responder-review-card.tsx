import { StatusBadge } from "@/components/ui/status-badge";
import { formatRegistrationDate } from "@/lib/admin/format";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
  getRoleLabel,
} from "@/lib/constants";
import type { Tables } from "@/types/database";

import { ResponderReviewActions } from "./responder-review-actions";

type ResponderReviewCardProps = {
  responder: Tables<"profiles">;
};

export function ResponderReviewCard({
  responder,
}: ResponderReviewCardProps) {
  const categoryLabel = getRescueCategoryLabel(
    responder.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    responder.defence_subcategory,
  );

  return (
    <article className="panel p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink-950">
            {responder.full_name}
          </h2>
          <p className="mt-1 break-all text-sm text-ink-500">
            {responder.email}
          </p>
        </div>
        <StatusBadge status={responder.account_status} />
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <dt className="meta-label">Role</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {getRoleLabel(responder.role)}
          </dd>
        </div>
        <div>
          <dt className="meta-label">Phone</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {responder.phone}
          </dd>
        </div>
        {categoryLabel ? (
          <div>
            <dt className="meta-label">Rescue team category</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {categoryLabel}
            </dd>
          </div>
        ) : null}
        {subcategoryLabel ? (
          <div>
            <dt className="meta-label">Defence subcategory</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {subcategoryLabel}
            </dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="meta-label">Address</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {responder.address}
          </dd>
        </div>
        <div>
          <dt className="meta-label">Registered</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {formatRegistrationDate(responder.created_at)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-line pt-5">
        <ResponderReviewActions
          profileId={responder.id}
          name={responder.full_name}
        />
      </div>
    </article>
  );
}
