import { z } from "zod";
import {
  TutorVerificationStatus,
  UserRole,
  UserStatus,
  type UserRole as UserRoleType,
} from "./generated/prisma/enums";
import { getDb } from "./db";
import {
  canUseLegacyDemoPassword,
  hashPassword,
  LEGACY_DEMO_PASSWORD_HASH,
  verifyPassword,
} from "./password";

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum([UserRole.STUDENT, UserRole.PARENT, UserRole.TUTOR]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  status: UserStatus;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | {
      ok: false;
      reason: "INVALID_CREDENTIALS" | "SUSPENDED" | "EMAIL_EXISTS";
    };

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function authenticateUser(
  input: LoginInput,
): Promise<AuthResult> {
  const user = await getDb().user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash, {
    allowLegacyDemoHash:
      user.passwordHash === LEGACY_DEMO_PASSWORD_HASH &&
      canUseLegacyDemoPassword(user.email),
  });
  if (!passwordMatches) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  if (user.status !== UserStatus.ACTIVE) {
    return { ok: false, reason: "SUSPENDED" };
  }

  return { ok: true, user: toAuthUser(user) };
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthResult> {
  const db = getDb();
  const existingUser = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false, reason: "EMAIL_EXISTS" };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (input.role === UserRole.STUDENT) {
      await tx.studentProfile.create({
        data: {
          userId: createdUser.id,
          displayName: input.name,
        },
      });
    }

    if (input.role === UserRole.PARENT) {
      await tx.parentProfile.create({
        data: {
          userId: createdUser.id,
          displayName: input.name,
        },
      });
    }

    if (input.role === UserRole.TUTOR) {
      await tx.tutorProfile.create({
        data: {
          userId: createdUser.id,
          headline: "TutorTrack tutor",
          verificationStatus: TutorVerificationStatus.PENDING,
        },
      });
    }

    return createdUser;
  });

  return { ok: true, user: toAuthUser(user) };
}
