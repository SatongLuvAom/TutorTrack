import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & {
  tutorTrackPrisma?: PrismaClient;
};

export function getDb() {
  if (globalForPrisma.tutorTrackPrisma) {
    return globalForPrisma.tutorTrackPrisma;
  }

  const { DATABASE_URL } = getServerEnv();
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.tutorTrackPrisma = prisma;
  }

  return prisma;
}
