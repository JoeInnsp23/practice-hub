import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await requireAdmin();
    const body = await req.json();
    const { id } = await params;

    const updatedFeedback = await db
      .update(feedback)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(feedback.id, id),
          eq(feedback.tenantId, authContext.tenantId),
        ),
      )
      .returning();

    if (updatedFeedback.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, feedback: updatedFeedback[0] });
  } catch (error) {
    console.error("Feedback API: Failed to update feedback", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 },
    );
  }
}
