import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicPaths = ["/", "/sign-in", "/sign-up"];
const authApiPath = "/api/auth";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicPaths.some((path) => pathname === path)) {
    return NextResponse.next();
  }

  // Allow auth API routes
  if (pathname.startsWith(authApiPath)) {
    return NextResponse.next();
  }

  // Allow other API routes (they handle auth internally via tRPC)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check session for protected routes
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      // No session - redirect to sign-in
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Session exists - allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);
    // On error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
