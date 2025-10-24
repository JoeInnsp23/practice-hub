/**
 * Calendar Router Tests
 *
 * Tests for the calendar tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { calendarRouter } from "@/app/server/routers/calendar";
import { createCaller, createMockContext } from "../helpers/trpc";

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
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof calendarRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(calendarRouter, ctx);
    vi.clearAllMocks();
  });

  describe("listEvents", () => {
    it("should accept empty input", () => {
      expect(() => {
        calendarRouter._def.procedures.listEvents._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept date range filters", () => {
      expect(() => {
        calendarRouter._def.procedures.listEvents._def.inputs[0]?.parse({
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-31"),
        });
      }).not.toThrow();
    });

    it("should accept type filter", () => {
      expect(() => {
        calendarRouter._def.procedures.listEvents._def.inputs[0]?.parse({
          type: "meeting",
        });
      }).not.toThrow();
    });

    it("should validate type enum values", () => {
      expect(() => {
        calendarRouter._def.procedures.listEvents._def.inputs[0]?.parse({
          type: "invalid_type",
        });
      }).toThrow();
    });
  });

  describe("getEvent", () => {
    it("should validate required eventId field", () => {
      const invalidInput = {
        // Missing eventId
      };

      expect(() => {
        calendarRouter._def.procedures.getEvent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid event ID", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.getEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        eventId: "not-a-uuid",
      };

      expect(() => {
        calendarRouter._def.procedures.getEvent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createEvent", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing title, type, startTime, endTime
        description: "Test event",
      };

      expect(() => {
        calendarRouter._def.procedures.createEvent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid event data", () => {
      const validInput = {
        title: "Team Meeting",
        type: "meeting" as const,
        startTime: new Date("2025-01-15T09:00:00Z"),
        endTime: new Date("2025-01-15T10:00:00Z"),
      };

      expect(() => {
        calendarRouter._def.procedures.createEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
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
        // metadata: { meetingType: "consultation" }, // Skip metadata - complex type
        attendeeIds: ["770e8400-e29b-41d4-a716-446655440000"],
      };

      expect(() => {
        calendarRouter._def.procedures.createEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept all-day events", () => {
      const validInput = {
        title: "Company Holiday",
        type: "out_of_office" as const,
        startTime: new Date("2025-12-25T00:00:00Z"),
        endTime: new Date("2025-12-25T23:59:59Z"),
        allDay: true,
      };

      expect(() => {
        calendarRouter._def.procedures.createEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateEvent", () => {
    it("should validate required eventId field", () => {
      const invalidInput = {
        // Missing eventId
        title: "Updated Event",
      };

      expect(() => {
        calendarRouter._def.procedures.updateEvent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Updated Meeting Title",
      };

      expect(() => {
        calendarRouter._def.procedures.updateEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        location: "Virtual Meeting - Zoom",
        reminderMinutes: 30,
      };

      expect(() => {
        calendarRouter._def.procedures.updateEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("deleteEvent", () => {
    it("should validate required eventId field", () => {
      const invalidInput = {
        // Missing eventId
      };

      expect(() => {
        calendarRouter._def.procedures.deleteEvent._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid event ID", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.deleteEvent._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("respondToInvitation", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing status
        eventId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.respondToInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid response data", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        status: "accepted" as const,
      };

      expect(() => {
        calendarRouter._def.procedures.respondToInvitation._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept all status values", () => {
      const statuses = ["accepted", "declined", "tentative"];

      for (const status of statuses) {
        expect(() => {
          calendarRouter._def.procedures.respondToInvitation._def.inputs[0]?.parse(
            {
              eventId: "550e8400-e29b-41d4-a716-446655440000",
              status,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("addAttendee", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing userId
        eventId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.addAttendee._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid attendee data", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.addAttendee._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional isOptional field", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
        isOptional: true,
      };

      expect(() => {
        calendarRouter._def.procedures.addAttendee._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("removeAttendee", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing eventId
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.removeAttendee._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid removal data", () => {
      const validInput = {
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        calendarRouter._def.procedures.removeAttendee._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
