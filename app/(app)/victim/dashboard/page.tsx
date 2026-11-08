import type { Metadata } from "next";
import Link from "next/link";

import { RequestCard } from "@/components/requests/request-card";
import { Notice } from "@/components/ui/form";
import { requireActiveRole } from "@/lib/auth/dal";
import {
  getVictimRequestStats,
  listVictimRequests,
} from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "Victim dashboard",
  description: "Your Crisis Connect victim dashboard.",
};

// This page blocks on the victim session, so it cannot render an instant shell.
export const instant = false;

export default async function VictimDashboardPage() {
  const { supabase, profile } = await requireActiveRole("victim");

  const [{ requests: recent, error: listError }, { stats, error: statsError }] =
    await Promise.all([
      listVictimRequests(supabase, profile.id, 5),
      getVictimRequestStats(supabase, profile.id),
    ]);

  const error = listError ?? statsError;

  const statCards = [
    {
      label: "Total requests",
      value: stats.total,
      className: "border-slate-200 bg-white text-slate-950",
    },
    {
      label: "Pending review",
      value: stats.pending,
      className: "border-amber-200 bg-amber-50 text-amber-950",
    },
    {
      label: "Approved",
      value: stats.approved,
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      className: "border-rose-200 bg-rose-50 text-rose-950",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              Victim dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Welcome, {profile.full_name}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
              Your victim account is active. Submit emergency requests and
              follow each administrator review decision here.
            </p>
          </div>

          <Link
            href="/victim/requests/new"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            New emergency request
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <section
        aria-label="Request summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
          We could not load your request summary right now. Refresh the page to
          try again.
        </Notice>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Recent requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your five most recent submissions.
            </p>
          </div>
          <Link
            href="/victim/requests"
            className="text-sm font-semibold text-rose-600 underline-offset-4 transition hover:text-rose-700 hover:underline"
          >
            View all requests →
          </Link>
        </div>

        {!error && recent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <p className="text-sm leading-6 text-slate-600">
              You have not submitted an emergency request yet.
            </p>
            <Link
              href="/victim/requests/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create your first request
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}

        {recent.length > 0 ? (
          <div className="space-y-4">
            {recent.map((request) => (
              <RequestCard key={request.request_id} request={request} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-sky-950">
          Chunk 4 boundary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">
          This chunk adds emergency request submission, victim-side review
          tracking, and administrator review. Approved requests become visible
          to active responders; assignment, acceptance, and live response
          tracking remain in later approved chunks.
        </p>
      </section>
    </div>
  );
}
