import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
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
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, authContext.tenantId)))
    .limit(1);

  if (!user) {
    notFound();
  }

  // Fetch user activity logs
  const logs = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.tenantId, authContext.tenantId),
        eq(activityLogs.userId, id),
      ),
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(20);

  return (
    <UserDetailsClient
      user={user}
      activityLogs={logs}
      currentUserId={authContext.userId}
    />
  );
}
