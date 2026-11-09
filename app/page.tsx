import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import heroImage from "@/public/crisis-connect-hero.jpeg";

const roles = [
  {
    title: "Victims",
    detail:
      "Report an emergency, then follow the review decision and responder assignment.",
  },
  {
    title: "Volunteers",
    detail:
      "Accept approved requests when you can respond and check the assignments made to you.",
  },
  {
    title: "Rescue teams",
    detail:
      "Take on requests assigned to your government, hospital, defence, or NGO team.",
  },
  {
    title: "Administrators",
    detail:
      "Review registrations and requests, then assign accepted responders.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative isolate flex min-h-[38rem] flex-col overflow-hidden bg-ink-950 text-white lg:min-h-[42rem]">
        <Image
          src={heroImage}
          alt="Emergency responders working through wildfire, flood, and earthquake conditions"
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover object-[50%_30%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,27,42,0.52)_0%,rgba(11,27,42,0.16)_34%,rgba(11,27,42,0.24)_66%,rgba(11,27,42,0.6)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(11,27,42,0.88)_0%,rgba(11,27,42,0.7)_42%,rgba(11,27,42,0.48)_72%,rgba(11,27,42,0.28)_100%)] lg:bg-[linear-gradient(90deg,rgba(11,27,42,0.82)_0%,rgba(11,27,42,0.55)_40%,rgba(11,27,42,0.18)_72%,rgba(11,27,42,0.05)_100%)]"
        />

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-500"
            >
              <Logo tone="light" />
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-ink-100 active:bg-ink-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md bg-signal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-signal-600 active:bg-signal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create account
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </nav>
          </header>

          <div className="flex flex-1 items-center py-16 lg:py-24">
            <div className="max-w-3xl">
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white [text-shadow:0_2px_20px_rgba(11,27,42,0.65)] sm:text-5xl lg:text-6xl">
                When every minute counts, coordination saves lives.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-white [text-shadow:0_2px_12px_rgba(11,27,42,0.8)] sm:text-lg sm:leading-8">
                Crisis Connect helps people report an emergency, gives verified
                volunteers and rescue teams a clear list of requests, and keeps
                administrators in control of review and assignment.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-md bg-signal-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-ink-950/25 transition hover:bg-signal-600 active:bg-signal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Create an account
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink-950 shadow-md shadow-ink-950/25 transition hover:bg-ink-100 active:bg-ink-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Sign in to your account
                </Link>
              </div>

              <p className="mt-6 max-w-xl text-sm leading-6 text-ink-100 [text-shadow:0_1px_10px_rgba(11,27,42,0.7)]">
                If someone is in immediate danger, contact your local emergency
                services first.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950 sm:text-3xl">
            Who uses Crisis Connect
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Each role sees the requests and actions that belong to it.
          </p>
        </div>

        <dl className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role.title} className="border-t border-line pt-4">
              <dt className="text-sm font-semibold text-ink-950">
                {role.title}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-ink-600">
                {role.detail}
              </dd>
            </div>
          ))}
        </dl>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <p className="text-xs text-ink-500">Crisis Connect</p>
        </div>
      </footer>
    </div>
  );
}
