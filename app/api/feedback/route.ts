import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Build filters
    const filters = [eq(feedback.tenantId, authContext.tenantId)];

    const status = searchParams.get("status");
    if (status && status !== "all") {
      filters.push(eq(feedback.status, status));
    }

    const type = searchParams.get("type");
    if (type && type !== "all") {
      filters.push(eq(feedback.type, type));
    }

    const priority = searchParams.get("priority");
    if (priority && priority !== "all") {
      filters.push(eq(feedback.priority, priority));
    }

    const search = searchParams.get("search");
    if (search) {
      filters.push(
        or(
          ilike(feedback.title, `%${search}%`),
          ilike(feedback.description, `%${search}%`),
        )!,
      );
    }

    const feedbackItems = await db
      .select()
      .from(feedback)
      .where(and(...filters))
      .orderBy(desc(feedback.createdAt));

    return NextResponse.json({ feedback: feedbackItems });
  } catch (error) {
    console.error("Feedback API: Failed to fetch feedback", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.type || !body.title || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, description" },
        { status: 400 },
      );
    }

    const newFeedback = await db
      .insert(feedback)
      .values({
        tenantId: authContext.tenantId,
        userId: user.id,
        userEmail: authContext.email,
        userName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "",
        userRole: authContext.role,
        type: body.type,
        title: body.title,
        description: body.description,
        category: body.category,
        consoleLogs: body.consoleLogs ? JSON.stringify(body.consoleLogs) : null,
        userAgent: body.userAgent,
        pageUrl: body.pageUrl,
        screenshot: body.screenshot,
        status: "new",
        priority: body.priority || "medium",
      })
      .returning();

    return NextResponse.json({ success: true, feedback: newFeedback[0] });
  } catch (error) {
    console.error("Feedback API: Failed to create feedback", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 },
    );
  }
}
