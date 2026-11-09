import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Profile"
        description="Update your name, phone number, and address. Email, role, and account status are read-only."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="panel p-6 sm:p-8">
          <h2 className="text-base font-semibold text-ink-950">Your details</h2>

          <div className="mt-5">
            <ProfileForm
              key={profile.updated_at}
              initialFullName={profile.full_name}
              initialPhone={profile.phone}
              initialAddress={profile.address}
            />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-base font-semibold text-ink-950">
            Account information
          </h2>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="meta-label">Email</dt>
              <dd className="mt-1 break-all text-sm font-medium text-ink-900">
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Role</dt>
              <dd className="mt-1 text-sm font-medium text-ink-900">
                {roleLabel}
              </dd>
            </div>
            <div>
              <dt className="meta-label">Account status</dt>
              <dd className="mt-1">
                <StatusBadge status={profile.account_status} />
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
          </dl>
        </section>
      </div>
    </div>
  );
}
