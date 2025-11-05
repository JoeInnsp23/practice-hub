import { redirect } from "next/navigation";
import { LandingPageContent } from "@/components/landing/landing-page-content";
import { auth } from "@/lib/auth";

/**
 * Landing page for unauthenticated users.
 *
 * - Redirects authenticated users to /practice-hub
 * - Shows landing page to unauthenticated users
 * - Includes hero, features, benefits, trust sections
 * - Mobile responsive with dark mode support
 */
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  // Redirect authenticated users to practice hub
  if (session?.user) {
    redirect("/practice-hub");
  }

  // Show landing page to unauthenticated users
  return (
    <main id="main-content">
      <LandingPageContent />
    </main>
  );
}
