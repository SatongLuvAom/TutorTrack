import { DashboardShell } from "@/components/dashboard-shell";
import { requireStudent } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await requireStudent();

  return <DashboardShell title="Student Dashboard" user={user} />;
}
