import { NextRequest, NextResponse } from "next/server";
import { registerSchema, registerUser } from "@/lib/auth";
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

function redirectToRegister(
  request: NextRequest,
  error: string,
  retryAfterSeconds?: number,
): NextResponse {
  const url = getTrustedRequestUrl(request, "/auth/register");
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, { status: 303 });

  if (retryAfterSeconds) {
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }

  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return redirectToRegister(request, "invalid");
  }

  const rateLimit = checkRateLimit({
    key: getClientRateLimitKey(request, "auth:register"),
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return redirectToRegister(
      request,
      "rate_limited",
      rateLimit.retryAfterSeconds,
    );
  }

  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return redirectToRegister(request, "invalid");
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return redirectToRegister(
      request,
      result.reason === "EMAIL_EXISTS" ? "exists" : "failed",
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
