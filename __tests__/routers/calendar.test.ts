/**
 * Calendar Router Tests
 *
 * Tests for the calendar tRPC router
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calendarRouter } from "@/app/server/routers/calendar";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";
import {
  type TestDataTracker,
  cleanupTestData,
  createTestCalendarEvent,
  createTestTenant,
  createTestUser,
} from "../helpers/factories";

describe("app/server/routers/calendar.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof calendarRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    calendarEvents: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(calendarRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.calendarEvents = [];
  });

  describe("listEvents", () => {
    it("should accept empty input", async () => {
      await expect(caller.listEvents({})).resolves.not.toThrow();
    });

    it("should accept date range filters", async () => {
      await expect(
        caller.listEvents({
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-31"),
        }),
      ).resolves.not.toThrow();
    });

    it("should accept type filter", async () => {
      await expect(
        caller.listEvents({
          type: "meeting",
        }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid type enum values", async () => {
      await expect(
        caller.listEvents({
          type: "invalid_type" as unknown as "meeting",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getEvent", () => {
    it("should reject missing eventId field", async () => {
      await expect(
        caller.getEvent({} as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid event ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.getEvent({
          eventId: event.id,
        }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid UUID format", async () => {
      await expect(
        caller.getEvent({
          eventId: "not-a-uuid",
        }),
      ).rejects.toThrow();
    });
  });

  describe("createEvent", () => {
    it("should reject missing required fields", async () => {
      await expect(
        caller.createEvent({
          description: "Test event",
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid event data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const result = await caller.createEvent({
        title: "Team Meeting",
        type: "meeting" as const,
        startTime: new Date("2025-01-15T09:00:00Z"),
        endTime: new Date("2025-01-15T10:00:00Z"),
      });

      tracker.calendarEvents?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const result = await caller.createEvent({
        title: "Client Consultation",
        description: "Discuss quarterly results",
        type: "meeting" as const,
        startTime: new Date("2025-01-20T14:00:00Z"),
        endTime: new Date("2025-01-20T15:00:00Z"),
        allDay: false,
        location: "Conference Room A",
        // clientId is optional - omit instead of null
        reminderMinutes: 15,
        isRecurring: false,
      });

      tracker.calendarEvents?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept all-day events", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const result = await caller.createEvent({
        title: "Company Holiday",
        type: "out_of_office" as const,
        startTime: new Date("2025-12-25T00:00:00Z"),
        endTime: new Date("2025-12-25T23:59:59Z"),
        allDay: true,
      });

      tracker.calendarEvents?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("updateEvent", () => {
    it("should reject missing eventId field", async () => {
      await expect(
        caller.updateEvent({
          title: "Updated Event",
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.updateEvent({
          eventId: event.id,
          title: "Updated Meeting Title",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.updateEvent({
          eventId: event.id,
          location: "Virtual Meeting - Zoom",
          reminderMinutes: 30,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("deleteEvent", () => {
    it("should reject missing eventId field", async () => {
      await expect(
        caller.deleteEvent({} as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid event ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.deleteEvent({
          eventId: event.id,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("respondToInvitation", () => {
    it("should reject missing status field", async () => {
      await expect(
        caller.respondToInvitation({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid response data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      // Create event WITH the user as an attendee
      const event = await caller.createEvent({
        title: "Team Meeting",
        type: "meeting" as const,
        startTime: new Date("2025-01-15T09:00:00Z"),
        endTime: new Date("2025-01-15T10:00:00Z"),
        attendeeIds: [userId], // Add user as attendee
      });
      tracker.calendarEvents?.push(event.id);

      await expect(
        caller.respondToInvitation({
          eventId: event.id,
          status: "accepted" as const,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept all status values", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      // Create event WITH the user as an attendee
      const event = await caller.createEvent({
        title: "Team Meeting",
        type: "meeting" as const,
        startTime: new Date("2025-01-15T09:00:00Z"),
        endTime: new Date("2025-01-15T10:00:00Z"),
        attendeeIds: [userId], // Add user as attendee
      });
      tracker.calendarEvents?.push(event.id);

      const statuses = ["accepted", "declined", "tentative"] as const;

      for (const status of statuses) {
        await expect(
          caller.respondToInvitation({
            eventId: event.id,
            status,
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("addAttendee", () => {
    it("should reject missing userId field", async () => {
      await expect(
        caller.addAttendee({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid attendee data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const attendeeUser = await createTestUser(tenantId);
      tracker.users?.push(attendeeUser);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.addAttendee({
          eventId: event.id,
          userId: attendeeUser,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional isOptional field", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const attendeeUser = await createTestUser(tenantId);
      tracker.users?.push(attendeeUser);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.addAttendee({
          eventId: event.id,
          userId: attendeeUser,
          isOptional: true,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("removeAttendee", () => {
    it("should reject missing eventId field", async () => {
      await expect(
        caller.removeAttendee({
          userId: "660e8400-e29b-41d4-a716-446655440000",
        } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid removal data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const attendeeUser = await createTestUser(tenantId);
      tracker.users?.push(attendeeUser);

      const event = await createTestCalendarEvent(tenantId, userId);
      tracker.calendarEvents?.push(event.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(
        caller.removeAttendee({
          eventId: event.id,
          userId: attendeeUser,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(calendarRouter._def.procedures);

      expect(procedures).toContain("listEvents");
      expect(procedures).toContain("getEvent");
      expect(procedures).toContain("createEvent");
      expect(procedures).toContain("updateEvent");
      expect(procedures).toContain("deleteEvent");
      expect(procedures).toContain("respondToInvitation");
      expect(procedures).toContain("addAttendee");
      expect(procedures).toContain("removeAttendee");
    });

    it("should have 8 procedures total", () => {
      const procedures = Object.keys(calendarRouter._def.procedures);
      expect(procedures).toHaveLength(8);
    });
  });
});
