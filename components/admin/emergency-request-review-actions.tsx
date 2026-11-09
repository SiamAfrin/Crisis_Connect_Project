"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import { reviewEmergencyRequestAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

type EmergencyRequestReviewActionsProps = {
  requestId: string;
  label: string;
};

export function EmergencyRequestReviewActions({
  requestId,
  label,
}: EmergencyRequestReviewActionsProps) {
  const [state, formAction, pending] = useActionState(
    reviewEmergencyRequestAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />

      <FormAlert state={state} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          aria-label={`Approve ${label}`}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          <CheckIcon aria-hidden="true" className="size-4" />
          {pending ? "Saving..." : "Approve request"}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          aria-label={`Reject ${label}`}
          onClick={(event) => {
            const confirmed = window.confirm(
              `Reject this ${label} request? Approved responders will not see it.`,
            );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-signal-200 bg-signal-50 px-4 py-2.5 text-sm font-semibold text-signal-700 transition hover:bg-signal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XIcon aria-hidden="true" className="size-4" />
          {pending ? "Saving..." : "Reject request"}
        </button>
      </div>

      <p className="text-xs leading-5 text-ink-500">
        Approving makes this request visible to approved responders. Rejecting
        keeps it out of the responder queue.
      </p>
    </form>
  );
}
