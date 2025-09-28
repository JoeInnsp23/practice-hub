import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  const authContext = await getAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connectionId = `${authContext.tenantId}-${authContext.userId}-${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this connection
      connections.set(connectionId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", connectionId })}\n\n`)
      );

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`)
          );
        } catch (error) {
          clearInterval(heartbeatInterval);
          connections.delete(connectionId);
        }
      }, 30000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        connections.delete(connectionId);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}

// Helper function to broadcast events to all connections in a tenant
export function broadcastToTenant(tenantId: string, event: any) {
  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  connections.forEach((controller, connectionId) => {
    if (connectionId.startsWith(tenantId)) {
      try {
        controller.enqueue(message);
      } catch {
        // Connection might be closed, remove it
        connections.delete(connectionId);
      }
    }
  });
}

// Helper function to send event to specific user
export function sendToUser(tenantId: string, userId: string, event: any) {
  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  connections.forEach((controller, connectionId) => {
    if (connectionId.startsWith(`${tenantId}-${userId}`)) {
      try {
        controller.enqueue(message);
      } catch {
        connections.delete(connectionId);
      }
    }
  });
}