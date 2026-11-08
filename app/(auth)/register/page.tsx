import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Register as a victim, volunteer, or rescue team member on Crisis Connect.",
};

export default function RegisterPage() {
  return (
    <div className="mt-8 lg:mt-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Registration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Create your Crisis Connect account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose the role that matches how you will use the platform. Victim
          accounts are active immediately. Volunteer and rescue team accounts
          remain pending until an administrator approves them.
        </p>

        <div className="mt-7">
          <RegisterForm />
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        Public registration never creates administrator accounts.
      </p>
    </div>
  );
}
