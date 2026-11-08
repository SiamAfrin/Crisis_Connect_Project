"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { initialActionState } from "@/lib/auth/action-state";
import { reviewResponderAction } from "@/lib/admin/actions";

type ResponderReviewActionsProps = {
  profileId: string;
  name: string;
};

export function ResponderReviewActions({
  profileId,
  name,
}: ResponderReviewActionsProps) {
  const [state, formAction, pending] = useActionState(
    reviewResponderAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="profileId" value={profileId} />

      <FormAlert state={state} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="active"
          disabled={pending}
          aria-label={`Approve ${name}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {pending ? "Saving..." : "Approve"}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          aria-label={`Reject ${name}`}
          onClick={(event) => {
            const confirmed = window.confirm(
              `Reject ${name}'s registration? They will not be able to access responder features.`,
            );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Reject"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Approving grants access to the responder dashboard. Rejecting keeps the
        account signed in but blocked.
      </p>
    </form>
  );
}
