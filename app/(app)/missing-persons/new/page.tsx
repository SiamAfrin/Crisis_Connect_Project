import type { Metadata } from "next";
import Link from "next/link";

import { MissingPersonForm } from "@/components/missing-persons/missing-person-form";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { requireActiveAccount } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Report a missing person",
  description: "Submit a missing person report for community search and administrator follow-up.",
};

// This page blocks on the signed-in account, so it cannot render an instant shell.
export const instant = false;

export default async function NewMissingPersonPage() {
  await requireActiveAccount();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/missing-persons"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 underline-offset-4 transition hover:text-ink-950 hover:underline"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Back to missing persons
      </Link>

      <PageHeader
        title="Report a missing person"
        description="Share the details that will help responders and administrators identify the person. Reports are visible to active signed-in users."
      />

      <section className="panel p-6 sm:p-8">
        <MissingPersonForm />
      </section>
    </div>
  );
}
