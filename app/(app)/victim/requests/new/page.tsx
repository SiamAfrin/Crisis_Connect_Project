import type { Metadata } from "next";
import Link from "next/link";

import { RequestForm } from "@/components/requests/request-form";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/victim/requests"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to requests
      </Link>

      <PageHeader
        title="Tell us what happened"
        description="Give responders the clearest picture you can. Your request is saved as pending until an administrator reviews it."
      />

      <section className="panel p-6 sm:p-8">
        <RequestForm />
      </section>
    </div>
  );
}
