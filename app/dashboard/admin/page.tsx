import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  return <DashboardShell title="Admin Dashboard" user={user} />;
}
