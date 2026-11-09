"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { loginAction } from "@/lib/auth/actions";

import {
  Field,
  FormAlert,
  Notice,
  SubmitButton,
  inputClassName,
} from "@/components/ui/form";

type LoginFormProps = {
  nextPath?: string | null;
  noticeMessage?: string | null;
};

export function LoginForm({ nextPath, noticeMessage }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialActionState,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form
      key={state.revision}
      action={formAction}
      className="space-y-5"
    >
      {noticeMessage ? <Notice>{noticeMessage}</Notice> : null}
      <FormAlert state={state} />

      {nextPath ? (
        <input type="hidden" name="next" value={nextPath} />
      ) : null}

      <Field
        htmlFor="login-email"
        label="Email"
        required
        error={emailError}
      >
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "login-email-error" : undefined}
          placeholder="you@example.com"
          className={inputClassName}
        />
      </Field>

      <Field
        htmlFor="login-password"
        label="Password"
        required
        error={passwordError}
      >
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={
            passwordError ? "login-password-error" : undefined
          }
          placeholder="Your password"
          className={inputClassName}
        />
      </Field>

      <SubmitButton
        pending={pending}
        idleLabel="Sign in"
        pendingLabel="Signing in..."
      />

      <p className="text-center text-sm text-ink-600">
        New to Crisis Connect?{" "}
        <Link
          href="/register"
          className="font-semibold text-signal-600 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
