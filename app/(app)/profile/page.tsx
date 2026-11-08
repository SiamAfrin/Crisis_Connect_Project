import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireProfile } from "@/lib/auth/dal";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
  getRoleLabel,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Profile",
  description: "Update your Crisis Connect profile.",
};

// This page blocks on the signed-in session, so it cannot render an instant shell.
export const instant = false;

export default async function ProfilePage() {
  const { profile } = await requireProfile();
  const roleLabel = getRoleLabel(profile.role);
  const categoryLabel = getRescueCategoryLabel(
    profile.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    profile.defence_subcategory,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Profile
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Your account details
          </h1>
          <StatusBadge status={profile.account_status} />
        </div>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Update your full name, phone number, and address. Your email, role,
          and account status are read-only and cannot be changed from this
          form.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Editable information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These changes are validated on the server before they are saved.
          </p>

          <div className="mt-6">
            <ProfileForm
              key={profile.updated_at}
              initialFullName={profile.full_name}
              initialPhone={profile.phone}
              initialAddress={profile.address}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Read-only account fields
            </h2>

            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium text-slate-900">
                  {profile.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Role
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {roleLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Account status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={profile.account_status} />
                </dd>
              </div>
              {categoryLabel ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Rescue team category
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {categoryLabel}
                  </dd>
                </div>
              ) : null}
              {subcategoryLabel ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Defence subcategory
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {subcategoryLabel}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-900">
            Email, role, rescue category, and account status are immutable from
            the profile form. Direct updates to those columns are also blocked
            by database grants and Row Level Security.
          </p>
        </aside>
      </div>
    </div>
  );
}
