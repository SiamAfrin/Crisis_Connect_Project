"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { ArrowLeftIcon, CheckCircleIcon } from "@/components/ui/icons";
import { initialActionState } from "@/lib/auth/action-state";
import { updateMissingPersonStatusAction } from "@/lib/missing-persons/actions";
import type { AppEnums } from "@/types/database";

type MissingPersonStatusControlsProps = {
  reportId: string;
  status: AppEnums["missing_person_status"];
  canReopen: boolean;
};

/**
 * Status controls for a missing person report. The database function enforces
 * the same rules, so this component only offers the next allowed step.
 */
export function MissingPersonStatusControls({
  reportId,
  status,
  canReopen,
}: MissingPersonStatusControlsProps) {
  const [state, formAction, pending] = useActionState(
    updateMissingPersonStatusAction,
    initialActionState,
  );

  if (status === "found" && !canReopen) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">Person found</p>
        <p className="mt-1 text-xs leading-5 text-emerald-800">
          This report is closed. An administrator can reopen it if the person
          is missing again.
        </p>
      </div>
    );
  }

  const nextStatus = status === "missing" ? "found" : "missing";
  const isReopen = nextStatus === "missing";
  const idleLabel = isReopen ? "Reopen report" : "Mark as found";
  const pendingLabel = isReopen ? "Reopening..." : "Updating...";

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 border-t border-line-soft pt-4"
    >
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={nextStatus} />

      <p className="text-xs font-medium text-ink-500">Report status</p>

      <FormAlert state={state} />

      <button
        type="submit"
        disabled={pending}
        className={
          isReopen
            ? "inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:text-ink-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950 disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        }
      >
        {isReopen ? (
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
        ) : (
          <CheckCircleIcon aria-hidden="true" className="size-4" />
        )}
        {pending ? pendingLabel : idleLabel}
      </button>

      <p className="text-xs leading-5 text-ink-500">
        {isReopen
          ? "Reopening returns this report to the active missing list."
          : "Marking this report found closes it and records who resolved it."}
      </p>
    </form>
  );
}
