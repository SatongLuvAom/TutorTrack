import { z } from "zod";

function isPostgresConnectionString(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().refine(isPostgresConnectionString, {
    message: "DATABASE_URL must be a PostgreSQL connection string.",
  }),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, {
    message: "AUTH_SECRET must be at least 32 characters long.",
  }),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
