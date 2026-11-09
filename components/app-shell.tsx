import Link from "next/link";
import type { ReactNode } from "react";

import { AppNav, type AppNavItem } from "@/components/app-nav";
import { LogOutIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { logoutAction } from "@/lib/auth/actions";
import { getHomePathForProfile, getRoleHome } from "@/lib/auth/routes";
import { getRoleLabel } from "@/lib/constants";
import type { Tables } from "@/types/database";

type AppShellProps = {
  profile: Tables<"profiles">;
  children: ReactNode;
};

function buildNavItems(profile: Tables<"profiles">): AppNavItem[] {
  const items: AppNavItem[] = [];

  if (profile.account_status === "active") {
    items.push({
      href: getRoleHome(profile.role),
      label: "Dashboard",
    });

    if (profile.role === "victim") {
      items.push({
        href: "/victim/requests",
        label: "My requests",
      });
    }

    if (profile.role === "administrator") {
      items.push(
        {
          href: "/admin/responders",
          label: "Responders",
        },
        {
          href: "/admin/requests",
          label: "Requests",
        },
        {
          href: "/admin/assignments",
          label: "Assignments",
        },
      );
    }
  } else {
    items.push({
      href: "/account-status",
      label: "Account status",
    });
  }

  items.push({
    href: "/profile",
    label: "Profile",
  });

  return items;
}

export function AppShell({ profile, children }: AppShellProps) {
  const homePath = getHomePathForProfile(profile);
  const navItems = buildNavItems(profile);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href={homePath}
              className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-500"
            >
              <Logo tone="light" />
            </Link>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-medium leading-5 text-white">
                  {profile.full_name}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {getRoleLabel(profile.role)}
                </p>
              </div>

              <StatusBadge status={profile.account_status} tone="dark" />

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-400"
                >
                  <LogOutIcon aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </form>
            </div>
          </div>

          <AppNav items={navItems} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
