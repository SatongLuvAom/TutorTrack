import { describe, expect, it, vi } from "vitest";
import { UserRole } from "../lib/generated/prisma/enums";
import {
  canUseLegacyDemoPassword,
  DEMO_PASSWORD,
  LEGACY_DEMO_PASSWORD_HASH,
  verifyPassword,
} from "../lib/password";
import { checkRateLimit } from "../lib/rate-limit";
import {
  getTrustedRequestUrl,
  isSameOriginRequest,
} from "../lib/request-security";
import { createSessionToken, verifySessionToken } from "../lib/session";

function requestLike(url: string, headers: Record<string, string>) {
  return {
    url,
    headers: new Headers(headers),
  };
}

describe("request origin checks", () => {
  it("accepts same-origin auth mutations", () => {
    const request = requestLike("http://localhost:3000/api/auth/login", {
      origin: "http://localhost:3000",
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("accepts same-port loopback origins in local development", () => {
    const request = requestLike("http://localhost:3001/api/auth/login", {
      origin: "http://127.0.0.1:3001",
    });

    expect(isSameOriginRequest(request)).toBe(true);
    expect(getTrustedRequestUrl(request, "/dashboard/tutor").origin).toBe(
      "http://127.0.0.1:3001",
    );
  });

  it("rejects cross-origin and missing-origin auth mutations", () => {
    expect(
      isSameOriginRequest(
        requestLike("http://localhost:3000/api/auth/login", {
          origin: "https://evil.example",
        }),
      ),
    ).toBe(false);

    expect(
      isSameOriginRequest(
        requestLike("http://localhost:3000/api/auth/login", {}),
      ),
    ).toBe(false);
  });
});

describe("password and session hardening", () => {
  it("only accepts legacy demo hashes when explicitly allowed", async () => {
    await expect(
      verifyPassword(DEMO_PASSWORD, LEGACY_DEMO_PASSWORD_HASH),
    ).resolves.toBe(false);
    await expect(
      verifyPassword(DEMO_PASSWORD, LEGACY_DEMO_PASSWORD_HASH, {
        allowLegacyDemoHash: true,
      }),
    ).resolves.toBe(true);
  });

  it("does not allow legacy demo password fallback in production by default", () => {
    try {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ALLOW_DEMO_PASSWORD_LOGIN", "false");

      expect(canUseLegacyDemoPassword("student1@tutortrack.test")).toBe(false);

      vi.stubEnv("ALLOW_DEMO_PASSWORD_LOGIN", "true");
      expect(canUseLegacyDemoPassword("student1@tutortrack.test")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects malformed session tokens", () => {
    const token = createSessionToken({
      userId: "user-1",
      email: "student@example.com",
      role: UserRole.STUDENT,
      expiresAt: Date.now() + 60_000,
    });

    expect(verifySessionToken(`${token}.extra`)).toBeNull();
    expect(verifySessionToken("not-a-session-token")).toBeNull();
  });
});

describe("rate limiting", () => {
  it("blocks requests after the configured window limit", () => {
    const options = {
      key: "test:rate-limit",
      limit: 2,
      now: 1_000,
      windowMs: 60_000,
    };

    expect(checkRateLimit(options).allowed).toBe(true);
    expect(checkRateLimit(options).allowed).toBe(true);
    expect(checkRateLimit(options).allowed).toBe(false);
  });

  it("resets counts after the configured window", () => {
    const options = {
      key: "test:rate-limit-reset",
      limit: 1,
      now: 1_000,
      windowMs: 60_000,
    };

    expect(checkRateLimit(options).allowed).toBe(true);
    expect(checkRateLimit(options).allowed).toBe(false);
    expect(
      checkRateLimit({
        ...options,
        now: 61_001,
      }).allowed,
    ).toBe(true);
  });
});
