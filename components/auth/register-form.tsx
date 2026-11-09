"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { registerAction } from "@/lib/auth/actions";
import {
  DEFENCE_SUBCATEGORY_OPTIONS,
  RESCUE_TEAM_CATEGORY_OPTIONS,
  USER_ROLE_OPTIONS,
} from "@/lib/constants";

import {
  Field,
  FormAlert,
  SubmitButton,
  inputClassName,
  selectClassName,
} from "@/components/ui/form";

const publicRoles = USER_ROLE_OPTIONS.filter(
  (role) => role.value !== "administrator",
);

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  role: string;
  rescueTeamCategory: string;
  defenceSubcategory: string;
};

const initialValues: RegisterValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  role: "victim",
  rescueTeamCategory: "",
  defenceSubcategory: "",
};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialActionState,
  );
  const [values, setValues] = useState<RegisterValues>(initialValues);

  function update<K extends keyof RegisterValues>(
    key: K,
    value: RegisterValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const errorFor = (key: keyof RegisterValues) =>
    state.fieldErrors?.[key]?.[0];

  const isRescueMember = values.role === "rescue_team_member";
  const isDefence =
    isRescueMember && values.rescueTeamCategory === "defence";

  return (
    <form
      key={state.revision}
      action={formAction}
      className="space-y-5"
    >
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="register-full-name"
          label="Full name"
          required
          error={errorFor("fullName")}
        >
          <input
            id="register-full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(errorFor("fullName"))}
            aria-describedby={
              errorFor("fullName") ? "register-full-name-error" : undefined
            }
            placeholder="Your full name"
            className={inputClassName}
          />
        </Field>

        <Field
          htmlFor="register-email"
          label="Email"
          required
          error={errorFor("email")}
        >
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errorFor("email"))}
            aria-describedby={
              errorFor("email") ? "register-email-error" : undefined
            }
            placeholder="you@example.com"
            className={inputClassName}
          />
        </Field>

        <Field
          htmlFor="register-phone"
          label="Phone"
          required
          error={errorFor("phone")}
        >
          <input
            id="register-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={30}
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errorFor("phone"))}
            aria-describedby={
              errorFor("phone") ? "register-phone-error" : undefined
            }
            placeholder="01700000000"
            className={inputClassName}
          />
        </Field>

        <Field
          htmlFor="register-role"
          label="Role"
          required
          error={errorFor("role")}
          hint="Administrator accounts are not available through public registration."
        >
          <select
            id="register-role"
            name="role"
            required
            value={values.role}
            onChange={(event) => {
              const role = event.target.value;
              setValues((previous) => ({
                ...previous,
                role,
                rescueTeamCategory:
                  role === "rescue_team_member"
                    ? previous.rescueTeamCategory
                    : "",
                defenceSubcategory:
                  role === "rescue_team_member"
                    ? previous.defenceSubcategory
                    : "",
              }));
            }}
            aria-invalid={Boolean(errorFor("role"))}
            aria-describedby={
              errorFor("role") ? "register-role-error" : "register-role-hint"
            }
            className={selectClassName}
          >
            {publicRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>

        {isRescueMember ? (
          <Field
            htmlFor="register-rescue-category"
            label="Rescue team category"
            required
            error={errorFor("rescueTeamCategory")}
          >
            <select
              id="register-rescue-category"
              name="rescueTeamCategory"
              required
              value={values.rescueTeamCategory}
              onChange={(event) => {
                const category = event.target.value;
                setValues((previous) => ({
                  ...previous,
                  rescueTeamCategory: category,
                  defenceSubcategory:
                    category === "defence"
                      ? previous.defenceSubcategory
                      : "",
                }));
              }}
              aria-invalid={Boolean(errorFor("rescueTeamCategory"))}
              aria-describedby={
                errorFor("rescueTeamCategory")
                  ? "register-rescue-category-error"
                  : undefined
              }
              className={selectClassName}
            >
              <option value="">Select a category</option>
              {RESCUE_TEAM_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {isDefence ? (
          <Field
            htmlFor="register-defence-subcategory"
            label="Defence subcategory"
            required
            error={errorFor("defenceSubcategory")}
            hint="Defence teams must be Police or Fire Service."
          >
            <select
              id="register-defence-subcategory"
              name="defenceSubcategory"
              required
              value={values.defenceSubcategory}
              onChange={(event) =>
                update("defenceSubcategory", event.target.value)
              }
              aria-invalid={Boolean(errorFor("defenceSubcategory"))}
              aria-describedby={
                errorFor("defenceSubcategory")
                  ? "register-defence-subcategory-error"
                  : "register-defence-subcategory-hint"
              }
              className={selectClassName}
            >
              <option value="">Select a subcategory</option>
              {DEFENCE_SUBCATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      <Field
        htmlFor="register-address"
        label="Address"
        required
        error={errorFor("address")}
      >
        <textarea
          id="register-address"
          name="address"
          rows={3}
          required
          maxLength={500}
          value={values.address}
          onChange={(event) => update("address", event.target.value)}
          aria-invalid={Boolean(errorFor("address"))}
          aria-describedby={
            errorFor("address") ? "register-address-error" : undefined
          }
          placeholder="House, road, area, city"
          className={inputClassName}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          htmlFor="register-password"
          label="Password"
          required
          error={errorFor("password")}
          hint="Use at least 8 characters."
        >
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            aria-invalid={Boolean(errorFor("password"))}
            aria-describedby={
              errorFor("password")
                ? "register-password-error"
                : "register-password-hint"
            }
            placeholder="Create a password"
            className={inputClassName}
          />
        </Field>

        <Field
          htmlFor="register-confirm-password"
          label="Confirm password"
          required
          error={errorFor("confirmPassword")}
        >
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={values.confirmPassword}
            onChange={(event) =>
              update("confirmPassword", event.target.value)
            }
            aria-invalid={Boolean(errorFor("confirmPassword"))}
            aria-describedby={
              errorFor("confirmPassword")
                ? "register-confirm-password-error"
                : undefined
            }
            placeholder="Repeat your password"
            className={inputClassName}
          />
        </Field>
      </div>

      <SubmitButton
        pending={pending}
        idleLabel="Create account"
        pendingLabel="Creating account..."
      />

      <p className="text-center text-sm text-ink-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-signal-600 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
