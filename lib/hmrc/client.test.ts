import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetTokenCache,
  AuthenticationError,
  RateLimitError,
  validateVAT,
} from "./client";

// Mock fetch globally
global.fetch = vi.fn();

describe("HMRC VAT Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetTokenCache(); // Reset module-level cached token
    // Set environment variables for tests
    process.env.HMRC_CLIENT_ID = "test-client-id";
    process.env.HMRC_CLIENT_SECRET = "test-client-secret";
    process.env.HMRC_SANDBOX_MODE = "true";
  });

  describe("validateVAT", () => {
    it("should successfully validate a valid VAT number", async () => {
      // Mock OAuth token response
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            access_token: "test-token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read:vat",
          }),
        })
        // Mock VAT lookup response
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            target: {
              vatNumber: "123456789",
              name: "Test Company Ltd",
              address: {
                line1: "123 Test Street",
                postcode: "SW1A 1AA",
                countryCode: "GB",
              },
            },
          }),
        });

      const result = await validateVAT("GB123456789");

      expect(result).toEqual({
        isValid: true,
        vatNumber: "123456789",
        businessName: "Test Company Ltd",
        businessAddress: {
          line1: "123 Test Street",
          postcode: "SW1A 1AA",
          countryCode: "GB",
        },
      });
    });

    it("should return invalid for non-existent VAT number", async () => {
      // Mock OAuth token response
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            access_token: "test-token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read:vat",
          }),
        })
        // Mock 404 response for VAT lookup
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await validateVAT("GB999999999");

      expect(result).toEqual({
        isValid: false,
        vatNumber: "999999999",
      });
    });

    it("should normalize VAT number by removing GB prefix", async () => {
      // Mock OAuth token response
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            access_token: "test-token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read:vat",
          }),
        })
        // Mock VAT lookup response
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            target: {
              vatNumber: "123456789",
              name: "Test Company Ltd",
            },
          }),
        });

      await validateVAT("GB123456789");

      // Check that the API was called with normalized VAT number (without GB)
      const apiCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const vatLookupCall = apiCalls[1][0] as string;
      expect(vatLookupCall).toContain("/lookup/123456789");
      expect(vatLookupCall).not.toContain("GB");
    });

    it("should throw RateLimitError when API returns 429", async () => {
      // Mock OAuth token response
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            access_token: "test-token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read:vat",
          }),
        })
        // Mock 429 rate limit response
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        });

      await expect(validateVAT("GB123456789")).rejects.toThrow(RateLimitError);
    });

    it("should throw AuthenticationError when OAuth fails", async () => {
      // Mock failed OAuth token response
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(validateVAT("GB123456789")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should cache OAuth token for subsequent requests", async () => {
      // Mock OAuth token response (should only be called once)
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            access_token: "test-token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read:vat",
          }),
        })
        // Mock VAT lookup responses (called twice)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            target: { vatNumber: "123456789", name: "Company 1" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            target: { vatNumber: "987654321", name: "Company 2" },
          }),
        });

      // Make two validation requests
      await validateVAT("GB123456789");
      await validateVAT("GB987654321");

      // Verify OAuth token was only fetched once (cached for second request)
      const fetchCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const oauthCalls = fetchCalls.filter((call) =>
        (call[0] as string).includes("/oauth/token"),
      );
      expect(oauthCalls).toHaveLength(1);
    });
  });
});
