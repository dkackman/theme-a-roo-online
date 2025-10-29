import { NextResponse, type NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // For now, just pass through all requests
  // Auth is handled client-side via AuthContext
  // If you need server-side auth in the future, you'll need to use cookies
  // instead of localStorage for session management
  return NextResponse.next();
}

// Specify which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
