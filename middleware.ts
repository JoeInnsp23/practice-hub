import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientPortalAuth } from "@/lib/client-portal-auth";

// Public paths for staff authentication
const publicPaths = ["/", "/sign-in", "/sign-up", "/accept-invitation"];
const authApiPath = "/api/auth";

// Public paths for client portal authentication
const clientPortalPublicPaths = [
  "/portal/sign-in",
  "/portal/sign-up",
  "/portal/accept",
];
const clientPortalApiPath = "/api/client-portal-auth";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (staff)
  if (publicPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Allow client portal public routes
  if (clientPortalPublicPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Allow accept-invitation with token parameter (staff)
  if (pathname.startsWith("/accept-invitation/")) {
    return NextResponse.next();
  }

  // Allow client portal accept-invitation
  if (pathname.startsWith("/portal/accept/")) {
    return NextResponse.next();
  }

  // Allow public proposal signature pages
  if (pathname.startsWith("/proposals/sign/")) {
    return NextResponse.next();
  }

  // Allow auth API routes (both staff and client portal)
  if (
    pathname.startsWith(authApiPath) ||
    pathname.startsWith(clientPortalApiPath)
  ) {
    return NextResponse.next();
  }

  // Allow other API routes (they handle auth internally via tRPC)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Determine which auth system to use based on pathname
  const isClientPortal = pathname.startsWith("/portal");

  // Check session for protected routes
  try {
    if (isClientPortal) {
      // Client Portal authentication
      const session = await clientPortalAuth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // No session - redirect to client portal sign-in
        const signInUrl = new URL("/portal/sign-in", request.url);
        signInUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Session exists - allow access
      return NextResponse.next();
    } else {
      // Staff authentication
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // No session - redirect to staff sign-in
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Session exists - allow access
      return NextResponse.next();
    }
  } catch (error) {
    console.error("Middleware auth error:", error);
    // On error, redirect to appropriate sign-in
    const signInPath = isClientPortal ? "/portal/sign-in" : "/sign-in";
    return NextResponse.redirect(new URL(signInPath, request.url));
  }
}

export const config = {
  runtime: "nodejs",
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
