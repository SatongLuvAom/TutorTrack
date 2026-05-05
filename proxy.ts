import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "tutortrack_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) &&
    !request.cookies.get(SESSION_COOKIE_NAME)?.value
  ) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
