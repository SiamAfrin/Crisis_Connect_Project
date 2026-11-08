import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import {
  ACCOUNT_STATUS_LABELS,
  RESCUE_TEAM_CATEGORY_OPTIONS,
  USER_ROLE_OPTIONS,
} from "@/lib/constants";

const includedItems = [
  {
    title: "Registration",
    detail:
      "Victim, volunteer, and rescue team sign-up with role-specific fields and validation.",
  },
  {
    title: "Login and logout",
    detail:
      "Email/password sessions, immediate logout, and automatic session refresh.",
  },
  {
    title: "Profiles",
    detail:
      "Update full name, phone, and address while email, role, and status stay immutable.",
  },
  {
    title: "Protected routes",
    detail:
      "Server-side redirects plus role and account-status checks on every protected page.",
  },
  {
    title: "Responder approvals",
    detail:
      "Administrators review pending volunteer and rescue team registrations, including rescue category and Defence subcategory, then approve or reject them.",
  },
  {
    title: "Emergency requests",
    detail:
      "Active victims submit requests and track review status; administrators approve or reject them, and approved requests become visible to responders.",
  },
];

const securityItems = [
  "Public registration cannot create administrator accounts.",
  "Volunteers and rescue team members start pending; victims start active.",
  "Pending and rejected responders cannot reach responder dashboards.",
  "Only active administrators can approve or reject responder registrations.",
  "Only active administrators can approve or reject emergency requests.",
  "Row Level Security and server-side review functions block direct role, account-status, and request-status changes.",
];

const flow = [
  {
    step: "01",
    title: "Create an account",
    detail: "Choose your role and, for rescue teams, the required category.",
  },
  {
    step: "02",
    title: "Sign in securely",
    detail: "The server validates your session and loads your profile.",
  },
  {
    step: "03",
    title: "Enter the right space",
    detail:
      "Active victims and responders reach their dashboard. Pending or rejected responders see their account status.",
  },
  {
    step: "04",
    title: "Review responders and requests",
    detail:
      "Administrators approve or reject pending responder accounts and victim emergency requests, unlocking responder access only when approved.",
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.16),_transparent_46%),radial-gradient(circle_at_top_right,_rgba(14,116,144,0.15),_transparent_44%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Crisis Connect home"
            className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600"
          >
            <Logo />
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
            >
              Create account
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-start gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Chunk 4 · Emergency request review
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Coordinated emergency response starts with verified access.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
              Crisis Connect brings victims, approved volunteers, rescue teams,
              and administrators into one accountable workflow. Chunk 4 adds
              victim emergency request submission and administrator review,
              where approved requests become visible to active responders, on
              top of registration, login, profiles, protected routes, responder
              approval, and server-side role and status authorization.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                Create an account
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-950"
              >
                Sign in
              </Link>
              <a
                href="/api/health/supabase"
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
              >
                Check system health
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {includedItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <h2 className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Registration roles
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Who can join publicly
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Server validated
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {USER_ROLE_OPTIONS.map((role) => {
                  const isAdmin = role.value === "administrator";
                  const initialStatus =
                    role.value === "victim"
                      ? ACCOUNT_STATUS_LABELS.active
                      : isAdmin
                        ? "Invite only"
                        : ACCOUNT_STATUS_LABELS.pending;

                  return (
                    <div
                      key={role.value}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {role.label}
                        </p>
                        <span
                          className={
                            isAdmin
                              ? "rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-rose-700"
                              : initialStatus === ACCOUNT_STATUS_LABELS.active
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-700"
                                : "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-800"
                          }
                        >
                          {initialStatus}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {role.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Rescue team categories
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {RESCUE_TEAM_CATEGORY_OPTIONS.map((category) => (
                    <span
                      key={category.value}
                      className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs"
                    >
                      {category.label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Defence requires Police or Fire Service. Other categories keep
                  the subcategory empty.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                Account status rule
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                Pending and rejected responders can sign in and edit their
                profile, but they are redirected to{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
                  /account-status
                </code>{" "}
                instead of a responder dashboard.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 pb-14 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              From registration to the right dashboard
            </h2>

            <div className="mt-6 space-y-5">
              {flow.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              Chunk 4 covers victim emergency requests and administrator request
              review. Approved requests become visible to active responders;
              assignment and acceptance remain Chunk 5 work.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
              Security boundaries
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              The UI is not the authorization layer
            </h2>
            <ul className="mt-6 space-y-3.5">
              {securityItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <span
                    aria-hidden="true"
                    className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[0.65rem] font-bold text-emerald-300"
                  >
                    ✓
                  </span>
                  <span className="text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">
              Server Actions, protected pages, the session-refresh proxy, RLS
              policies, and database constraints all participate in enforcement.
            </p>
          </div>
        </section>

        <footer className="mt-auto flex flex-col gap-2 border-t border-slate-200 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Crisis Connect · Authentication, profiles, approvals, and requests</p>
          <p>Chunk 4 · Emergency request review</p>
        </footer>
      </div>
    </main>
  );
}
