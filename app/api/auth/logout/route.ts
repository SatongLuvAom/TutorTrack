import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/lib/session";
import {
  getTrustedRequestUrl,
  isSameOriginRequest,
} from "@/lib/request-security";

function logoutResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    getTrustedRequestUrl(request, "/auth/login"),
    { status: 303 },
  );
  clearSessionCookieOnResponse(response);

  return response;
}

export function GET(): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export function POST(request: NextRequest): NextResponse {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return logoutResponse(request);
}
