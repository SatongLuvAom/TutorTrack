import { DashboardShell } from "@/components/dashboard-shell";
import { requireTutor } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function TutorDashboardPage() {
  const user = await requireTutor();

  return <DashboardShell title="Tutor Dashboard" user={user} />;
}
