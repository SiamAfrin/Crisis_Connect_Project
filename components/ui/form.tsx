import type { ReactNode } from "react";

import type { ActionState } from "@/lib/auth/action-state";

export const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 aria-invalid:border-rose-400 aria-invalid:focus:border-rose-500";

export const selectClassName = `${inputClassName} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem_1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`;

type FieldProps = {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({
  htmlFor,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium text-slate-800"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-rose-600">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-rose-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FormAlertProps = {
  state: ActionState;
};

export function FormAlert({ state }: FormAlertProps) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isSuccess = state.status === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
      className={
        isSuccess
          ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      }
    >
      {state.message}
    </div>
  );
}

type NoticeProps = {
  tone?: "info" | "warning";
  children: ReactNode;
};

export function Notice({ tone = "info", children }: NoticeProps) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          : "rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
      }
    >
      {children}
    </div>
  );
}

export function SubmitButton({
  pending,
  idleLabel,
  pendingLabel,
  className = "",
}: {
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-400 ${className}`}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
