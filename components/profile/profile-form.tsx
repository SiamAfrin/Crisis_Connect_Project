"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { updateProfileAction } from "@/lib/auth/actions";

import {
  Field,
  FormAlert,
  SubmitButton,
  inputClassName,
} from "@/components/ui/form";

type ProfileFormProps = {
  initialFullName: string;
  initialPhone: string;
  initialAddress: string;
};

export function ProfileForm({
  initialFullName,
  initialPhone,
  initialAddress,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);

  const errorFor = (key: string) => state.fieldErrors?.[key]?.[0];

  return (
    <form
      key={state.revision}
      action={formAction}
      className="space-y-5"
    >
      <FormAlert state={state} />

      <Field
        htmlFor="profile-full-name"
        label="Full name"
        required
        error={errorFor("fullName")}
      >
        <input
          id="profile-full-name"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={Boolean(errorFor("fullName"))}
          aria-describedby={
            errorFor("fullName") ? "profile-full-name-error" : undefined
          }
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="profile-phone"
        label="Phone"
        required
        error={errorFor("phone")}
      >
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          maxLength={30}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={Boolean(errorFor("phone"))}
          aria-describedby={
            errorFor("phone") ? "profile-phone-error" : undefined
          }
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="profile-address"
        label="Address"
        required
        error={errorFor("address")}
      >
        <textarea
          id="profile-address"
          name="address"
          rows={3}
          required
          maxLength={500}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-invalid={Boolean(errorFor("address"))}
          aria-describedby={
            errorFor("address") ? "profile-address-error" : undefined
          }
          className={inputClassName}
        />
      </Field>

      <SubmitButton
        pending={pending}
        idleLabel="Save changes"
        pendingLabel="Saving..."
        className="sm:w-auto sm:px-8"
      />
    </form>
  );
}
