"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  errorState,
  invalidState,
  type ActionState,
} from "@/lib/auth/action-state";
import { requireActiveRole } from "@/lib/auth/dal";

import {
  assignResponderSchema,
  reviewEmergencyRequestSchema,
  reviewResponderSchema,
} from "./schemas";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function describeReviewError(error: PostgrestError): string {
  if (error.code === "PGRST202") {
    return "Responder approval is not available yet. Apply the admin approval migration in Supabase, then try again.";
  }

  if (error.code === "42501") {
    return "Only active administrators can review responder accounts.";
  }

  if (error.code === "P0002") {
    return "That responder account no longer exists. Refresh the page.";
  }

  if (error.code === "22023") {
    return "That registration is no longer pending. Refresh the page to see its current status.";
  }

  return "The review decision could not be saved. Please try again.";
}

/**
 * Approves or rejects a pending volunteer or rescue team registration.
 *
 * The Server Action re-checks the active administrator role, then calls a
 * SECURITY DEFINER database function that repeats the same checks. No client
 * can update `profiles.account_status` directly.
 */
export async function reviewResponderAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireActiveRole("administrator");

  const parsed = reviewResponderSchema.safeParse({
    profileId: readString(formData, "profileId"),
    decision: readString(formData, "decision"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const { data, error } = await supabase.rpc(
    "review_responder_account",
    {
      target_profile_id: parsed.data.profileId,
      decision: parsed.data.decision,
    },
  );

  if (error) {
    return errorState(
      describeReviewError(error),
      previousState.revision,
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/responders");

  return {
    status: "success",
    message:
      data === "active"
        ? "Responder approved."
        : "Responder rejected.",
    revision: previousState.revision + 1,
  };
}

function describeRequestReviewError(error: PostgrestError): string {
  if (error.code === "PGRST202") {
    return "Emergency request review is not available yet. Apply the admin request review migration in Supabase, then try again.";
  }

  if (error.code === "42501") {
    return "Only active administrators can review emergency requests.";
  }

  if (error.code === "P0002") {
    return "That emergency request no longer exists. Refresh the page.";
  }

  if (error.code === "22023") {
    return "That request is no longer pending. Refresh the page to see its current status.";
  }

  return "The review decision could not be saved. Please try again.";
}

/**
 * Approves or rejects a pending emergency request.
 *
 * The Server Action re-checks the active administrator role, then calls a
 * SECURITY DEFINER database function that repeats the same checks and records
 * the reviewing administrator and timestamp. No client can update
 * `emergency_requests.request_status` directly.
 */
export async function reviewEmergencyRequestAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireActiveRole("administrator");

  const parsed = reviewEmergencyRequestSchema.safeParse({
    requestId: readString(formData, "requestId"),
    decision: readString(formData, "decision"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const { data, error } = await supabase.rpc(
    "review_emergency_request",
    {
      target_request_id: parsed.data.requestId,
      decision: parsed.data.decision,
    },
  );

  if (error) {
    return errorState(
      describeRequestReviewError(error),
      previousState.revision,
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/requests");
  revalidatePath("/victim/dashboard");
  revalidatePath("/victim/requests");
  revalidatePath("/volunteer/dashboard");
  revalidatePath("/rescue/dashboard");

  return {
    status: "success",
    message:
      data === "approved"
        ? "Emergency request approved. Approved responders can now see it."
        : "Emergency request rejected.",
    revision: previousState.revision + 1,
  };
}

function describeAssignmentError(error: PostgrestError): string {
  if (error.code === "PGRST202") {
    return "Responder assignment is not available yet. Apply the responder acceptance migration in Supabase, then try again.";
  }

  if (error.code === "42501") {
    return "Only active administrators can assign responders.";
  }

  if (error.code === "P0002") {
    return "That request or responder account no longer exists. Refresh the page.";
  }

  if (error.code === "23505") {
    return "That responder is already assigned to this request. Refresh the page.";
  }

  if (error.code === "22023") {
    return "Only active responders who accepted the request can be assigned. Refresh the page to see the current state.";
  }

  return "The assignment could not be saved. Please try again.";
}

/**
 * Assigns an active responder who has already accepted an approved request.
 *
 * The Server Action re-checks the active administrator role, then calls a
 * SECURITY DEFINER function that repeats the same checks, derives the assigning
 * administrator from the session, and records the assignment time.
 */
export async function assignEmergencyResponderAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireActiveRole("administrator");

  const parsed = assignResponderSchema.safeParse({
    requestId: readString(formData, "requestId"),
    responderId: readString(formData, "responderId"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const { data, error } = await supabase.rpc(
    "assign_emergency_responder",
    {
      target_request_id: parsed.data.requestId,
      target_responder_id: parsed.data.responderId,
    },
  );

  if (error) {
    return errorState(
      describeAssignmentError(error),
      previousState.revision,
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/assignments");
  revalidatePath("/volunteer/dashboard");
  revalidatePath("/rescue/dashboard");

  return {
    status: "success",
    message: data
      ? "Responder assigned. The responder can now see this assignment."
      : "Responder assigned.",
    revision: previousState.revision + 1,
  };
}
