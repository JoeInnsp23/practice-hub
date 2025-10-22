/**
 * Settings Router Tests
 *
 * Tests for the settings tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { settingsRouter } from "@/app/server/routers/settings";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

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
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof settingsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(settingsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getTenant", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getTenant;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("updateTenant", () => {
    it("should accept empty input (partial schema)", () => {
      expect(() => {
        settingsRouter._def.procedures.updateTenant._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept name update", () => {
      expect(() => {
        settingsRouter._def.procedures.updateTenant._def.inputs[0]?.parse({
          name: "Updated Organization Name",
        });
      }).not.toThrow();
    });

    it("should accept slug update", () => {
      expect(() => {
        settingsRouter._def.procedures.updateTenant._def.inputs[0]?.parse({
          slug: "updated-org-slug",
        });
      }).not.toThrow();
    });

    it("should accept multiple fields", () => {
      expect(() => {
        settingsRouter._def.procedures.updateTenant._def.inputs[0]?.parse({
          name: "New Organization",
          slug: "new-org",
        });
      }).not.toThrow();
    });
  });

  describe("getNotificationSettings", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getNotificationSettings;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("updateNotificationSettings", () => {
    it("should accept empty input", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept email notifications update", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {
            emailNotifications: {
              taskAssigned: true,
              taskCompleted: false,
              invoiceCreated: true,
            },
          },
        );
      }).not.toThrow();
    });

    it("should accept in-app notifications update", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {
            inAppNotifications: {
              taskOverdue: true,
              clientAdded: false,
            },
          },
        );
      }).not.toThrow();
    });

    it("should accept digest email settings", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {
            digestEmail: {
              enabled: true,
              frequency: "weekly",
            },
          },
        );
      }).not.toThrow();
    });

    it("should accept all settings combined", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {
            emailNotifications: {
              taskAssigned: true,
              taskCompleted: true,
              taskOverdue: true,
              invoiceCreated: true,
              invoicePaid: true,
              clientAdded: true,
              reportGenerated: true,
            },
            inAppNotifications: {
              taskAssigned: false,
              taskCompleted: false,
              taskOverdue: true,
              invoiceCreated: false,
              invoicePaid: true,
              clientAdded: false,
              reportGenerated: false,
            },
            digestEmail: {
              enabled: true,
              frequency: "daily",
            },
          },
        );
      }).not.toThrow();
    });

    it("should validate digest frequency enum values", () => {
      expect(() => {
        settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
          {
            digestEmail: {
              frequency: "invalid",
            },
          },
        );
      }).toThrow();
    });

    it("should accept all valid frequency values", () => {
      const validFrequencies = ["daily", "weekly", "monthly"];

      for (const frequency of validFrequencies) {
        expect(() => {
          settingsRouter._def.procedures.updateNotificationSettings._def.inputs[0]?.parse(
            {
              digestEmail: {
                frequency,
              },
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("getUserSettings", () => {
    it("should have no required input", () => {
      const procedure = settingsRouter._def.procedures.getUserSettings;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("updateUserSettings", () => {
    it("should accept valid user settings", () => {
      expect(() => {
        settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
          emailNotifications: true,
          inAppNotifications: false,
          digestEmail: "weekly",
          theme: "dark",
          language: "en",
          timezone: "Europe/London",
        });
      }).not.toThrow();
    });

    it("should accept partial settings", () => {
      expect(() => {
        settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
          emailNotifications: false,
          theme: "light",
        });
      }).not.toThrow();
    });

    it("should validate theme enum", () => {
      expect(() => {
        settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
          theme: "invalid",
        });
      }).toThrow();
    });

    it("should validate digestEmail enum", () => {
      expect(() => {
        settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
          digestEmail: "invalid",
        });
      }).toThrow();
    });

    it("should accept all valid theme values", () => {
      const validThemes = ["light", "dark", "system"];

      for (const theme of validThemes) {
        expect(() => {
          settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
            theme,
          });
        }).not.toThrow();
      }
    });

    it("should accept all valid digestEmail values", () => {
      const validDigests = ["daily", "weekly", "never"];

      for (const digestEmail of validDigests) {
        expect(() => {
          settingsRouter._def.procedures.updateUserSettings._def.inputs[0]?.parse({
            digestEmail,
          });
        }).not.toThrow();
      }
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
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(settingsRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
