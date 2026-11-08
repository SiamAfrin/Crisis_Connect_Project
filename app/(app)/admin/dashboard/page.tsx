import type { Metadata } from "next";

import { PlaceholderCard } from "@/components/dashboard/placeholder-card";
import { requireActiveRole } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Administrator dashboard",
  description: "Your Crisis Connect administrator dashboard.",
};

export default async function AdminDashboardPage() {
  const { profile } = await requireActiveRole("administrator");

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
          Administrator dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          Welcome, {profile.full_name}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-300">
          Your administrator account is active. Responder approval, emergency
          request review, and assignment tools are implemented in later approved
          chunks.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          title="Responder approvals"
          description="Review pending volunteer and rescue team accounts and activate or reject them."
        />
        <PlaceholderCard
          title="Emergency request review"
          description="Approve or reject victim requests and record the review decision."
        />
        <PlaceholderCard
          title="Responder assignment"
          description="Assign approved responders to approved emergency requests."
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-950">
          Administrator boundary
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Administrator accounts are privileged and cannot be created through
          public registration. This page is server-protected and requires an
          active <strong>administrator</strong> profile; role checks are
          repeated in every protected page and Server Action rather than relying
          on hidden navigation.
        </p>
      </section>
    </div>
  );
}
