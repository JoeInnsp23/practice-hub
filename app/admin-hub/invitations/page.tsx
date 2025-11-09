import { redirect } from "next/navigation";

/**
 * Invitations Page - Deprecated
 *
 * This page has been merged into the unified User Management page.
 * All invitation functionality is now available at /admin-hub/users
 * via the filter dropdown (Pending Invitations / Invitation History).
 *
 * This redirect preserves backward compatibility for any bookmarks or links.
 */
export default function InvitationsRedirect() {
  redirect("/admin-hub/users");
}
