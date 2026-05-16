import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, loginSchema } from "@/lib/auth";
import { getDashboardPathForRole } from "@/lib/roles";
import {
  createSessionPayload,
  setSessionCookieOnResponse,
} from "@/lib/session";
import {
  getTrustedRequestUrl,
  isSameOriginRequest,
} from "@/lib/request-security";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";

function redirectToLogin(
  request: NextRequest,
  error: string,
  retryAfterSeconds?: number,
): NextResponse {
  const url = getTrustedRequestUrl(request, "/auth/login");
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, { status: 303 });

  if (retryAfterSeconds) {
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }

  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return redirectToLogin(request, "invalid");
  }

  const rateLimit = checkRateLimit({
    key: getClientRateLimitKey(request, "auth:login"),
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return redirectToLogin(
      request,
      "rate_limited",
      rateLimit.retryAfterSeconds,
    );
  }

  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return redirectToLogin(request, "invalid");
  }

  const result = await authenticateUser(parsed.data);
  if (!result.ok) {
    return redirectToLogin(
      request,
      result.reason === "SUSPENDED" ? "suspended" : "invalid",
    );
  }

  const url = getTrustedRequestUrl(
    request,
    getDashboardPathForRole(result.user.role),
  );
  const response = NextResponse.redirect(url, { status: 303 });
  setSessionCookieOnResponse(response, createSessionPayload(result.user));

  return response;
}
