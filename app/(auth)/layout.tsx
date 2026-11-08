import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export const instant = false;

const highlights = [
  {
    title: "Verified responders",
    detail:
      "Volunteers and rescue teams stay pending until an administrator approves them.",
  },
  {
    title: "Server-side checks",
    detail:
      "Routes and actions re-check your session, role, and account status.",
  },
  {
    title: "Clear account control",
    detail:
      "You can update your name, phone, and address without changing your role.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(225,29,72,0.32),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.32),_transparent_46%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
            Coordinated emergency response
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            The right people, with the right access, at the right time.
          </h1>
          <p className="mt-5 text-pretty text-base leading-7 text-slate-300">
            Crisis Connect separates victims, volunteers, rescue teams, and
            administrators so emergency coordination stays accountable from the
            first request to the final assignment.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((item, index) => (
              <div key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/10 text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          Crisis Connect · Development build
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <Link href="/" aria-label="Crisis Connect home">
              <Logo />
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Home
            </Link>
          </div>

          <div className="hidden justify-end lg:flex">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Back to home
            </Link>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
