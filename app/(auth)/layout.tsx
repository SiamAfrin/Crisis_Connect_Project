import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import heroImage from "@/public/crisis-connect-hero.jpeg";

export const instant = false;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative isolate hidden overflow-hidden bg-ink-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <Image
          src={heroImage}
          alt="Emergency responders working through wildfire, flood, and earthquake conditions"
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="-z-20 object-cover object-[50%_35%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,27,42,0.85)_0%,rgba(11,27,42,0.45)_50%,rgba(11,27,42,0.8)_100%)]"
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-500"
          >
            <Logo tone="light" />
          </Link>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8 lg:justify-end lg:border-b-0 lg:px-12 lg:py-6">
          <Link href="/" className="rounded-md lg:hidden">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-600 underline-offset-4 transition hover:text-ink-950 hover:underline"
          >
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
