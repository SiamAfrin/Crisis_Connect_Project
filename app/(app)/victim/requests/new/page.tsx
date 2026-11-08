import type { Metadata } from "next";
import Link from "next/link";

import { RequestForm } from "@/components/requests/request-form";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "New emergency request",
  description: "Submit a new emergency request for administrator review.",
};

// This page blocks on the victim session, so it cannot render an instant shell.
export const instant = false;

export default async function NewRequestPage() {
  await requireActiveRole("victim");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/victim/requests"
          className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          ← Back to requests
        </Link>
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          New request
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Tell us what happened
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600">
          Give responders the clearest picture you can. Your request is saved as
          pending until an administrator reviews it.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <RequestForm />
      </section>

      <p className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-6 text-sky-900">
        Only active victim accounts can submit requests. The server records your
        account as the owner and always starts the request in the pending state.
      </p>
    </div>
  );
}
