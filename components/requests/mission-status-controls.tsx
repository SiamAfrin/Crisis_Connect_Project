"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { CheckCircleIcon, CheckIcon } from "@/components/ui/icons";
import { initialActionState } from "@/lib/auth/action-state";
import { updateMissionStatusAction } from "@/lib/requests/actions";
import type { AppEnums } from "@/types/database";

type MissionStatusControlsProps = {
  assignmentId: string;
  status: AppEnums["assignment_status"];
};

/**
 * Status controls for the responder assigned to a mission. The database
 * function enforces the same transitions, so this component only chooses which
 * single next step to offer.
 */
export function MissionStatusControls({
  assignmentId,
  status,
}: MissionStatusControlsProps) {
  const [state, formAction, pending] = useActionState(
    updateMissionStatusAction,
    initialActionState,
  );

  if (status === "completed") {
    return (
      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
        <p className="text-sm font-semibold text-sky-900">Mission completed</p>
        <p className="mt-1 text-xs leading-5 text-sky-800">
          This mission is closed. Administrators can see the completed status.
        </p>
      </div>
    );
  }

  if (status === "declined" || status === "cancelled") {
    return (
      <p className="mt-4 rounded-lg border border-line bg-ink-50 px-4 py-3 text-sm text-ink-600">
        This assignment is closed and its status cannot be changed.
      </p>
    );
  }

  const nextStatus = status === "pending" ? "accepted" : "completed";
  const isCompletion = nextStatus === "completed";
  const idleLabel = isCompletion ? "Mark as completed" : "Accept mission";
  const pendingLabel = isCompletion ? "Completing..." : "Accepting...";

  return (
    <form
      action={formAction}
      className="mt-4 space-y-2 border-t border-line-soft pt-4"
    >
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="status" value={nextStatus} />

      <p className="text-xs font-medium text-ink-500">Mission status</p>

      <FormAlert state={state} />

      <button
        type="submit"
        disabled={pending}
        className={
          isCompletion
            ? "inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            : "inline-flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950 disabled:cursor-not-allowed disabled:bg-ink-400"
        }
      >
        {isCompletion ? (
          <CheckCircleIcon aria-hidden="true" className="size-4" />
        ) : (
          <CheckIcon aria-hidden="true" className="size-4" />
        )}
        {pending ? pendingLabel : idleLabel}
      </button>

      <p className="text-xs leading-5 text-ink-500">
        {isCompletion
          ? "Marking this mission completed closes it and updates the administrator view."
          : "Accept the mission to show administrators that you are responding."}
      </p>
    </form>
  );
}
