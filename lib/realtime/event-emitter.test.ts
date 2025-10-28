import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RealtimeEvent } from "./client";
import { ServerEventEmitter } from "./event-emitter";

describe("ServerEventEmitter", () => {
  let emitter: ServerEventEmitter;

  beforeEach(() => {
    emitter = new ServerEventEmitter();
  });

  describe("Multi-tenant Isolation", () => {
    it("should isolate events between different tenants", () => {
      const tenant1Events: RealtimeEvent[] = [];
      const tenant2Events: RealtimeEvent[] = [];

      // Subscribe to tenant 1
      emitter.subscribe("tenant-1", (event) => {
        tenant1Events.push(event);
      });

      // Subscribe to tenant 2
      emitter.subscribe("tenant-2", (event) => {
        tenant2Events.push(event);
      });

      // Emit event to tenant 1
      emitter.emit("tenant-1", {
        type: "activity:new",
        data: { message: "Tenant 1 activity" },
      });

      // Emit event to tenant 2
      emitter.emit("tenant-2", {
        type: "activity:new",
        data: { message: "Tenant 2 activity" },
      });

      // Verify isolation
      expect(tenant1Events).toHaveLength(1);
      expect(tenant2Events).toHaveLength(1);

      expect(tenant1Events[0].data).toEqual({ message: "Tenant 1 activity" });
      expect(tenant2Events[0].data).toEqual({ message: "Tenant 2 activity" });
    });

    it("should not leak events between tenants", () => {
      const tenant1Events: RealtimeEvent[] = [];
      const tenant2Events: RealtimeEvent[] = [];

      emitter.subscribe("tenant-1", (event) => {
        tenant1Events.push(event);
      });

      emitter.subscribe("tenant-2", (event) => {
        tenant2Events.push(event);
      });

      // Emit only to tenant 1
      emitter.emit("tenant-1", {
        type: "activity:new",
        data: { message: "Only for tenant 1" },
      });

      // Tenant 1 should receive event
      expect(tenant1Events).toHaveLength(1);

      // Tenant 2 should NOT receive event
      expect(tenant2Events).toHaveLength(0);
    });

    it("should support multiple subscribers per tenant", () => {
      const subscriber1Events: RealtimeEvent[] = [];
      const subscriber2Events: RealtimeEvent[] = [];

      // Multiple subscribers for same tenant
      emitter.subscribe("tenant-1", (event) => {
        subscriber1Events.push(event);
      });

      emitter.subscribe("tenant-1", (event) => {
        subscriber2Events.push(event);
      });

      emitter.emit("tenant-1", {
        type: "activity:new",
        data: { message: "Broadcast to all" },
      });

      // Both subscribers should receive the event
      expect(subscriber1Events).toHaveLength(1);
      expect(subscriber2Events).toHaveLength(1);

      expect(subscriber1Events[0].data).toEqual({
        message: "Broadcast to all",
      });
      expect(subscriber2Events[0].data).toEqual({
        message: "Broadcast to all",
      });
    });
  });

  describe("Subscription Management", () => {
    it("should return cleanup function from subscribe", () => {
      const events: RealtimeEvent[] = [];

      const cleanup = emitter.subscribe("tenant-1", (event) => {
        events.push(event);
      });

      emitter.emit("tenant-1", {
        type: "test",
        data: { count: 1 },
      });

      expect(events).toHaveLength(1);

      // Call cleanup
      cleanup();

      // Should not receive new events
      emitter.emit("tenant-1", {
        type: "test",
        data: { count: 2 },
      });

      expect(events).toHaveLength(1); // Still 1
    });

    it("should remove tenant when last subscriber unsubscribes", () => {
      const cleanup1 = emitter.subscribe("tenant-1", () => {});
      const cleanup2 = emitter.subscribe("tenant-1", () => {});

      expect(emitter.getSubscriberCount("tenant-1")).toBe(2);

      cleanup1();
      expect(emitter.getSubscriberCount("tenant-1")).toBe(1);

      cleanup2();
      expect(emitter.getSubscriberCount("tenant-1")).toBe(0);
      expect(emitter.getActiveTenants()).not.toContain("tenant-1");
    });
  });

  describe("Event Emission", () => {
    it("should add timestamp to events if not present", () => {
      const events: RealtimeEvent[] = [];

      emitter.subscribe("tenant-1", (event) => {
        events.push(event);
      });

      emitter.emit("tenant-1", {
        type: "test",
        data: {},
      });

      expect(events[0].timestamp).toBeDefined();
      expect(typeof events[0].timestamp).toBe("number");
    });

    it("should preserve existing timestamp", () => {
      const events: RealtimeEvent[] = [];
      const customTimestamp = 1234567890;

      emitter.subscribe("tenant-1", (event) => {
        events.push(event);
      });

      emitter.emit("tenant-1", {
        type: "test",
        data: {},
        timestamp: customTimestamp,
      });

      expect(events[0].timestamp).toBe(customTimestamp);
    });

    it("should not emit if tenant has no subscribers", () => {
      const consoleSpy = vi.spyOn(console, "error");

      // Emit to tenant with no subscribers
      emitter.emit("tenant-999", {
        type: "test",
        data: {},
      });

      // Should not error
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should handle errors in callbacks without affecting other subscribers", () => {
      const consoleSpy = vi.spyOn(console, "error");
      const goodEvents: RealtimeEvent[] = [];

      // Subscriber that throws error
      emitter.subscribe("tenant-1", () => {
        throw new Error("Subscriber error");
      });

      // Subscriber that works
      emitter.subscribe("tenant-1", (event) => {
        goodEvents.push(event);
      });

      emitter.emit("tenant-1", {
        type: "test",
        data: { message: "Test event" },
      });

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error in callback"),
        expect.any(Error),
      );

      // Good subscriber should still receive event
      expect(goodEvents).toHaveLength(1);
    });
  });

  describe("Statistics", () => {
    it("should track subscriber count per tenant", () => {
      expect(emitter.getSubscriberCount("tenant-1")).toBe(0);

      const cleanup1 = emitter.subscribe("tenant-1", () => {});
      expect(emitter.getSubscriberCount("tenant-1")).toBe(1);

      const cleanup2 = emitter.subscribe("tenant-1", () => {});
      expect(emitter.getSubscriberCount("tenant-1")).toBe(2);

      cleanup1();
      expect(emitter.getSubscriberCount("tenant-1")).toBe(1);

      cleanup2();
      expect(emitter.getSubscriberCount("tenant-1")).toBe(0);
    });

    it("should track total subscriber count", () => {
      expect(emitter.getTotalSubscriberCount()).toBe(0);

      const cleanup1 = emitter.subscribe("tenant-1", () => {});
      const cleanup2 = emitter.subscribe("tenant-2", () => {});
      const cleanup3 = emitter.subscribe("tenant-2", () => {});

      expect(emitter.getTotalSubscriberCount()).toBe(3);

      cleanup1();
      expect(emitter.getTotalSubscriberCount()).toBe(2);

      cleanup2();
      cleanup3();
      expect(emitter.getTotalSubscriberCount()).toBe(0);
    });

    it("should list active tenants", () => {
      expect(emitter.getActiveTenants()).toEqual([]);

      const cleanup1 = emitter.subscribe("tenant-1", () => {});
      const cleanup2 = emitter.subscribe("tenant-2", () => {});

      const activeTenants = emitter.getActiveTenants();
      expect(activeTenants).toHaveLength(2);
      expect(activeTenants).toContain("tenant-1");
      expect(activeTenants).toContain("tenant-2");

      cleanup1();
      expect(emitter.getActiveTenants()).toEqual(["tenant-2"]);

      cleanup2();
      expect(emitter.getActiveTenants()).toEqual([]);
    });
  });

  describe("Cleanup Operations", () => {
    it("should clear all subscribers for a tenant", () => {
      emitter.subscribe("tenant-1", () => {});
      emitter.subscribe("tenant-1", () => {});

      expect(emitter.getSubscriberCount("tenant-1")).toBe(2);

      emitter.clearTenant("tenant-1");

      expect(emitter.getSubscriberCount("tenant-1")).toBe(0);
      expect(emitter.getActiveTenants()).not.toContain("tenant-1");
    });

    it("should clear all subscribers across all tenants", () => {
      emitter.subscribe("tenant-1", () => {});
      emitter.subscribe("tenant-2", () => {});
      emitter.subscribe("tenant-3", () => {});

      expect(emitter.getTotalSubscriberCount()).toBe(3);

      emitter.clearAll();

      expect(emitter.getTotalSubscriberCount()).toBe(0);
      expect(emitter.getActiveTenants()).toEqual([]);
    });
  });

  describe("Performance & Scalability", () => {
    it("should handle many subscribers efficiently", () => {
      const subscriberCount = 1000;
      const cleanups: (() => void)[] = [];

      // Add many subscribers
      for (let i = 0; i < subscriberCount; i++) {
        const cleanup = emitter.subscribe(`tenant-${i % 10}`, () => {});
        cleanups.push(cleanup);
      }

      expect(emitter.getTotalSubscriberCount()).toBe(subscriberCount);

      // Emit events (should not timeout)
      for (let i = 0; i < 10; i++) {
        emitter.emit(`tenant-${i}`, {
          type: "test",
          data: {},
        });
      }

      // Cleanup
      cleanups.forEach((cleanup) => {
        cleanup();
      });
      expect(emitter.getTotalSubscriberCount()).toBe(0);
    });

    it("should handle rapid event emission", () => {
      const events: RealtimeEvent[] = [];

      emitter.subscribe("tenant-1", (event) => {
        events.push(event);
      });

      // Emit many events rapidly
      const eventCount = 1000;
      for (let i = 0; i < eventCount; i++) {
        emitter.emit("tenant-1", {
          type: "test",
          data: { count: i },
        });
      }

      expect(events).toHaveLength(eventCount);

      // Verify all events received in order
      for (let i = 0; i < eventCount; i++) {
        expect((events[i].data as { count: number }).count).toBe(i);
      }
    });
  });
});
