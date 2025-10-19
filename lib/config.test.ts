import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("lib/config.ts", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Clear module cache to reload config with new env
    vi.resetModules();
  });

  describe("SUPPORT_EMAIL", () => {
    it("should load from NEXT_PUBLIC_SUPPORT_EMAIL environment variable", async () => {
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "custom@example.com";
      const { SUPPORT_EMAIL } = await import("@/lib/config");
      expect(SUPPORT_EMAIL).toBe("custom@example.com");
    });

    it("should fallback to default when env var not set", async () => {
      delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
      const { SUPPORT_EMAIL } = await import("@/lib/config");
      expect(SUPPORT_EMAIL).toBe("support@innspiredaccountancy.com");
    });
  });

  describe("APP_NAME", () => {
    it("should load from NEXT_PUBLIC_APP_NAME environment variable", async () => {
      process.env.NEXT_PUBLIC_APP_NAME = "Custom App";
      const { APP_NAME } = await import("@/lib/config");
      expect(APP_NAME).toBe("Custom App");
    });

    it("should fallback to default when env var not set", async () => {
      delete process.env.NEXT_PUBLIC_APP_NAME;
      const { APP_NAME } = await import("@/lib/config");
      expect(APP_NAME).toBe("Practice Hub");
    });
  });

  describe("APP_URL", () => {
    it("should load from NEXT_PUBLIC_APP_URL environment variable", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
      const { APP_URL } = await import("@/lib/config");
      expect(APP_URL).toBe("https://app.example.com");
    });

    it("should fallback to BETTER_AUTH_URL when NEXT_PUBLIC_APP_URL not set", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.BETTER_AUTH_URL = "https://auth.example.com";
      const { APP_URL } = await import("@/lib/config");
      expect(APP_URL).toBe("https://auth.example.com");
    });

    it("should fallback to localhost when no env vars set", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.BETTER_AUTH_URL;
      const { APP_URL } = await import("@/lib/config");
      expect(APP_URL).toBe("http://localhost:3000");
    });
  });
});
