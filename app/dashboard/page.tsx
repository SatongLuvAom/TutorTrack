import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardPathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  redirect(getDashboardPathForRole(user.role));
}
