"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/ui/form";
import { UserCheckIcon } from "@/components/ui/icons";
import { assignEmergencyResponderAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

type AssignResponderButtonProps = {
  requestId: string;
  responderId: string;
  responderName: string;
};

export function AssignResponderButton({
  requestId,
  responderId,
  responderName,
}: AssignResponderButtonProps) {
  const [state, formAction, pending] = useActionState(
    assignEmergencyResponderAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="responderId" value={responderId} />

      <FormAlert state={state} />

      <button
        type="submit"
        disabled={pending}
        aria-label={`Assign ${responderName}`}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        <UserCheckIcon aria-hidden="true" className="size-4" />
        {pending ? "Assigning..." : "Assign responder"}
      </button>
    </form>
  );
}
