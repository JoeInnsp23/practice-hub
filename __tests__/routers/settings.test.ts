/**
 * Settings Router Tests
 *
 * Tests for the settings tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { settingsRouter } from "@/app/server/routers/settings";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Type helper to extract Zod schema from tRPC procedure inputs
type ZodSchema = z.ZodTypeAny;

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/settings.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof settingsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(settingsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getTenant", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getTenant;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("updateTenant", () => {
    it("should accept empty input (partial schema)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTenant._def
            .inputs[0] as ZodSchema
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept name update", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTenant._def
            .inputs[0] as ZodSchema
        )?.parse({
          name: "Updated Organization Name",
        });
      }).not.toThrow();
    });

    it("should accept slug update", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTenant._def
            .inputs[0] as ZodSchema
        )?.parse({
          slug: "updated-org-slug",
        });
      }).not.toThrow();
    });

    it("should accept multiple fields", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTenant._def
            .inputs[0] as ZodSchema
        )?.parse({
          name: "New Organization",
          slug: "new-org",
        });
      }).not.toThrow();
    });
  });

  describe("getNotificationSettings", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getNotificationSettings;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("updateNotificationSettings (FR31)", () => {
    it("should accept empty input (partial schema)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept global toggles (emailNotifications, inAppNotifications)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          emailNotifications: true,
          inAppNotifications: false,
        });
      }).not.toThrow();
    });

    it("should accept digestEmail string", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          digestEmail: "weekly",
        });
      }).not.toThrow();
    });

    it("should accept individual notification preferences (FR31)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          notifTaskAssigned: true,
          notifTaskMention: false,
          notifTaskReassigned: true,
        });
      }).not.toThrow();
    });

    it("should accept all 6 granular notification preferences (FR31)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          notifTaskAssigned: true,
          notifTaskMention: false,
          notifTaskReassigned: true,
          notifDeadlineApproaching: false,
          notifApprovalNeeded: true,
          notifClientMessage: false,
        });
      }).not.toThrow();
    });

    it("should accept combined global toggles and granular preferences (FR31)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          emailNotifications: true,
          inAppNotifications: true,
          digestEmail: "daily",
          notifTaskAssigned: true,
          notifTaskMention: true,
          notifTaskReassigned: false,
          notifDeadlineApproaching: true,
          notifApprovalNeeded: false,
          notifClientMessage: true,
        });
      }).not.toThrow();
    });

    it("should validate boolean types for notification preferences", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateNotificationSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          notifTaskAssigned: "invalid",
        });
      }).toThrow();
    });
  });

  describe("getUserSettings", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getUserSettings;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("updateUserSettings (includes FR31 fields)", () => {
    it("should accept valid user settings with notification preferences", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateUserSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          emailNotifications: true,
          inAppNotifications: false,
          digestEmail: "weekly",
          notifTaskAssigned: true,
          notifTaskMention: false,
          notifTaskReassigned: true,
          notifDeadlineApproaching: false,
          notifApprovalNeeded: true,
          notifClientMessage: false,
          theme: "dark",
          language: "en",
          timezone: "Europe/London",
        });
      }).not.toThrow();
    });

    it("should accept partial settings", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateUserSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          emailNotifications: false,
          theme: "light",
        });
      }).not.toThrow();
    });

    it("should validate theme enum", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateUserSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          theme: "invalid",
        });
      }).toThrow();
    });

    it("should validate digestEmail enum", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateUserSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          digestEmail: "invalid",
        });
      }).toThrow();
    });

    it("should accept all valid theme values", () => {
      const validThemes = ["light", "dark", "system"];

      for (const theme of validThemes) {
        expect(() => {
          (
            settingsRouter._def.procedures.updateUserSettings._def
              .inputs[0] as ZodSchema
          )?.parse({
            theme,
          });
        }).not.toThrow();
      }
    });

    it("should accept all valid digestEmail values", () => {
      const validDigests = ["daily", "weekly", "never"];

      for (const digestEmail of validDigests) {
        expect(() => {
          (
            settingsRouter._def.procedures.updateUserSettings._def
              .inputs[0] as ZodSchema
          )?.parse({
            digestEmail,
          });
        }).not.toThrow();
      }
    });
  });

  describe("getTimesheetSettings (Story 6.3)", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getTimesheetSettings;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("updateTimesheetSettings (Story 6.3)", () => {
    it("should accept empty input (partial schema)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({});
      }).not.toThrow();
    });

    it("should accept minWeeklyHours only", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: 40,
        });
      }).not.toThrow();
    });

    it("should accept dailyTargetHours only", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          dailyTargetHours: 8,
        });
      }).not.toThrow();
    });

    it("should accept both fields together", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: 35,
          dailyTargetHours: 7,
        });
      }).not.toThrow();
    });

    it("should validate minWeeklyHours minimum (0)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: -1,
        });
      }).toThrow();
    });

    it("should validate minWeeklyHours maximum (168)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: 169,
        });
      }).toThrow();
    });

    it("should validate dailyTargetHours minimum (0)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          dailyTargetHours: -1,
        });
      }).toThrow();
    });

    it("should validate dailyTargetHours maximum (24)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          dailyTargetHours: 25,
        });
      }).toThrow();
    });

    it("should accept boundary values (0 and maximums)", () => {
      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: 0,
          dailyTargetHours: 24,
        });
      }).not.toThrow();

      expect(() => {
        (
          settingsRouter._def.procedures.updateTimesheetSettings._def
            .inputs[0] as ZodSchema
        )?.parse({
          minWeeklyHours: 168,
          dailyTargetHours: 0,
        });
      }).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(settingsRouter._def.procedures);

      expect(procedures).toContain("getTenant");
      expect(procedures).toContain("updateTenant");
      expect(procedures).toContain("getNotificationSettings");
      expect(procedures).toContain("updateNotificationSettings");
      expect(procedures).toContain("getUserSettings");
      expect(procedures).toContain("updateUserSettings");
      expect(procedures).toContain("getTimesheetSettings");
      expect(procedures).toContain("updateTimesheetSettings");
    });

    it("should have 8 procedures total", () => {
      const procedures = Object.keys(settingsRouter._def.procedures);
      expect(procedures).toHaveLength(8);
    });
  });
});
