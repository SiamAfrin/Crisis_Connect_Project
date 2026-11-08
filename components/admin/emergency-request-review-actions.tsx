"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
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
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Reject request"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Approving makes this request visible to approved responders. Rejecting
        keeps it out of the responder queue.
      </p>
    </form>
  );
}
