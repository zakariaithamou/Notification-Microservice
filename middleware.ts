import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSession = req.cookies.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname === "/api/departments") {
    const apiKey = req.headers.get("x-api-key");
    const adminKey = process.env.ADMIN_API_KEY;

    if (!apiKey || apiKey !== adminKey) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Invalid or missing Admin Key" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/departments",
    "/api/departments/:path*",
    "/api/templates/:path*",
    "/api/notifications/:path*",
    "/api/v1/:path*",
    "/api/students/:path*",
  ],
};
