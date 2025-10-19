import { beforeEach, describe, expect, it } from "vitest";
import {
  invalidateQuestionnaireCache,
  questionnaireResponsesCache,
} from "@/lib/cache";

describe("lib/cache.ts", () => {
  beforeEach(() => {
    // Clear cache before each test
    questionnaireResponsesCache.clear();
  });

  describe("SimpleCache - Basic Operations", () => {
    it("should store and retrieve values", () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      questionnaireResponsesCache.set("session1", testData);
      const retrieved = questionnaireResponsesCache.get("session1");

      expect(retrieved).toEqual(testData);
    });

    it("should return null for non-existent keys", () => {
      const result = questionnaireResponsesCache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should handle multiple keys independently", () => {
      const data1 = {
        field1: {
          value: "test1",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      };
      const data2 = {
        field2: {
          value: "test2",
          extractedFromAi: false,
          verifiedByUser: true,
        },
      };

      questionnaireResponsesCache.set("session1", data1);
      questionnaireResponsesCache.set("session2", data2);

      expect(questionnaireResponsesCache.get("session1")).toEqual(data1);
      expect(questionnaireResponsesCache.get("session2")).toEqual(data2);
    });
  });

  describe("SimpleCache - TTL (Time To Live)", () => {
    it("should expire values after TTL", async () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      // Set with 100ms TTL
      questionnaireResponsesCache.set("session1", testData, 100);

      // Should exist immediately
      expect(questionnaireResponsesCache.get("session1")).toEqual(testData);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be null after expiration
      expect(questionnaireResponsesCache.get("session1")).toBeNull();
    });

    it("should not expire before TTL", async () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      // Set with 200ms TTL
      questionnaireResponsesCache.set("session1", testData, 200);

      // Wait 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still exist
      expect(questionnaireResponsesCache.get("session1")).toEqual(testData);
    });

    it("should use default TTL of 30 seconds", () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      questionnaireResponsesCache.set("session1", testData);

      // Should exist (we can't wait 30 seconds, but we can verify it exists)
      expect(questionnaireResponsesCache.get("session1")).toEqual(testData);
    });
  });

  describe("SimpleCache - Manual Operations", () => {
    it("should delete specific keys", () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      questionnaireResponsesCache.set("session1", testData);
      expect(questionnaireResponsesCache.get("session1")).toEqual(testData);

      questionnaireResponsesCache.delete("session1");
      expect(questionnaireResponsesCache.get("session1")).toBeNull();
    });

    it("should clear all cached values", () => {
      questionnaireResponsesCache.set("session1", {
        field1: {
          value: "test1",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      });
      questionnaireResponsesCache.set("session2", {
        field2: {
          value: "test2",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      });

      questionnaireResponsesCache.clear();

      expect(questionnaireResponsesCache.get("session1")).toBeNull();
      expect(questionnaireResponsesCache.get("session2")).toBeNull();
    });

    it("should provide cache statistics", () => {
      questionnaireResponsesCache.set("session1", {
        field1: {
          value: "test1",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      });
      questionnaireResponsesCache.set("session2", {
        field2: {
          value: "test2",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      });

      const stats = questionnaireResponsesCache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain("session1");
      expect(stats.keys).toContain("session2");
    });
  });

  describe("invalidateQuestionnaireCache", () => {
    it("should invalidate cache for specific session", () => {
      const testData = {
        field1: { value: "test", extractedFromAi: true, verifiedByUser: false },
      };

      questionnaireResponsesCache.set("session1", testData);
      expect(questionnaireResponsesCache.get("session1")).toEqual(testData);

      invalidateQuestionnaireCache("session1");
      expect(questionnaireResponsesCache.get("session1")).toBeNull();
    });

    it("should not affect other sessions", () => {
      const data1 = {
        field1: {
          value: "test1",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      };
      const data2 = {
        field2: {
          value: "test2",
          extractedFromAi: true,
          verifiedByUser: false,
        },
      };

      questionnaireResponsesCache.set("session1", data1);
      questionnaireResponsesCache.set("session2", data2);

      invalidateQuestionnaireCache("session1");

      expect(questionnaireResponsesCache.get("session1")).toBeNull();
      expect(questionnaireResponsesCache.get("session2")).toEqual(data2);
    });
  });
});
