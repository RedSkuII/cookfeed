import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication to access
function isProtectedRoute(pathname: string): boolean {
  // Own profile (exact) — /profile/[id] is public, only /profile itself is protected
  if (pathname === "/profile") return true;
  if (pathname === "/profile/edit") return true;
  // Recipe creation
  if (pathname === "/recipe/add") return true;
  // Favorites
  if (pathname === "/favorites" || pathname.startsWith("/favorites/")) return true;
  // Settings
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isProtectedRoute(pathname) && !req.auth) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    // Match app routes, skip API, static files, auth pages, and Next internals
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|auth).*)",
  ],
};
