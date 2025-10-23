import { NextResponse } from "next/server";
import { auth, getAuthContext } from "@/lib/auth";
import { serverEventEmitter } from "@/lib/realtime/event-emitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE Endpoint for Real-time Activity Feed
 *
 * Provides Server-Sent Events (SSE) stream for real-time updates:
 * - Activity feed events (activity:new)
 * - Notification events (notification:new)
 * - Heartbeat pings (ping)
 *
 * Features:
 * - Session-based authentication
 * - Multi-tenant isolation (events scoped to tenantId)
 * - Heartbeat mechanism (30s interval)
 * - Graceful connection cleanup
 *
 * @example Client Usage:
 * ```typescript
 * const eventSource = new EventSource('/api/activity/stream');
 *
 * eventSource.addEventListener('activity:new', (event) => {
 *   const activity = JSON.parse(event.data);
 *   console.log('New activity:', activity);
 * });
 *
 * eventSource.addEventListener('ping', () => {
 *   console.log('Heartbeat received');
 * });
 * ```
 */
export async function GET(request: Request) {
  // Authenticate request
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const authContext = await getAuthContext();

  if (!authContext) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { tenantId, userId } = authContext;

  console.log(`[SSE] Client connected - User: ${userId}, Tenant: ${tenantId}`);

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectionEvent = `event: connected\ndata: ${JSON.stringify({
        tenantId,
        userId,
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionEvent));

      // Heartbeat interval (30s)
      const heartbeatInterval = setInterval(() => {
        try {
          const ping = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch (error) {
          console.error("[SSE] Heartbeat error:", error);
        }
      }, 30000);

      // Subscribe to tenant events
      const cleanup = serverEventEmitter.subscribe(tenantId, (event) => {
        try {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("[SSE] Event emission error:", error);
        }
      });

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        console.log(
          `[SSE] Client disconnected - User: ${userId}, Tenant: ${tenantId}`,
        );
        clearInterval(heartbeatInterval);
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

/**
 * Polling Fallback Endpoint
 *
 * Provides polling-based updates when SSE is unavailable.
 * Returns recent events for the authenticated user's tenant.
 *
 * Query parameter: ?poll=1
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/activity/stream?poll=1');
 * const events = await response.json();
 * ```
 */
export async function POST(request: Request) {
  // Authenticate request
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const authContext = await getAuthContext();

  if (!authContext) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // For polling, we would typically fetch recent events from database
  // For now, return empty array (polling will be enhanced when needed)
  return NextResponse.json([]);
}
