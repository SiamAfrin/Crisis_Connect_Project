"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  errorState,
  invalidState,
  type ActionState,
} from "@/lib/auth/action-state";
import { requireActiveRole } from "@/lib/auth/dal";

import { createRequestSchema } from "./schemas";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function describeRequestError(error: PostgrestError): string {
  if (error.code === "42501") {
    return "Your account is not allowed to submit emergency requests right now.";
  }

  if (error.code === "23514" || error.code === "23503") {
    return "Some request details were rejected. Check the values and try again.";
  }

  if (error.code === "23505") {
    return "This request was already submitted.";
  }

  return "Your request could not be submitted. Please try again.";
}

/**
 * Creates an emergency request for the signed-in active victim.
 *
 * The victim id, pending status, and empty review fields are all derived on
 * the server. They are never accepted from the form. The database RLS insert
 * policy and column grants enforce the same rules independently.
 */
export async function createEmergencyRequestAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, profile } = await requireActiveRole("victim");

  const parsed = createRequestSchema.safeParse({
    emergencyType: readString(formData, "emergencyType"),
    location: readString(formData, "location"),
    description: readString(formData, "description"),
    affectedPeople: readString(formData, "affectedPeople"),
    severity: readString(formData, "severity"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const { data, error } = await supabase
    .from("emergency_requests")
    .insert({
      victim_id: profile.id,
      emergency_type: parsed.data.emergencyType,
      location: parsed.data.location,
      description: parsed.data.description,
      affected_people: parsed.data.affectedPeople,
      severity: parsed.data.severity,
    })
    .select("request_id")
    .single();

  if (error) {
    return errorState(
      describeRequestError(error),
      previousState.revision,
    );
  }

  revalidatePath("/victim/dashboard");
  revalidatePath("/victim/requests");

  redirect(`/victim/requests/${data.request_id}`);
}
