/**
 * Server-Side Event Emitter
 *
 * In-memory event bus for emitting real-time events to connected SSE clients.
 * Uses a pub/sub pattern to notify clients when database events occur.
 *
 * IMPORTANT: This is an in-memory implementation suitable for single-server deployments.
 * For multi-server production deployments, replace with Redis Pub/Sub or similar.
 *
 * @example
 * ```typescript
 * // Server-side: Emit activity event
 * import { serverEventEmitter } from '@/lib/realtime/event-emitter';
 *
 * await db.insert(activityLogs).values({ ... });
 * serverEventEmitter.emit('tenant-123', {
 *   type: 'activity:new',
 *   data: { ... },
 * });
 *
 * // SSE route: Subscribe to tenant events
 * const cleanup = serverEventEmitter.subscribe(tenantId, (event) => {
 *   controller.enqueue(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
 * });
 * ```
 */

import type { RealtimeEvent } from "./client";

type EventCallback = (event: RealtimeEvent) => void;

/**
 * Server-side event emitter for real-time updates
 */
export class ServerEventEmitter {
  /**
   * Map of tenantId -> Set of event callbacks
   * Ensures multi-tenant isolation
   */
  private subscribers = new Map<string, Set<EventCallback>>();

  /**
   * Subscribe to events for a specific tenant
   *
   * @param tenantId - Tenant ID to subscribe to
   * @param callback - Callback function to handle events
   * @returns Cleanup function to unsubscribe
   */
  subscribe(tenantId: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(tenantId)) {
      this.subscribers.set(tenantId, new Set());
    }

    this.subscribers.get(tenantId)?.add(callback);

    // Return cleanup function
    return () => {
      const callbacks = this.subscribers.get(tenantId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(tenantId);
        }
      }
    };
  }

  /**
   * Emit event to all subscribers of a tenant
   *
   * @param tenantId - Tenant ID to emit to
   * @param event - Event to emit
   */
  emit(tenantId: string, event: RealtimeEvent): void {
    const callbacks = this.subscribers.get(tenantId);
    if (!callbacks || callbacks.size === 0) {
      return;
    }

    // Add timestamp if not present
    const eventWithTimestamp: RealtimeEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    // Notify all subscribers for this tenant
    callbacks.forEach((callback) => {
      try {
        callback(eventWithTimestamp);
      } catch (error) {
        console.error(
          `[ServerEventEmitter] Error in callback for tenant ${tenantId}:`,
          error,
        );
      }
    });
  }

  /**
   * Get active subscriber count for a tenant
   *
   * @param tenantId - Tenant ID
   * @returns Number of active subscribers
   */
  getSubscriberCount(tenantId: string): number {
    return this.subscribers.get(tenantId)?.size || 0;
  }

  /**
   * Get total active subscriber count across all tenants
   *
   * @returns Total number of active subscribers
   */
  getTotalSubscriberCount(): number {
    let total = 0;
    this.subscribers.forEach((callbacks) => {
      total += callbacks.size;
    });
    return total;
  }

  /**
   * Get all active tenant IDs
   *
   * @returns Array of tenant IDs with active subscribers
   */
  getActiveTenants(): string[] {
    return Array.from(this.subscribers.keys());
  }

  /**
   * Clear all subscribers for a tenant
   *
   * @param tenantId - Tenant ID to clear
   */
  clearTenant(tenantId: string): void {
    this.subscribers.delete(tenantId);
  }

  /**
   * Clear all subscribers
   */
  clearAll(): void {
    this.subscribers.clear();
  }
}

/**
 * Singleton server event emitter instance
 *
 * PRODUCTION NOTE: For multi-server deployments, replace this with Redis Pub/Sub:
 *
 * ```typescript
 * // lib/realtime/redis-event-emitter.ts
 * import { Redis } from '@upstash/redis';
 *
 * const redis = Redis.fromEnv();
 *
 * export const serverEventEmitter = {
 *   subscribe: (tenantId: string, callback: EventCallback) => {
 *     redis.subscribe(`tenant:${tenantId}`, (message) => {
 *       callback(JSON.parse(message));
 *     });
 *   },
 *   emit: (tenantId: string, event: RealtimeEvent) => {
 *     redis.publish(`tenant:${tenantId}`, JSON.stringify(event));
 *   },
 * };
 * ```
 */
export const serverEventEmitter = new ServerEventEmitter();
