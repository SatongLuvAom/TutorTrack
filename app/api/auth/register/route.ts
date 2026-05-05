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

function redirectToRegister(request: NextRequest, error: string): NextResponse {
  const url = getTrustedRequestUrl(request, "/auth/register");
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return redirectToRegister(request, "invalid");
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
