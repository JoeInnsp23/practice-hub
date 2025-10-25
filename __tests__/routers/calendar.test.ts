/**
 * Calendar Router Tests
 *
 * Tests for the calendar tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { calendarRouter } from "@/app/server/routers/calendar";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/calendar.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof calendarRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(calendarRouter, ctx);
    vi.clearAllMocks();
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
      await expect(
        caller.getEvent({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
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
      await expect(
        caller.createEvent({
          title: "Team Meeting",
          type: "meeting" as const,
          startTime: new Date("2025-01-15T09:00:00Z"),
          endTime: new Date("2025-01-15T10:00:00Z"),
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      await expect(
        caller.createEvent({
          title: "Client Consultation",
          description: "Discuss quarterly results",
          type: "meeting" as const,
          startTime: new Date("2025-01-20T14:00:00Z"),
          endTime: new Date("2025-01-20T15:00:00Z"),
          allDay: false,
          location: "Conference Room A",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
          taskId: "660e8400-e29b-41d4-a716-446655440000",
          reminderMinutes: 15,
          isRecurring: false,
          attendeeIds: ["770e8400-e29b-41d4-a716-446655440000"],
        }),
      ).resolves.not.toThrow();
    });

    it("should accept all-day events", async () => {
      await expect(
        caller.createEvent({
          title: "Company Holiday",
          type: "out_of_office" as const,
          startTime: new Date("2025-12-25T00:00:00Z"),
          endTime: new Date("2025-12-25T23:59:59Z"),
          allDay: true,
        }),
      ).resolves.not.toThrow();
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
      await expect(
        caller.updateEvent({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          title: "Updated Meeting Title",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      await expect(
        caller.updateEvent({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
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
      await expect(
        caller.deleteEvent({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
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
      await expect(
        caller.respondToInvitation({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          status: "accepted" as const,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept all status values", async () => {
      const statuses = ["accepted", "declined", "tentative"] as const;

      for (const status of statuses) {
        await expect(
          caller.respondToInvitation({
            eventId: "550e8400-e29b-41d4-a716-446655440000",
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
      await expect(
        caller.addAttendee({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "660e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional isOptional field", async () => {
      await expect(
        caller.addAttendee({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "660e8400-e29b-41d4-a716-446655440000",
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
      await expect(
        caller.removeAttendee({
          eventId: "550e8400-e29b-41d4-a716-446655440000",
          userId: "660e8400-e29b-41d4-a716-446655440000",
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
