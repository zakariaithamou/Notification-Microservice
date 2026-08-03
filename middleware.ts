import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 1. Read the API key from the headers
  const apiKey = req.headers.get("x-api-key");
  const { pathname } = req.nextUrl;

  // 2. Block instantly if no key is provided
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED: Missing x-api-key header" },
      { status: 401 },
    );
  }

  // 3. ADMIN ROUTE: If accessing /api/departments, require the Master Admin Key
  if (pathname === "/api/departments") {
    const adminKey = process.env.ADMIN_API_KEY;

    if (apiKey !== adminKey) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Invalid Admin Key" },
        { status: 403 },
      );
    }
    // Master key matches! Let them create the department.
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/departments/")) {
    return NextResponse.next();
  }
  // 4. DEPARTMENT ROUTES: Templates & Notifications
  // If it's not a department route, let the request pass through.
  // Your Layer 2 (verifyApiKey utility) will check the database and bcrypt hash.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/departments",
    "/api/departments/:path*",
    "/api/templates/:path*",
    "/api/notifications/:path*",
    "/api/v1/:path*",
    "/api/students/:path*",
  ],
};
