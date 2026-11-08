import type { Metadata } from "next";
import Link from "next/link";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { Notice } from "@/components/ui/form";
import {
  getEmergencyRequestCounts,
  getResponderCounts,
} from "@/lib/admin/data";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Administrator dashboard",
  description: "Your Crisis Connect administrator dashboard.",
};

// This page blocks on the administrator session, so it cannot render an instant shell.
export const instant = false;

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireActiveRole("administrator");

  const [responderResult, requestResult] = await Promise.all([
    getResponderCounts(supabase),
    getEmergencyRequestCounts(supabase),
  ]);

  const error = responderResult.error ?? requestResult.error;
  const counts = responderResult.counts;
  const requestCounts = requestResult.counts;

  const statCards = [
    {
      label: "Pending approval",
      value: counts.pending,
      className: "border-amber-200 bg-amber-50 text-amber-950",
    },
    {
      label: "Approved responders",
      value: counts.active,
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    {
      label: "Rejected registrations",
      value: counts.rejected,
      className: "border-rose-200 bg-rose-50 text-rose-950",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
              Administrator dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              Welcome, {profile.full_name}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-300">
              Your administrator account is active. Review volunteer and rescue
              team registrations and victim emergency requests here. Responder
              assignment is implemented in a later approved chunk.
            </p>
          </div>

          <Link
            href="/admin/responders"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
          >
            Review registrations
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <section
        aria-label="Responder summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        {statCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-2xl border p-5 shadow-sm ${card.className}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      {error ? (
        <Notice tone="warning">
          We could not load the responder summary right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              Chunk 3
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Responder approvals
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Volunteer and rescue team registrations start pending. Review each
              account&apos;s role, rescue team category, Defence subcategory, and
              contact details before approving or rejecting it.
            </p>
          </div>

          <Link
            href="/admin/responders"
            className="text-sm font-semibold text-rose-600 underline-offset-4 transition hover:text-rose-700 hover:underline"
          >
            Open approval queue →
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              Chunk 4
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Emergency request review
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review victim submissions and approve or reject them. Approved
              requests become available to active volunteers and rescue team
              members.
            </p>
          </div>

          <Link
            href="/admin/requests"
            className="text-sm font-semibold text-rose-600 underline-offset-4 transition hover:text-rose-700 hover:underline"
          >
            Open request queue →
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              Pending review
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {requestCounts.pending}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              Approved
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {requestCounts.approved}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              Rejected
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {requestCounts.rejected}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <PlaceholderCard
          title="Responder assignment (Chunk 5)"
          description="Assign approved responders to approved emergency requests."
        />
        <PlaceholderCard
          title="Response tracking (Chunk 6)"
          description="Follow assignment acceptance and completion in a later approved chunk."
        />
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-sky-950">
          Chunk 4 boundary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">
          This chunk adds administrator review of victim emergency requests.
          Responder assignment and acceptance, live response tracking, and final
          hardening remain in later approved chunks.
        </p>
      </section>
    </div>
  );
}
