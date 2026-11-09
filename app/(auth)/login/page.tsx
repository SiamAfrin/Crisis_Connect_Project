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
    <div>
      <div className="panel p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Use the email and password you registered with. Pending responder
          accounts can sign in to review their status.
        </p>

        <div className="mt-7">
          <LoginForm
            nextPath={nextPath}
            noticeMessage={noticeMessage}
          />
        </div>
      </div>
    </div>
  );
}
