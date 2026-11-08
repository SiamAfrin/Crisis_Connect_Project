import type { Metadata } from "next";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { requireActiveResponder } from "@/lib/auth/dal";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Rescue team dashboard",
  description: "Your Crisis Connect rescue team dashboard.",
};

export default async function RescueDashboardPage() {
  const { profile } = await requireActiveResponder(
    "rescue_team_member",
  );
  const categoryLabel = getRescueCategoryLabel(
    profile.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    profile.defence_subcategory,
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Rescue team dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Welcome, {profile.full_name}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Your rescue team account is approved and active. Assignment and
          response workflows arrive in a later approved chunk.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {categoryLabel ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              Category: {categoryLabel}
            </span>
          ) : null}
          {subcategoryLabel ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              Subcategory: {subcategoryLabel}
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="Assigned emergencies"
          description="View approved emergency requests assigned to your rescue team."
        />
        <PlaceholderCard
          title="Team response status"
          description="Accept, decline, and complete assignments when the responder workflow is implemented."
        />
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-emerald-950">
          Access confirmed
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">
          This page is server-protected. It checks your session, your{" "}
          <strong>rescue team member</strong> role, and your{" "}
          <strong>active</strong> account status before rendering. Depending on
          your category, the database also enforces the required Defence
          subcategory.
        </p>
      </section>
    </div>
  );
}
