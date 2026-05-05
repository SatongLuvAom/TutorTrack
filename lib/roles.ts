import { UserRole, type UserRole as UserRoleType } from "./generated/prisma/enums";

export function getDashboardPathForRole(role: UserRoleType): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/dashboard/admin";
    case UserRole.TUTOR:
      return "/dashboard/tutor";
    case UserRole.STUDENT:
      return "/dashboard/student";
    case UserRole.PARENT:
      return "/dashboard/parent";
  }
}

export function isUserRole(value: string): value is UserRoleType {
  return Object.values(UserRole).includes(value as UserRoleType);
}
