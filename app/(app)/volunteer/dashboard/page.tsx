import type { Metadata } from "next";

import { ResponderDashboard } from "@/components/responder/responder-dashboard";
import { requireActiveResponder } from "@/lib/auth/dal";
import { getResponderWorkspace } from "@/lib/requests/data";

export const metadata: Metadata = {
  title: "Volunteer dashboard",
  description: "Your Crisis Connect volunteer dashboard.",
};

// This page blocks on the volunteer session, so it cannot render an instant shell.
export const instant = false;

export default async function VolunteerDashboardPage() {
  const { supabase, profile } = await requireActiveResponder("volunteer");
  const workspace = await getResponderWorkspace(supabase, profile.id);

  return (
    <ResponderDashboard
      roleTitle="Volunteer dashboard"
      intro="Accept approved requests when you can respond, then check this page for assignments."
      workspace={workspace}
    />
  );
}
