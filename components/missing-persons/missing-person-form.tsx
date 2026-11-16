"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { MISSING_PERSON_GENDER_OPTIONS } from "@/lib/constants";
import { createMissingPersonAction } from "@/lib/missing-persons/actions";
import {
  MISSING_PERSON_PHOTO_ACCEPT,
  MISSING_PERSON_PHOTO_MAX_BYTES,
} from "@/lib/missing-persons/photos";

import {
  Field,
  FormAlert,
  SubmitButton,
  inputClassName,
  selectClassName,
} from "@/components/ui/form";

type MissingPersonValues = {
  fullName: string;
  age: string;
  gender: string;
  lastSeenLocation: string;
  lastSeenAt: string;
  description: string;
};

const initialValues: MissingPersonValues = {
  fullName: "",
  age: "",
  gender: "unknown",
  lastSeenLocation: "",
  lastSeenAt: "",
  description: "",
};

const MAX_PHOTO_SIZE_MB = Math.round(
  MISSING_PERSON_PHOTO_MAX_BYTES / (1024 * 1024),
);

function MissingPersonPhotoField({ error }: { error?: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  // Revoke the previous object URL when the selection changes or the field
  // unmounts, so the browser does not retain blob memory.
  useEffect(() => {
    if (!preview) {
      return;
    }

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <Field
      htmlFor="missing-person-photo"
      label="Photograph"
      error={error}
      hint={`Optional. JPG, PNG, or WebP up to ${MAX_PHOTO_SIZE_MB} MB. Submit the report without a photo if none is available.`}
    >
      <input
        id="missing-person-photo"
        name="photo"
        type="file"
        accept={MISSING_PERSON_PHOTO_ACCEPT}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? "missing-person-photo-error"
            : "missing-person-photo-hint"
        }
        className={`${inputClassName} file:mr-3 file:rounded-md file:border-0 file:bg-ink-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-ink-800`}
      />
      {preview ? (
        <div className="mt-3 flex items-center gap-3">
          {/* Blob previews cannot be optimized by next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected photograph preview"
            className="size-20 rounded-lg border border-line object-cover"
          />
          <p className="text-xs leading-5 text-ink-500">
            Preview of the selected photo. It is uploaded only when the report
            is submitted.
          </p>
        </div>
      ) : null}
    </Field>
  );
}

export function MissingPersonForm() {
  const [state, formAction, pending] = useActionState(
    createMissingPersonAction,
    initialActionState,
  );
  const [values, setValues] = useState<MissingPersonValues>(initialValues);

  // React disables the submit button only after it re-renders with a pending
  // action. This ref flips synchronously on the first submit, so a second
  // submit in that window is ignored.
  const submittingRef = useRef(false);

  // Allow another attempt once the action returns a result, so the user can
  // correct validation errors and resubmit.
  useEffect(() => {
    if (!pending) {
      submittingRef.current = false;
    }
  }, [pending, state.revision]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submittingRef.current) {
      event.preventDefault();
      return;
    }

    submittingRef.current = true;
  }

  function update<K extends keyof MissingPersonValues>(
    key: K,
    value: MissingPersonValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const errorFor = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form
      key={state.revision}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="missing-person-full-name"
          label="Full name"
          required
          error={errorFor("fullName")}
          hint="Use the name the person is most likely to be recognised by."
        >
          <input
            id="missing-person-full-name"
            name="fullName"
            type="text"
            required
            maxLength={120}
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(errorFor("fullName"))}
            aria-describedby={
              errorFor("fullName")
                ? "missing-person-full-name-error"
                : "missing-person-full-name-hint"
            }
            placeholder="Full name"
            className={inputClassName}
          />
        </Field>

        <Field
          htmlFor="missing-person-age"
          label="Age"
          error={errorFor("age")}
          hint="Optional. Leave blank if the age is unknown."
        >
          <input
            id="missing-person-age"
            name="age"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            step={1}
            value={values.age}
            onChange={(event) => update("age", event.target.value)}
            aria-invalid={Boolean(errorFor("age"))}
            aria-describedby={
              errorFor("age")
                ? "missing-person-age-error"
                : "missing-person-age-hint"
            }
            placeholder="Age in years"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="missing-person-gender"
          label="Gender"
          required
          error={errorFor("gender")}
          hint="Choose Unknown when the gender is not known."
        >
          <select
            id="missing-person-gender"
            name="gender"
            required
            value={values.gender}
            onChange={(event) => update("gender", event.target.value)}
            aria-invalid={Boolean(errorFor("gender"))}
            aria-describedby={
              errorFor("gender")
                ? "missing-person-gender-error"
                : "missing-person-gender-hint"
            }
            className={selectClassName}
          >
            {MISSING_PERSON_GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          htmlFor="missing-person-last-seen-at"
          label="Last seen at"
          required
          error={errorFor("lastSeenAt")}
          hint="Use Bangladesh time (BST, UTC+6). Enter when the person was last seen or in contact."
        >
          <input
            id="missing-person-last-seen-at"
            name="lastSeenAt"
            type="datetime-local"
            required
            value={values.lastSeenAt}
            onChange={(event) => update("lastSeenAt", event.target.value)}
            aria-invalid={Boolean(errorFor("lastSeenAt"))}
            aria-describedby={
              errorFor("lastSeenAt")
                ? "missing-person-last-seen-at-error"
                : "missing-person-last-seen-at-hint"
            }
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        htmlFor="missing-person-last-seen-location"
        label="Last seen location"
        required
        error={errorFor("lastSeenLocation")}
        hint="Include the area, road, landmark, or shelter where the person was last seen."
      >
        <input
          id="missing-person-last-seen-location"
          name="lastSeenLocation"
          type="text"
          required
          maxLength={500}
          value={values.lastSeenLocation}
          onChange={(event) => update("lastSeenLocation", event.target.value)}
          aria-invalid={Boolean(errorFor("lastSeenLocation"))}
          aria-describedby={
            errorFor("lastSeenLocation")
              ? "missing-person-last-seen-location-error"
              : "missing-person-last-seen-location-hint"
          }
          placeholder="House, road, area, city"
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="missing-person-description"
        label="Description"
        required
        error={errorFor("description")}
        hint="Describe appearance, clothing, belongings, and anything that helps identify the person."
      >
        <textarea
          id="missing-person-description"
          name="description"
          rows={5}
          required
          maxLength={2000}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          aria-invalid={Boolean(errorFor("description"))}
          aria-describedby={
            errorFor("description")
              ? "missing-person-description-error"
              : "missing-person-description-hint"
          }
          placeholder="Appearance, clothing, distinguishing features, and where they may have gone."
          className={inputClassName}
        />
      </Field>

      <MissingPersonPhotoField
        key={state.revision}
        error={errorFor("photo")}
      />

      <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">
        Your profile phone number is shared with administrators so they can
        follow up. It is not shown to other responders or victims.
      </p>

      <SubmitButton
        pending={pending}
        idleLabel="Submit missing person report"
        pendingLabel="Submitting report..."
      />
    </form>
  );
}
