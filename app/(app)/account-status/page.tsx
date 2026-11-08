import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
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
      "You can use the features available to your role. Role-specific workflows are added in later approved chunks.",
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
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Account status
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            {copy.title}
          </h1>
          <StatusBadge status={profile.account_status} />
        </div>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          {copy.detail}
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Account details
        </h2>

        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Full name
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {profile.full_name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Email
            </dt>
            <dd className="mt-1 break-all text-sm font-medium text-slate-900">
              {profile.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Role
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {roleLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Account status
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {profile.account_status === "active"
                ? "Active"
                : profile.account_status === "pending"
                  ? "Pending administrator approval"
                  : "Rejected"}
            </dd>
          </div>
          {categoryLabel ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Rescue team category
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {categoryLabel}
              </dd>
            </div>
          ) : null}
          {subcategoryLabel ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Defence subcategory
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {subcategoryLabel}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          {profile.account_status === "active" ? (
            <Link
              href={getHomePathForProfile(profile)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go to dashboard
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Edit profile
          </Link>
        </div>
      </section>

      <p className="rounded-2xl border border-slate-200 bg-slate-100/70 px-5 py-4 text-sm leading-6 text-slate-600">
        Account status and role are controlled on the server. The profile form
        cannot change either value, and direct database writes are restricted by
        RLS and column-level grants.
      </p>
    </div>
  );
}
