import { desc, eq } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { FeedbackManagementClient } from "./feedback-management-client";

export default async function FeedbackPage() {
  const authContext = await getAuthContext();
  if (!authContext) return null;

  // Get all feedback for this tenant
  const feedbackItems = await db
    .select()
    .from(feedback)
    .where(eq(feedback.tenantId, authContext.tenantId))
    .orderBy(desc(feedback.createdAt));

  // Calculate stats
  const stats = {
    total: feedbackItems.length,
    new: feedbackItems.filter((f) => f.status === "new").length,
    inProgress: feedbackItems.filter((f) => f.status === "in_progress").length,
    resolved: feedbackItems.filter((f) => f.status === "resolved").length,
  };

  return (
    <FeedbackManagementClient
      initialFeedback={feedbackItems}
      stats={stats}
      currentUserId={authContext.userId}
    />
  );
}
