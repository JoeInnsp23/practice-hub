import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UserDetailsClient } from "./user-details-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/sign-in");
  }

  if (authContext.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;

  // Fetch user details
  const [user] = (await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, authContext.tenantId)))
    .limit(1)) as (typeof users.$inferSelect)[];

  if (!user) {
    notFound();
  }

  // Activity logs are now fetched client-side via tRPC with search and pagination
  return <UserDetailsClient user={user} currentUserId={authContext.userId} />;
}
