import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Register as a victim, volunteer, or rescue team member on Crisis Connect.",
};

export default function RegisterPage() {
  return (
    <div>
      <div className="panel p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Create an account
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Choose your role. Victim accounts are active immediately. Volunteer
          and rescue team accounts remain pending until an administrator
          approves them.
        </p>

        <div className="mt-7">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
