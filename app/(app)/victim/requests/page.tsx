import type { Metadata } from "next";
import Link from "next/link";

import { RequestCard } from "@/components/requests/request-card";
import { Notice } from "@/components/ui/form";
import { requireActiveRole } from "@/lib/auth/dal";
import { listVictimRequests } from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "My emergency requests",
  description: "Track the emergency requests you have submitted.",
};

// This page blocks on the victim session, so it cannot render an instant shell.
export const instant = false;

export default async function VictimRequestsPage() {
  const { supabase, profile } = await requireActiveRole("victim");
  const { requests, error } = await listVictimRequests(
    supabase,
    profile.id,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
            Emergency requests
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Your requests
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
            Every request you submit is reviewed by an administrator. Open a
            request to see its review status and details.
          </p>
        </div>

        <Link
          href="/victim/requests/new"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          New request
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      {error ? (
        <Notice tone="warning">
          We could not load your requests right now. Refresh the page to try
          again.
        </Notice>
      ) : null}

      {!error && requests.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            No requests yet
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Submit your first emergency request
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-6 text-slate-600">
            Include the emergency type, location, severity, number of affected
            people, and a clear description so an administrator can review it
            quickly.
          </p>
          <Link
            href="/victim/requests/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create a request
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : null}

      {requests.length > 0 ? (
        <section className="space-y-4" aria-label="Your emergency requests">
          {requests.map((request) => (
            <RequestCard key={request.request_id} request={request} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
