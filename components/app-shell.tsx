import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { logoutAction } from "@/lib/auth/actions";
import { getHomePathForProfile } from "@/lib/auth/routes";
import type { Tables } from "@/types/database";

type AppShellProps = {
  profile: Tables<"profiles">;
  children: ReactNode;
};

export function AppShell({ profile, children }: AppShellProps) {
  const homePath = getHomePathForProfile(profile);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <Link
            href={homePath}
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600"
            aria-label="Crisis Connect home"
          >
            <Logo subtitle="Emergency response coordination" />
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2.5">
              <span className="hidden max-w-44 truncate text-sm font-medium text-slate-700 sm:block">
                {profile.full_name}
              </span>
              <StatusBadge status={profile.account_status} />
            </div>

            <nav
              aria-label="Application"
              className="flex items-center gap-1 text-sm font-medium text-slate-600"
            >
              <Link
                href={homePath}
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Home
              </Link>
              {profile.role === "victim" ? (
                <Link
                  href="/victim/requests"
                  className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                >
                  Requests
                </Link>
              ) : null}
              {profile.role === "administrator" ? (
                <>
                  <Link
                    href="/admin/responders"
                    className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                  >
                    Approvals
                  </Link>
                  <Link
                    href="/admin/requests"
                    className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                  >
                    Request review
                  </Link>
                </>
              ) : null}
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Profile
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-left transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                >
                  Log out
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:py-12">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Crisis Connect · Secure emergency coordination</p>
          <p>Chunk 4 · Emergency request review</p>
        </div>
      </footer>
    </div>
  );
}
