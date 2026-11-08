import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth/dal";

// These pages read the session at request time and must block until the user
// is resolved. Authorization is still enforced again in every page and action.
export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
