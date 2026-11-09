import type { Metadata } from "next";
import Link from "next/link";

import { buttonPrimary, buttonSecondary } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { requireProfile } from "@/lib/auth/dal";
import { getHomePathForProfile } from "@/lib/auth/routes";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
  getRoleLabel,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Account status",
  description: "Review your Crisis Connect account status.",
};

// This page blocks on the signed-in session, so it cannot render an instant shell.
export const instant = false;

const statusCopy = {
  active: {
    title: "Your account is active.",
    detail:
      "You can use the features available to your role. Use the navigation to reach your dashboard, requests, or assignments.",
  },
  pending: {
    title: "Your account is awaiting approval.",
    detail:
      "An administrator must approve your responder account before you can access responder features. You can still sign in, review your status, and update your profile.",
  },
  rejected: {
    title: "Your account was not approved.",
    detail:
      "This account cannot access responder features. Contact an administrator if you believe this decision should be reviewed.",
  },
} as const;

export default async function AccountStatusPage() {
  const { profile } = await requireProfile();
  const copy = statusCopy[profile.account_status];
  const roleLabel = getRoleLabel(profile.role);
  const categoryLabel = getRescueCategoryLabel(
    profile.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    profile.defence_subcategory,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={copy.title} description={copy.detail} />

      <section className="panel p-6 sm:p-8">
        <h2 className="text-base font-semibold text-ink-950">
          Account details
        </h2>

        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <dt className="meta-label">Full name</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {profile.full_name}
            </dd>
          </div>
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
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {profile.account_status === "active"
                ? "Active"
                : profile.account_status === "pending"
                  ? "Pending administrator approval"
                  : "Rejected"}
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

        <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-5">
          {profile.account_status === "active" ? (
            <Link href={getHomePathForProfile(profile)} className={buttonPrimary}>
              Go to dashboard
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          <Link href="/profile" className={buttonSecondary}>
            Edit profile
          </Link>
        </div>
      </section>
    </div>
  );
}
