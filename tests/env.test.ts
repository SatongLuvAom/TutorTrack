import { describe, expect, it } from "vitest";
import { serverEnvSchema } from "../lib/validators/env";

describe("serverEnvSchema", () => {
  it("accepts the required Phase 1 environment", () => {
    const env = serverEnvSchema.parse({
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/tutortrack?schema=public",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      AUTH_SECRET: "test-auth-secret-for-tutortrack-env",
    });

    expect(env.DATABASE_URL).toContain("tutortrack");
  });

  it("rejects non-PostgreSQL database URLs", () => {
    expect(() =>
      serverEnvSchema.parse({
        DATABASE_URL: "mysql://user:password@localhost:3306/tutortrack",
        AUTH_SECRET: "test-auth-secret-for-tutortrack-env",
      }),
    ).toThrow("DATABASE_URL must be a PostgreSQL connection string.");
  });
});
