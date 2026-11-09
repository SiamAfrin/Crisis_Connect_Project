"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { CheckIcon } from "@/components/ui/icons";
import { initialActionState } from "@/lib/auth/action-state";
import { acceptEmergencyRequestAction } from "@/lib/requests/actions";

type AcceptRequestButtonProps = {
  requestId: string;
  label: string;
};

export function AcceptRequestButton({
  requestId,
  label,
}: AcceptRequestButtonProps) {
  const [state, formAction, pending] = useActionState(
    acceptEmergencyRequestAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="requestId" value={requestId} />

      <FormAlert state={state} />

      <button
        type="submit"
        disabled={pending}
        aria-label={`Accept ${label}`}
        className="inline-flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950 disabled:cursor-not-allowed disabled:bg-ink-400"
      >
        {pending ? (
          "Accepting..."
        ) : (
          <>
            <CheckIcon aria-hidden="true" className="size-4" />
            Accept request
          </>
        )}
      </button>

      <p className="text-xs leading-5 text-ink-500">
        Accepting tells administrators you are available for this request. It
        does not assign you automatically.
      </p>
    </form>
  );
}
