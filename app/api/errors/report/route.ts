import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    const errorData = await req.json();

    // Log error to database
    if (authContext) {
      await db.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "error",
        entityId: null,
        action: "client_error",
        description: errorData.message || "Client-side error occurred",
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        metadata: {
          ...errorData,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // In production, you would send this to a service like Sentry
    if (process.env.NODE_ENV === "production") {
      // await sendToSentry(errorData);
      // await sendToLogRocket(errorData);
    }

    // Log to server console for debugging
    console.error("Client Error Report:", {
      ...errorData,
      userId: authContext?.userId,
      tenantId: authContext?.tenantId,
    });

    return NextResponse.json({
      success: true,
      message: "Error reported successfully"
    });
  } catch (error) {
    console.error("Failed to report error:", error);
    return NextResponse.json(
      { error: "Failed to report error" },
      { status: 500 }
    );
  }
}