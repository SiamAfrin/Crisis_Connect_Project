"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  errorState,
  invalidState,
  type ActionState,
} from "@/lib/auth/action-state";
import { requireActiveAccount } from "@/lib/auth/dal";

import {
  planMissingPersonPhoto,
  removeMissingPersonPhoto,
  uploadMissingPersonPhoto,
} from "./photos";
import {
  createMissingPersonSchema,
  updateMissingPersonStatusSchema,
} from "./schemas";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function photoFieldError(message: string, revision: number): ActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields and try again.",
    fieldErrors: { photo: [message] },
    revision: revision + 1,
  };
}

function describeCreateMissingPersonError(error: PostgrestError): string {
  if (error.code === "42501") {
    return "An active account is required to report a missing person.";
  }

  if (error.code === "PGRST204") {
    return "Photo support is not enabled yet. Apply the latest missing person migration in Supabase, then try again.";
  }

  if (error.code === "23514" || error.code === "23503") {
    return "Some report details were rejected. Check the values and try again.";
  }

  return "The missing person report could not be submitted. Please try again.";
}

/**
 * Creates a missing person report for the signed-in active account.
 *
 * The reporter id and the missing status are derived on the server. They are
 * never accepted from the form. The optional photo is validated, uploaded to a
 * private bucket, and referenced by a nullable photo_path. If the report insert
 * fails after an upload, the uploaded object is removed again.
 *
 * The database RLS insert policy and column grants enforce the same rules
 * independently.
 */
export async function createMissingPersonAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, profile } = await requireActiveAccount();

  const parsed = createMissingPersonSchema.safeParse({
    fullName: readString(formData, "fullName"),
    age: readString(formData, "age"),
    gender: readString(formData, "gender"),
    description: readString(formData, "description"),
    lastSeenLocation: readString(formData, "lastSeenLocation"),
    lastSeenAt: readString(formData, "lastSeenAt"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const photo = await planMissingPersonPhoto(
    formData.get("photo"),
    profile.id,
  );

  if (photo.kind === "error") {
    return photoFieldError(photo.message, previousState.revision);
  }

  let photoPath: string | null = null;

  if (photo.kind === "upload") {
    const upload = await uploadMissingPersonPhoto(
      supabase,
      photo.path,
      photo.file,
    );

    if (!upload.path) {
      return errorState(
        "The photo could not be uploaded. Try again, or submit the report without a photo.",
        previousState.revision,
      );
    }

    photoPath = upload.path;
  }

  const { data, error } = await supabase
    .from("missing_persons")
    .insert({
      reporter_id: profile.id,
      full_name: parsed.data.fullName,
      age: parsed.data.age,
      gender: parsed.data.gender,
      description: parsed.data.description,
      last_seen_location: parsed.data.lastSeenLocation,
      last_seen_at: parsed.data.lastSeenAt.toISOString(),
      photo_path: photoPath,
    })
    .select("report_id")
    .single();

  if (error) {
    if (photoPath) {
      const cleanup = await removeMissingPersonPhoto(supabase, photoPath);

      if (cleanup.error) {
        console.error(
          "Could not remove an uploaded missing person photo after a failed report insert.",
          cleanup.error,
        );
      }
    }

    return errorState(
      describeCreateMissingPersonError(error),
      previousState.revision,
    );
  }

  revalidatePath("/missing-persons");
  revalidatePath("/victim/dashboard");
  revalidatePath("/volunteer/dashboard");
  revalidatePath("/rescue/dashboard");
  revalidatePath("/admin/dashboard");

  redirect(`/missing-persons/${data.report_id}`);
}

function describeMissingPersonStatusError(
  error: PostgrestError,
  requestedStatus: "missing" | "found",
): string {
  if (error.code === "PGRST202") {
    return "Missing person status updates are not available yet. Apply the latest missing person migration in Supabase, then try again.";
  }

  if (error.code === "42501") {
    return "Only the reporter or an administrator can update this report.";
  }

  if (error.code === "P0002") {
    return "That missing person report no longer exists. Refresh the page.";
  }

  if (error.code === "22023") {
    return requestedStatus === "found"
      ? "This report cannot be marked found right now. Refresh the page to see its current status."
      : "This report cannot be reopened right now. Refresh the page to see its current status.";
  }

  return "The report status could not be updated. Please try again.";
}

/**
 * Updates a missing person report to found or back to missing.
 *
 * The Server Action re-checks the active account, validates the report id and
 * requested status, then calls a SECURITY DEFINER function. The function
 * requires the caller to be the reporter or an active administrator, and only
 * administrators may reopen a found report.
 */
export async function updateMissingPersonStatusAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireActiveAccount();

  const parsed = updateMissingPersonStatusSchema.safeParse({
    reportId: readString(formData, "reportId"),
    status: readString(formData, "status"),
  });

  if (!parsed.success) {
    return invalidState(parsed.error, previousState.revision);
  }

  const { error } = await supabase.rpc("update_missing_person_status", {
    target_report_id: parsed.data.reportId,
    new_status: parsed.data.status,
  });

  if (error) {
    return errorState(
      describeMissingPersonStatusError(error, parsed.data.status),
      previousState.revision,
    );
  }

  revalidatePath("/missing-persons");
  revalidatePath(`/missing-persons/${parsed.data.reportId}`);
  revalidatePath("/admin/dashboard");

  return {
    status: "success",
    message:
      parsed.data.status === "found"
        ? "Report marked as found. It is no longer in the active missing list."
        : "Report reopened. It is active in the missing list again.",
    revision: previousState.revision + 1,
  };
}
