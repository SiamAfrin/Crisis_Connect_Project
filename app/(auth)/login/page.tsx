import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { sanitizeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Crisis Connect account.",
};

// This page reads `searchParams` for the post-login destination and notices.
export const instant = false;

const noticeMessages: Readonly<Record<string, string>> = {
  "profile-missing":
    "Your account is signed in, but its Crisis Connect profile is missing. Sign in again to retry profile setup, or contact an administrator.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    notice?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(first(params.next));
  const noticeKey = first(params.notice);
  const noticeMessage = noticeKey
    ? noticeMessages[noticeKey]
    : undefined;

  return (
    <div className="mt-8 lg:mt-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Sign in to Crisis Connect
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use the email and password you registered with. Pending responder
          accounts can sign in but cannot access responder features yet.
        </p>

        <div className="mt-7">
          <LoginForm
            nextPath={nextPath}
            noticeMessage={noticeMessage}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        Email/password authentication only. No OTP, CAPTCHA, or two-factor
        step.
      </p>
    </div>
  );
}
