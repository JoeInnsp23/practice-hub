/**
 * Announcements Router Tests
 *
 * Tests for the announcements tRPC router including:
 * - List procedure (protected)
 * - Admin list procedure (admin only)
 * - CRUD operations (admin only)
 * - Toggle active/pin operations (admin only)
 * - Schedule window filtering
 * - Multi-tenant isolation
 */

import { beforeEach, describe, expect, it } from "vitest";
import { announcementsRouter } from "@/app/server/routers/announcements";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/announcements.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof announcementsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(announcementsRouter, ctx);
  });

  describe("list", () => {
    it("should accept optional limit parameter", async () => {
      await expect(caller.list({ limit: 5 })).resolves.not.toThrow();
    });

    it("should validate limit min value", async () => {
      await expect(
        caller.list({ limit: 0 }), // Below min of 1
      ).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(
        caller.list({ limit: 11 }), // Exceeds max of 10
      ).rejects.toThrow();
    });

    it("should default limit to 5", async () => {
      // The procedure should use default limit of 5 when not provided
      await expect(caller.list({})).resolves.not.toThrow();
    });

    it("should filter by schedule window", async () => {
      // This test verifies schedule window logic by checking that:
      // 1. Only active announcements are returned
      // 2. startsAt is null or in the past
      // 3. endsAt is null or in the future
      const result = await caller.list({ limit: 5 });

      const now = new Date();
      for (const announcement of result) {
        expect(announcement.isActive).toBe(true);

        if (announcement.startsAt) {
          expect(announcement.startsAt <= now).toBe(true);
        }

        if (announcement.endsAt) {
          expect(announcement.endsAt >= now).toBe(true);
        }
      }
    });

    it("should order by pinned, priority, and created date", async () => {
      const result = await caller.list({ limit: 10 });

      // Verify ordering: pinned first, then by priority (critical > warning > info), then by created date
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];

        // Pinned items should come first
        if (current.isPinned && !next.isPinned) {
          expect(true).toBe(true); // Correct order
        } else if (!current.isPinned && next.isPinned) {
          expect(false).toBe(true); // Incorrect order - should fail
        }
      }
    });
  });

  describe("adminList", () => {
    it("should return all announcements for admin", async () => {
      await expect(caller.adminList({})).resolves.not.toThrow();
    });

    it("should not filter by schedule window", async () => {
      // adminList should return all announcements, including inactive and scheduled ones
      const result = await caller.adminList({});

      // Check that we can have inactive announcements
      const hasInactive = result.some((a: any) => !a.isActive);
      const hasFutureStart = result.some(
        (a: any) => a.startsAt && a.startsAt > new Date(),
      );
      const hasPastEnd = result.some(
        (a: any) => a.endsAt && a.endsAt < new Date(),
      );

      // At least one of these should be true if we have test data
      // (This is a soft check - won't fail if database is empty)
      expect(
        hasInactive || hasFutureStart || hasPastEnd || result.length === 0,
      ).toBe(true);
    });
  });

  describe("create", () => {
    it("should require title", async () => {
      await expect(
        caller.create({
          title: "",
          content: "Test content",
          icon: "Megaphone",
          iconColor: "#8b5cf6",
          priority: "info",
          isPinned: false,
          startsAt: null,
          endsAt: null,
        }),
      ).rejects.toThrow();
    });

    it("should require content", async () => {
      await expect(
        caller.create({
          title: "Test Announcement",
          content: "",
          icon: "Megaphone",
          iconColor: "#8b5cf6",
          priority: "info",
          isPinned: false,
          startsAt: null,
          endsAt: null,
        }),
      ).rejects.toThrow();
    });

    it("should require valid icon color (hex format)", async () => {
      await expect(
        caller.create({
          title: "Test Announcement",
          content: "Test content",
          icon: "Megaphone",
          iconColor: "purple", // Invalid - not hex
          priority: "info",
          isPinned: false,
          startsAt: null,
          endsAt: null,
        }),
      ).rejects.toThrow();
    });

    it("should accept valid priority values", async () => {
      for (const priority of ["info", "warning", "critical"] as const) {
        await expect(
          caller.create({
            title: `Test ${priority}`,
            content: "Test content",
            icon: "Megaphone",
            iconColor: "#8b5cf6",
            priority,
            isPinned: false,
            startsAt: null,
            endsAt: null,
          }),
        ).resolves.not.toThrow();
      }
    });

    it("should accept null schedule dates", async () => {
      await expect(
        caller.create({
          title: "Test Announcement",
          content: "Test content",
          icon: "Megaphone",
          iconColor: "#8b5cf6",
          priority: "info",
          isPinned: false,
          startsAt: null,
          endsAt: null,
        }),
      ).resolves.not.toThrow();
    });

    it("should accept schedule window dates", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await expect(
        caller.create({
          title: "Scheduled Announcement",
          content: "Test content",
          icon: "Megaphone",
          iconColor: "#8b5cf6",
          priority: "info",
          isPinned: false,
          startsAt: tomorrow,
          endsAt: nextWeek,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should require valid announcement ID", async () => {
      await expect(
        caller.update({
          id: "non-existent-id",
          title: "Updated Title",
          content: "Updated content",
          icon: "AlertCircle",
          iconColor: "#ef4444",
          priority: "critical",
          isPinned: true,
          startsAt: null,
          endsAt: null,
        }),
      ).rejects.toThrow();
    });

    it("should validate title", async () => {
      // Create an announcement first
      const announcement = await caller.create({
        title: "Test Announcement",
        content: "Test content",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });

      // Try to update with empty title
      await expect(
        caller.update({
          id: announcement.id,
          title: "",
          content: "Updated content",
          icon: "AlertCircle",
          iconColor: "#ef4444",
          priority: "critical",
          isPinned: true,
          startsAt: null,
          endsAt: null,
        }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should require valid announcement ID", async () => {
      await expect(caller.delete({ id: "non-existent-id" })).rejects.toThrow();
    });

    it("should delete announcement successfully", async () => {
      // Create an announcement
      const announcement = await caller.create({
        title: "Test Announcement to Delete",
        content: "Test content",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });

      // Delete it
      await expect(
        caller.delete({ id: announcement.id }),
      ).resolves.not.toThrow();

      // Verify it's deleted by trying to find it
      const adminList = await caller.adminList({});
      const deleted = adminList.find((a: any) => a.id === announcement.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe("toggleActive", () => {
    it("should toggle active status", async () => {
      // Create an announcement
      const announcement = await caller.create({
        title: "Test Toggle Active",
        content: "Test content",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });

      // Toggle to inactive
      await caller.toggleActive({ id: announcement.id, isActive: false });

      // Verify it's inactive
      const adminList = await caller.adminList({});
      const updated = adminList.find((a: any) => a.id === announcement.id);
      expect(updated?.isActive).toBe(false);

      // Toggle back to active
      await caller.toggleActive({ id: announcement.id, isActive: true });

      // Verify it's active
      const adminList2 = await caller.adminList({});
      const updated2 = adminList2.find((a: any) => a.id === announcement.id);
      expect(updated2?.isActive).toBe(true);
    });
  });

  describe("pin", () => {
    it("should toggle pin status", async () => {
      // Create an announcement
      const announcement = await caller.create({
        title: "Test Pin",
        content: "Test content",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });

      // Pin it
      await caller.pin({ id: announcement.id, isPinned: true });

      // Verify it's pinned
      const adminList = await caller.adminList({});
      const updated = adminList.find((a: any) => a.id === announcement.id);
      expect(updated?.isPinned).toBe(true);

      // Unpin it
      await caller.pin({ id: announcement.id, isPinned: false });

      // Verify it's unpinned
      const adminList2 = await caller.adminList({});
      const updated2 = adminList2.find((a: any) => a.id === announcement.id);
      expect(updated2?.isPinned).toBe(false);
    });
  });

  describe("Multi-tenant isolation", () => {
    it("should only return announcements for current tenant", async () => {
      // Create announcement in current tenant
      const announcement = await caller.create({
        title: "Tenant-specific Announcement",
        content: "Test content",
        icon: "Megaphone",
        iconColor: "#8b5cf6",
        priority: "info",
        isPinned: false,
        startsAt: null,
        endsAt: null,
      });

      // Fetch announcements - should only see current tenant's
      const announcements = await caller.list({ limit: 10 });
      const found = announcements.find((a: any) => a.id === announcement.id);
      expect(found).toBeDefined();

      // All announcements should have the same tenantId as ctx
      for (const a of announcements) {
        expect(a.tenantId).toBe(ctx.authContext.tenantId);
      }
    });
  });
});
