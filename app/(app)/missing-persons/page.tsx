import type { Metadata } from "next";
import Link from "next/link";

import { MissingPersonCard } from "@/components/missing-persons/missing-person-card";
import {
  buttonPrimary,
  buttonSecondary,
  buttonSignal,
} from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Notice,
  inputClassName,
  selectClassName,
} from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireActiveAccount } from "@/lib/auth/dal";
import { listMissingPersons } from "@/lib/missing-persons/data";

export const metadata: Metadata = {
  title: "Missing persons",
  description: "Search missing person reports shared by the community.",
};

// This page blocks on the signed-in account, so it cannot render an instant
// static shell. Authorization is still enforced on the server.
export const instant = false;

type MissingPersonsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

type MissingPersonStatusFilter = "missing" | "found" | "all";

function firstValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function normalizeStatus(value: string): MissingPersonStatusFilter {
  return value === "found" || value === "all" ? value : "missing";
}

export default async function MissingPersonsPage({
  searchParams,
}: MissingPersonsPageProps) {
  const { supabase } = await requireActiveAccount();
  const params = await searchParams;
  const query = firstValue(params.q).slice(0, 100);
  const status = normalizeStatus(firstValue(params.status));

  const { reports, error } = await listMissingPersons(supabase, {
    query,
    status,
  });

  const hasFilters = query.trim().length > 0 || status !== "missing";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Missing persons"
        description="Search reports shared by the community. Reporter contact details are visible only to the reporter and administrators."
        actions={
          <Link href="/missing-persons/new" className={buttonSignal}>
            Report a missing person
          </Link>
        }
      />

      <form action="/missing-persons" method="get" className="panel p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
          <div className="space-y-1.5">
            <label
              htmlFor="missing-person-query"
              className="text-sm font-medium text-ink-800"
            >
              Search
            </label>
            <input
              id="missing-person-query"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={100}
              placeholder="Name or last seen location"
              className={inputClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="missing-person-status-filter"
              className="text-sm font-medium text-ink-800"
            >
              Status
            </label>
            <select
              id="missing-person-status-filter"
              name="status"
              defaultValue={status}
              className={selectClassName}
            >
              <option value="missing">Missing only</option>
              <option value="found">Found only</option>
              <option value="all">All reports</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" className={buttonPrimary}>
              Search
            </button>
            {hasFilters ? (
              <Link href="/missing-persons" className={buttonSecondary}>
                Clear
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      {error ? (
        <Notice tone="warning">
          We could not load missing person reports right now. Refresh the page
          to try again.
        </Notice>
      ) : null}

      {!error && reports.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "No matching reports"
              : "No missing person reports yet"
          }
          description={
            hasFilters
              ? "Try a different name, location, or status."
              : "When someone reports a missing person, the report will appear here."
          }
          action={
            !hasFilters ? (
              <Link href="/missing-persons/new" className={buttonSignal}>
                Report a missing person
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <MissingPersonCard
              key={report.report_id}
              report={report}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
