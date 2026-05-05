import { UserStatus } from "./generated/prisma/enums";
import type { UserRole } from "./generated/prisma/enums";
import { getDb } from "./db";
import { getSessionFromCookies } from "./session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  studentProfileId: string | null;
  parentProfileId: string | null;
  tutorProfileId: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionFromCookies();

  if (!session) {
    return null;
  }

  const user = await getDb().user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      studentProfile: { select: { id: true } },
      parentProfile: { select: { id: true } },
      tutorProfile: { select: { id: true } },
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return null;
  }

  if (user.email !== session.email || user.role !== session.role) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    studentProfileId: user.studentProfile?.id ?? null,
    parentProfileId: user.parentProfile?.id ?? null,
    tutorProfileId: user.tutorProfile?.id ?? null,
  };
}
