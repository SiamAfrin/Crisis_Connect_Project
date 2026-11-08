"use client";

import { useActionState, useState } from "react";

import {
  EMERGENCY_SEVERITY_OPTIONS,
  EMERGENCY_TYPE_SUGGESTIONS,
} from "@/lib/constants";
import { initialActionState } from "@/lib/auth/action-state";
import { createEmergencyRequestAction } from "@/lib/requests/actions";

import {
  Field,
  FormAlert,
  SubmitButton,
  inputClassName,
  selectClassName,
} from "@/components/ui/form";

type RequestValues = {
  emergencyType: string;
  location: string;
  description: string;
  affectedPeople: string;
  severity: string;
};

const initialValues: RequestValues = {
  emergencyType: "",
  location: "",
  description: "",
  affectedPeople: "",
  severity: "",
};

export function RequestForm() {
  const [state, formAction, pending] = useActionState(
    createEmergencyRequestAction,
    initialActionState,
  );
  const [values, setValues] = useState<RequestValues>(initialValues);

  function update<K extends keyof RequestValues>(
    key: K,
    value: RequestValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const errorFor = (key: keyof RequestValues) =>
    state.fieldErrors?.[key]?.[0];

  return (
    <form
      key={state.revision}
      action={formAction}
      className="space-y-5"
    >
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="request-emergency-type"
          label="Emergency type"
          required
          error={errorFor("emergencyType")}
          hint="Choose a suggestion or describe the emergency."
        >
          <input
            id="request-emergency-type"
            name="emergencyType"
            type="text"
            list="emergency-type-suggestions"
            required
            maxLength={100}
            value={values.emergencyType}
            onChange={(event) =>
              update("emergencyType", event.target.value)
            }
            aria-invalid={Boolean(errorFor("emergencyType"))}
            aria-describedby={
              errorFor("emergencyType")
                ? "request-emergency-type-error"
                : "request-emergency-type-hint"
            }
            placeholder="Flood, fire, medical emergency..."
            className={inputClassName}
          />
          <datalist id="emergency-type-suggestions">
            {EMERGENCY_TYPE_SUGGESTIONS.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>

        <Field
          htmlFor="request-severity"
          label="Severity"
          required
          error={errorFor("severity")}
          hint="Critical means an immediate threat to life."
        >
          <select
            id="request-severity"
            name="severity"
            required
            value={values.severity}
            onChange={(event) => update("severity", event.target.value)}
            aria-invalid={Boolean(errorFor("severity"))}
            aria-describedby={
              errorFor("severity")
                ? "request-severity-error"
                : "request-severity-hint"
            }
            className={selectClassName}
          >
            <option value="">Select severity</option>
            {EMERGENCY_SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        htmlFor="request-location"
        label="Location"
        required
        error={errorFor("location")}
        hint="Include the area, road, or landmark responders should reach."
      >
        <input
          id="request-location"
          name="location"
          type="text"
          required
          maxLength={500}
          value={values.location}
          onChange={(event) => update("location", event.target.value)}
          aria-invalid={Boolean(errorFor("location"))}
          aria-describedby={
            errorFor("location")
              ? "request-location-error"
              : "request-location-hint"
          }
          placeholder="House, road, area, city"
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="request-affected-people"
        label="Affected people"
        required
        error={errorFor("affectedPeople")}
        hint="Enter the number of people currently affected."
      >
        <input
          id="request-affected-people"
          name="affectedPeople"
          type="number"
          inputMode="numeric"
          min={1}
          max={1_000_000}
          step={1}
          required
          value={values.affectedPeople}
          onChange={(event) =>
            update("affectedPeople", event.target.value)
          }
          aria-invalid={Boolean(errorFor("affectedPeople"))}
          aria-describedby={
            errorFor("affectedPeople")
              ? "request-affected-people-error"
              : "request-affected-people-hint"
          }
          placeholder="1"
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="request-description"
        label="Description"
        required
        error={errorFor("description")}
        hint="Describe what happened, immediate risks, and what help is needed."
      >
        <textarea
          id="request-description"
          name="description"
          rows={5}
          required
          maxLength={5000}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          aria-invalid={Boolean(errorFor("description"))}
          aria-describedby={
            errorFor("description")
              ? "request-description-error"
              : "request-description-hint"
          }
          placeholder="Describe the emergency, who is affected, and what responders should know."
          className={inputClassName}
        />
      </Field>

      <SubmitButton
        pending={pending}
        idleLabel="Submit emergency request"
        pendingLabel="Submitting request..."
      />
    </form>
  );
}
