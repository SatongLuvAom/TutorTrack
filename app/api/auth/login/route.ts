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

function redirectToLogin(request: NextRequest, error: string): NextResponse {
  const url = getTrustedRequestUrl(request, "/auth/login");
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return redirectToLogin(request, "invalid");
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
