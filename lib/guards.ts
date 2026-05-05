import { redirect } from "next/navigation";
import { UserRole, type UserRole as UserRoleType } from "./generated/prisma/enums";
import { getCurrentUser, type CurrentUser } from "./current-user";
import { getDashboardPathForRole } from "./roles";

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireRole(role: UserRoleType): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== role) {
    redirect(getDashboardPathForRole(user.role));
  }

  return user;
}

export function requireAdmin(): Promise<CurrentUser> {
  return requireRole(UserRole.ADMIN);
}

export function requireTutor(): Promise<CurrentUser> {
  return requireRole(UserRole.TUTOR);
}

export function requireStudent(): Promise<CurrentUser> {
  return requireRole(UserRole.STUDENT);
}

export function requireParent(): Promise<CurrentUser> {
  return requireRole(UserRole.PARENT);
}

export async function requirePermission(
  condition: boolean | Promise<boolean>,
): Promise<void> {
  if (!(await condition)) {
    redirect("/forbidden");
  }
}
