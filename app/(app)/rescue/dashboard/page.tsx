import type { Metadata } from "next";

import { ResponderDashboard } from "@/components/responder/responder-dashboard";
import { requireActiveResponder } from "@/lib/auth/dal";
import {
  getDefenceSubcategoryLabel,
  getRescueCategoryLabel,
} from "@/lib/constants";
import { getResponderWorkspace } from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "Rescue team dashboard",
  description: "Your Crisis Connect rescue team dashboard.",
};

// This page blocks on the rescue team session, so it cannot render an instant shell.
export const instant = false;

export default async function RescueDashboardPage() {
  const { supabase, profile } = await requireActiveResponder(
    "rescue_team_member",
  );
  const categoryLabel = getRescueCategoryLabel(
    profile.rescue_team_category,
  );
  const subcategoryLabel = getDefenceSubcategoryLabel(
    profile.defence_subcategory,
  );
  const workspace = await getResponderWorkspace(supabase, profile.id);

  return (
    <ResponderDashboard
      roleTitle="Rescue team dashboard"
      intro="Accept approved requests your team can handle, then check this page for assignments."
      categoryLabel={categoryLabel}
      subcategoryLabel={subcategoryLabel}
      workspace={workspace}
    />
  );
}
