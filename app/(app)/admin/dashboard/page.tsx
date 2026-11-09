import type { Metadata } from "next";
import Link from "next/link";

import { Notice } from "@/components/ui/form";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import {
  getEmergencyRequestCounts,
  getResponderCounts,
  getResponderWorkflowCounts,
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

  const [responderResult, requestResult, workflowResult] = await Promise.all([
    getResponderCounts(supabase),
    getEmergencyRequestCounts(supabase),
    getResponderWorkflowCounts(supabase),
  ]);

  const error =
    responderResult.error ?? requestResult.error ?? workflowResult.error;
  const counts = responderResult.counts;
  const requestCounts = requestResult.counts;
  const workflowCounts = workflowResult.counts;

  const queues = [
    {
      href: "/admin/responders",
      label: "Responder registrations",
      detail: `${counts.pending} awaiting review`,
    },
    {
      href: "/admin/requests",
      label: "Emergency requests",
      detail: `${requestCounts.pending} awaiting review`,
    },
    {
      href: "/admin/assignments",
      label: "Responder assignments",
      detail: `${workflowCounts.accepted} accepted · ${workflowCounts.assigned} assigned`,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${profile.full_name}. Review registrations and requests, then assign responders.`}
      />

      {error ? (
        <Notice tone="warning">
          We could not load the queue summary right now. Refresh the page to try
          again.
        </Notice>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-950">Queues</h2>

        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {queues.map((queue) => (
            <li key={queue.href}>
              <Link
                href={queue.href}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink-950"
              >
                <span>
                  <span className="block text-sm font-medium text-ink-950">
                    {queue.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {queue.detail}
                  </span>
                </span>
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
