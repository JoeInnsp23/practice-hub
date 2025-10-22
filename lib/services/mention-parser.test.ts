import { describe, expect, it } from "vitest";
import {
  extractUserIds,
  getMentionQuery,
  highlightMentions,
  insertMention,
  isInMentionContext,
  parseMentions,
} from "./mention-parser";

describe("mention-parser", () => {
  describe("parseMentions", () => {
    it("should parse bracketed mentions", () => {
      const mentions = parseMentions("Hey @[John Doe], can you review?");
      expect(mentions).toEqual(["John Doe"]);
    });

    it("should parse multiple bracketed mentions", () => {
      const mentions = parseMentions("@[John Doe] and @[Jane Smith] please help");
      expect(mentions).toEqual(["John Doe", "Jane Smith"]);
    });

    it("should parse username mentions", () => {
      const mentions = parseMentions("@john @mary please help");
      expect(mentions).toEqual(["john", "mary"]);
    });

    it("should parse mixed mention formats", () => {
      const mentions = parseMentions("@[John Doe] and @mary");
      expect(mentions).toEqual(["John Doe", "mary"]);
    });

    it("should return empty array for no mentions", () => {
      const mentions = parseMentions("No mentions here");
      expect(mentions).toEqual([]);
    });

    it("should handle empty string", () => {
      const mentions = parseMentions("");
      expect(mentions).toEqual([]);
    });
  });

  describe("highlightMentions", () => {
    it("should wrap mentions in styled spans", () => {
      const result = highlightMentions("Hey @[John Doe]");
      expect(result).toContain('<span class="mention text-primary font-semibold">');
      expect(result).toContain("@John Doe");
    });

    it("should highlight multiple mentions", () => {
      const result = highlightMentions("@[John Doe] and @[Jane Smith]");
      expect(result).toContain("@John Doe");
      expect(result).toContain("@Jane Smith");
      // Should have 2 span tags
      expect(result.match(/<span/g)?.length).toBe(2);
    });

    it("should not affect text without mentions", () => {
      const result = highlightMentions("No mentions here");
      expect(result).toBe("No mentions here");
    });

    describe("XSS Protection", () => {
      it("should escape script tags in mentions", () => {
        const result = highlightMentions("@[<script>alert('XSS')</script>]");
        expect(result).not.toContain("<script>");
        expect(result).toContain("&lt;script&gt;");
        expect(result).toContain("&lt;/script&gt;");
      });

      it("should escape HTML tags in note content", () => {
        const result = highlightMentions("<img src=x onerror=alert(1)>");
        expect(result).not.toContain("<img");
        expect(result).toContain("&lt;img");
        expect(result).toContain("&gt;");
      });

      it("should escape quotes and apostrophes", () => {
        const result = highlightMentions('@["><script>]');
        expect(result).toContain("&quot;");
        expect(result).not.toContain('"><script>');
      });

      it("should escape ampersands", () => {
        const result = highlightMentions("Test & @[User]");
        expect(result).toContain("&amp;");
      });

      it("should handle multiple XSS attack vectors", () => {
        const malicious = "@[<img src=x onerror=alert('XSS')>] normal text <script>alert(2)</script>";
        const result = highlightMentions(malicious);
        // Ensure no unescaped HTML tags that could execute
        expect(result).not.toContain("<img src=");
        expect(result).not.toContain("<script>alert");
        // Verify proper escaping - tags are escaped
        expect(result).toContain("&lt;img");
        expect(result).toContain("&lt;script&gt;");
        expect(result).toContain("&lt;");
        expect(result).toContain("&gt;");
        // Critical: Ensure apostrophes in script are escaped (prevents JS execution)
        expect(result).toContain("&#039;XSS&#039;");
      });
    });
  });

  describe("extractUserIds", () => {
    const users = [
      { id: "1", firstName: "John", lastName: "Doe", email: "john@example.com" },
      { id: "2", firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
      { id: "3", firstName: "Bob", lastName: null, email: "bob@example.com" },
    ];

    it("should extract user IDs by full name", () => {
      const userIds = extractUserIds(["John Doe", "Jane Smith"], users);
      expect(userIds).toEqual(["1", "2"]);
    });

    it("should be case insensitive", () => {
      const userIds = extractUserIds(["john doe", "JANE SMITH"], users);
      expect(userIds).toEqual(["1", "2"]);
    });

    it("should match by email", () => {
      const userIds = extractUserIds(["john@example.com"], users);
      expect(userIds).toEqual(["1"]);
    });

    it("should handle null lastName", () => {
      const userIds = extractUserIds(["Bob"], users);
      expect(userIds).toEqual(["3"]);
    });

    it("should return empty array for no matches", () => {
      const userIds = extractUserIds(["Unknown User"], users);
      expect(userIds).toEqual([]);
    });

    it("should remove duplicates", () => {
      const userIds = extractUserIds(["John Doe", "john doe"], users);
      expect(userIds).toEqual(["1"]);
    });
  });

  describe("insertMention", () => {
    it("should insert mention at cursor position", () => {
      const result = insertMention("Hello @", 7, "John Doe");
      expect(result.text).toBe("Hello @[John Doe] ");
      expect(result.cursorPosition).toBe(18);
    });

    it("should replace partial mention", () => {
      const result = insertMention("Hello @jo", 9, "John Doe");
      expect(result.text).toBe("Hello @[John Doe] ");
    });

    it("should insert after text", () => {
      const result = insertMention("Hello @jo world", 9, "John Doe");
      expect(result.text).toBe("Hello @[John Doe]  world");
    });

    it("should append to end if no @ found", () => {
      const result = insertMention("Hello", 5, "John Doe");
      expect(result.text).toBe("Hello@[John Doe] ");
    });
  });

  describe("isInMentionContext", () => {
    it("should return true after @ symbol", () => {
      expect(isInMentionContext("Hello @", 7)).toBe(true);
    });

    it("should return true after @ with partial text", () => {
      expect(isInMentionContext("Hello @jo", 9)).toBe(true);
    });

    it("should return false after space", () => {
      expect(isInMentionContext("Hello @john ", 12)).toBe(false);
    });

    it("should return false before @", () => {
      expect(isInMentionContext("Hello @john", 5)).toBe(false);
    });

    it("should return false with no @", () => {
      expect(isInMentionContext("Hello", 5)).toBe(false);
    });
  });

  describe("getMentionQuery", () => {
    it("should extract query after @", () => {
      expect(getMentionQuery("Hello @jo", 9)).toBe("jo");
    });

    it("should return empty string for just @", () => {
      expect(getMentionQuery("Hello @", 7)).toBe("");
    });

    it("should return empty string if not in mention context", () => {
      expect(getMentionQuery("Hello", 5)).toBe("");
    });

    it("should extract query with longer text", () => {
      expect(getMentionQuery("Hello @john", 11)).toBe("john");
    });
  });
});
