/**
 * Companies House API Client Unit Tests
 *
 * Tests for the Companies House API client covering:
 * - Successful data fetching and transformation
 * - Error handling for all error types
 * - Authentication header generation
 * - Response mapping from snake_case to camelCase
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCompany,
  getOfficers,
  getPSCs,
  CompanyNotFoundError,
  RateLimitError,
  APIServerError,
  NetworkError,
  CompaniesHouseError,
  type CompanyDetails,
  type Officer,
  type PSC,
} from "@/lib/companies-house/client";

// ============================================================================
// Test Setup & Mocks
// ============================================================================

beforeEach(() => {
  // Mock global fetch
  global.fetch = vi.fn();

  // Set test API key
  process.env.COMPANIES_HOUSE_API_KEY = "test-api-key";
});

afterEach(() => {
  // Restore all mocks
  vi.restoreAllMocks();

  // Clear environment variables
  delete process.env.COMPANIES_HOUSE_API_KEY;
});

// ============================================================================
// Mock Response Data
// ============================================================================

const mockCompanyResponse = {
  company_number: "00000006",
  company_name: "BRITISH BROADCASTING CORPORATION",
  company_status: "active",
  type: "ltd",
  date_of_creation: "1927-01-01",
  registered_office_address: {
    address_line_1: "Broadcasting House",
    address_line_2: "Portland Place",
    locality: "London",
    region: "Greater London",
    postal_code: "W1A 1AA",
    country: "England",
  },
  sic_codes: ["60100", "60200"],
};

const mockOfficersResponse = {
  items: [
    {
      name: "SMITH, John",
      officer_role: "director",
      appointed_on: "2020-01-01",
    },
    {
      name: "DOE, Jane",
      officer_role: "secretary",
      appointed_on: "2019-06-15",
      resigned_on: "2023-12-31",
    },
  ],
};

const mockPSCsResponse = {
  items: [
    {
      name: "Jane DOE",
      notified_on: "2020-01-01",
      natures_of_control: [
        "ownership-of-shares-25-to-50-percent",
        "voting-rights-25-to-50-percent",
      ],
      kind: "individual-person-with-significant-control",
    },
    {
      name: "ABC Holdings Ltd",
      notified_on: "2019-03-15",
      natures_of_control: ["ownership-of-shares-50-to-75-percent"],
      kind: "corporate-entity-person-with-significant-control",
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock successful Response object
 */
function createMockResponse(data: unknown, status = 200): Response {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    statusText: status === 200 ? "OK" : "",
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  };
  return response as unknown as Response;
}

/**
 * Create a mock error Response object
 */
function createMockErrorResponse(status: number): Response {
  const response = {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(""),
    headers: new Headers(),
    statusText: getStatusText(status),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
  };
  return response as unknown as Response;
}

/**
 * Get status text for HTTP status codes
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[status] || "";
}

/**
 * Verify Basic Auth header is correctly formatted
 */
function verifyAuthHeader(fetchMock: ReturnType<typeof vi.fn>): void {
  expect(fetchMock).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: expect.stringMatching(/^Basic /),
        Accept: "application/json",
      }),
    }),
  );

  // Verify the auth header is correctly base64 encoded
  const calls = fetchMock.mock.calls;
  const authHeader = calls[0][1].headers.Authorization;
  const base64Part = authHeader.replace("Basic ", "");
  const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

  // Should be "test-api-key:" (API key as username, empty password)
  expect(decoded).toBe("test-api-key:");
}

// ============================================================================
// Test Suite: getCompany()
// ============================================================================

describe("getCompany()", () => {
  it("should successfully fetch company data with 200 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockCompanyResponse, 200),
    );

    const result = await getCompany("00000006");

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.company-information.service.gov.uk/company/00000006",
      expect.any(Object),
    );

    // Verify auth header
    verifyAuthHeader(mockFetch);

    // Verify response mapping from snake_case to camelCase
    expect(result).toEqual<CompanyDetails>({
      companyNumber: "00000006",
      companyName: "BRITISH BROADCASTING CORPORATION",
      status: "active",
      type: "ltd",
      dateOfCreation: "1927-01-01",
      registeredOffice: {
        addressLine1: "Broadcasting House",
        addressLine2: "Portland Place",
        locality: "London",
        region: "Greater London",
        postalCode: "W1A 1AA",
        country: "England",
      },
      sicCodes: ["60100", "60200"],
    });
  });

  it("should throw CompanyNotFoundError on 404 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(404));

    try {
      await getCompany("99999999");
      expect.fail("Should have thrown CompanyNotFoundError");
    } catch (error) {
      expect(error).toBeInstanceOf(CompanyNotFoundError);
      expect((error as CompanyNotFoundError).message).toBe(
        "Company 99999999 not found",
      );
      expect((error as CompanyNotFoundError).statusCode).toBe(404);
      expect((error as CompanyNotFoundError).companyNumber).toBe("99999999");
    }
  });

  it("should throw RateLimitError on 429 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(429));

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).message).toBe(
        "Companies House API rate limit exceeded",
      );
      expect((error as RateLimitError).statusCode).toBe(429);
    }
  });

  it("should throw APIServerError on 500 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(500));

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 500",
      );
      expect((error as APIServerError).statusCode).toBe(500);
    }
  });

  it("should throw APIServerError on 502 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(502));

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 502",
      );
      expect((error as APIServerError).statusCode).toBe(502);
    }
  });

  it("should throw APIServerError on 503 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(503));

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 503",
      );
      expect((error as APIServerError).statusCode).toBe(503);
    }
  });

  it("should throw APIServerError on 504 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(504));

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 504",
      );
      expect((error as APIServerError).statusCode).toBe(504);
    }
  });

  it("should throw NetworkError on fetch failure", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error("Network connection failed");
    mockFetch.mockRejectedValueOnce(networkError);

    try {
      await getCompany("00000006");
      expect.fail("Should have thrown NetworkError");
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).name).toBe("NetworkError");
      expect((error as NetworkError).message).toContain(
        "Network error connecting to Companies House API",
      );
      expect((error as NetworkError).message).toContain(
        "Network connection failed",
      );
    }
  });

  it("should use correct Basic Auth header format", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockCompanyResponse, 200),
    );

    await getCompany("00000006");

    // Verify auth header format: Basic base64(api_key:)
    const calls = mockFetch.mock.calls;
    const headers = calls[0][1]?.headers as Record<string, string>;

    expect(headers.Authorization).toMatch(/^Basic /);

    // Decode and verify format
    const base64Part = headers.Authorization.replace("Basic ", "");
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

    // API key should be used as username with empty password (ends with :)
    expect(decoded).toBe("test-api-key:");
  });

  it("should map snake_case API response to camelCase", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockCompanyResponse, 200),
    );

    const result = await getCompany("00000006");

    // Verify all fields are camelCase
    expect(result).toHaveProperty("companyNumber");
    expect(result).toHaveProperty("companyName");
    expect(result).toHaveProperty("dateOfCreation");
    expect(result).toHaveProperty("registeredOffice");
    expect(result.registeredOffice).toHaveProperty("addressLine1");
    expect(result.registeredOffice).toHaveProperty("addressLine2");
    expect(result.registeredOffice).toHaveProperty("postalCode");
    expect(result).toHaveProperty("sicCodes");

    // Verify no snake_case fields exist
    expect(result).not.toHaveProperty("company_number");
    expect(result).not.toHaveProperty("company_name");
    expect(result).not.toHaveProperty("date_of_creation");
    expect(result).not.toHaveProperty("registered_office_address");
  });

  it("should handle missing API key gracefully", async () => {
    delete process.env.COMPANIES_HOUSE_API_KEY;

    await expect(getCompany("00000006")).rejects.toThrow(CompaniesHouseError);

    await expect(getCompany("00000006")).rejects.toThrow(
      "COMPANIES_HOUSE_API_KEY environment variable is not set",
    );
  });

  it("should handle company with no SIC codes", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const responseWithoutSIC = {
      ...mockCompanyResponse,
      sic_codes: undefined,
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseWithoutSIC, 200));

    const result = await getCompany("00000006");

    expect(result.sicCodes).toBeUndefined();
  });

  it("should handle company with incomplete address", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const responseWithMinimalAddress = {
      ...mockCompanyResponse,
      registered_office_address: {
        locality: "London",
        postal_code: "W1A 1AA",
      },
    };
    mockFetch.mockResolvedValueOnce(
      createMockResponse(responseWithMinimalAddress, 200),
    );

    const result = await getCompany("00000006");

    expect(result.registeredOffice.locality).toBe("London");
    expect(result.registeredOffice.postalCode).toBe("W1A 1AA");
    expect(result.registeredOffice.addressLine1).toBeUndefined();
    expect(result.registeredOffice.addressLine2).toBeUndefined();
  });
});

// ============================================================================
// Test Suite: getOfficers()
// ============================================================================

describe("getOfficers()", () => {
  it("should successfully fetch officers array", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockOfficersResponse, 200),
    );

    const result = await getOfficers("00000006");

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.company-information.service.gov.uk/company/00000006/officers",
      expect.any(Object),
    );

    // Verify auth header
    verifyAuthHeader(mockFetch);

    // Verify response structure and mapping
    expect(result).toHaveLength(2);
    expect(result).toEqual<Officer[]>([
      {
        name: "SMITH, John",
        role: "director",
        appointedOn: "2020-01-01",
        resignedOn: undefined,
      },
      {
        name: "DOE, Jane",
        role: "secretary",
        appointedOn: "2019-06-15",
        resignedOn: "2023-12-31",
      },
    ]);
  });

  it("should handle empty officers list", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ items: [] }, 200),
    );

    const result = await getOfficers("00000006");

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("should throw CompanyNotFoundError on 404 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(404));

    try {
      await getOfficers("99999999");
      expect.fail("Should have thrown CompanyNotFoundError");
    } catch (error) {
      expect(error).toBeInstanceOf(CompanyNotFoundError);
      expect((error as CompanyNotFoundError).message).toBe(
        "Company 99999999 not found",
      );
    }
  });

  it("should throw RateLimitError on 429 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(429));

    try {
      await getOfficers("00000006");
      expect.fail("Should have thrown RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).message).toBe(
        "Companies House API rate limit exceeded",
      );
    }
  });

  it("should throw APIServerError on 500 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(500));

    try {
      await getOfficers("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 500",
      );
    }
  });

  it("should throw NetworkError on fetch failure", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error("Connection timeout");
    mockFetch.mockRejectedValueOnce(networkError);

    try {
      await getOfficers("00000006");
      expect.fail("Should have thrown NetworkError");
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).message).toContain("Connection timeout");
    }
  });

  it("should map snake_case API response to camelCase", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockOfficersResponse, 200),
    );

    const result = await getOfficers("00000006");

    // Verify all fields are camelCase
    expect(result[0]).toHaveProperty("role");
    expect(result[0]).toHaveProperty("appointedOn");
    expect(result[1]).toHaveProperty("resignedOn");

    // Verify no snake_case fields exist
    expect(result[0]).not.toHaveProperty("officer_role");
    expect(result[0]).not.toHaveProperty("appointed_on");
    expect(result[1]).not.toHaveProperty("resigned_on");
  });

  it("should handle officers without resignation date", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const activeOfficersOnly = {
      items: [
        {
          name: "ACTIVE, Director",
          officer_role: "director",
          appointed_on: "2023-01-01",
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(activeOfficersOnly, 200));

    const result = await getOfficers("00000006");

    expect(result).toHaveLength(1);
    expect(result[0].resignedOn).toBeUndefined();
  });
});

// ============================================================================
// Test Suite: getPSCs()
// ============================================================================

describe("getPSCs()", () => {
  it("should successfully fetch PSCs array", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockPSCsResponse, 200),
    );

    const result = await getPSCs("00000006");

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.company-information.service.gov.uk/company/00000006/persons-with-significant-control",
      expect.any(Object),
    );

    // Verify auth header
    verifyAuthHeader(mockFetch);

    // Verify response structure and mapping
    expect(result).toHaveLength(2);
    expect(result).toEqual<PSC[]>([
      {
        name: "Jane DOE",
        notifiedOn: "2020-01-01",
        natureOfControl: [
          "ownership-of-shares-25-to-50-percent",
          "voting-rights-25-to-50-percent",
        ],
        kind: "individual-person-with-significant-control",
      },
      {
        name: "ABC Holdings Ltd",
        notifiedOn: "2019-03-15",
        natureOfControl: ["ownership-of-shares-50-to-75-percent"],
        kind: "corporate-entity-person-with-significant-control",
      },
    ]);
  });

  it("should handle empty PSCs list", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ items: [] }, 200),
    );

    const result = await getPSCs("00000006");

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("should throw CompanyNotFoundError on 404 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(404));

    try {
      await getPSCs("99999999");
      expect.fail("Should have thrown CompanyNotFoundError");
    } catch (error) {
      expect(error).toBeInstanceOf(CompanyNotFoundError);
      expect((error as CompanyNotFoundError).message).toBe(
        "Company 99999999 not found",
      );
    }
  });

  it("should throw RateLimitError on 429 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(429));

    try {
      await getPSCs("00000006");
      expect.fail("Should have thrown RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).message).toBe(
        "Companies House API rate limit exceeded",
      );
    }
  });

  it("should throw APIServerError on 500 response", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(createMockErrorResponse(500));

    try {
      await getPSCs("00000006");
      expect.fail("Should have thrown APIServerError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIServerError);
      expect((error as APIServerError).message).toBe(
        "Companies House API server error: 500",
      );
    }
  });

  it("should throw NetworkError on fetch failure", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const networkError = new Error("DNS resolution failed");
    mockFetch.mockRejectedValueOnce(networkError);

    try {
      await getPSCs("00000006");
      expect.fail("Should have thrown NetworkError");
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect((error as NetworkError).message).toContain("DNS resolution failed");
    }
  });

  it("should map snake_case API response to camelCase", async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockPSCsResponse, 200),
    );

    const result = await getPSCs("00000006");

    // Verify all fields are camelCase
    expect(result[0]).toHaveProperty("notifiedOn");
    expect(result[0]).toHaveProperty("natureOfControl");

    // Verify no snake_case fields exist
    expect(result[0]).not.toHaveProperty("notified_on");
    expect(result[0]).not.toHaveProperty("natures_of_control");
  });

  it("should handle PSC with single nature of control", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const singleControlPSC = {
      items: [
        {
          name: "Single Control Person",
          notified_on: "2023-01-01",
          natures_of_control: ["ownership-of-shares-75-to-100-percent"],
          kind: "individual-person-with-significant-control",
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(singleControlPSC, 200));

    const result = await getPSCs("00000006");

    expect(result).toHaveLength(1);
    expect(result[0].natureOfControl).toEqual([
      "ownership-of-shares-75-to-100-percent",
    ]);
  });

  it("should handle corporate entity PSCs", async () => {
    const mockFetch = vi.mocked(global.fetch);
    const corporatePSC = {
      items: [
        {
          name: "Parent Company Ltd",
          notified_on: "2022-06-01",
          natures_of_control: [
            "ownership-of-shares-75-to-100-percent",
            "voting-rights-75-to-100-percent",
            "right-to-appoint-and-remove-directors",
          ],
          kind: "corporate-entity-person-with-significant-control",
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(createMockResponse(corporatePSC, 200));

    const result = await getPSCs("00000006");

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe(
      "corporate-entity-person-with-significant-control",
    );
    expect(result[0].natureOfControl).toHaveLength(3);
  });
});

// ============================================================================
// Test Suite: Error Classes
// ============================================================================

describe("Error Classes", () => {
  it("should create CompanyNotFoundError with correct properties", () => {
    const error = new CompanyNotFoundError("12345678");

    expect(error).toBeInstanceOf(CompanyNotFoundError);
    expect(error).toBeInstanceOf(CompaniesHouseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("CompanyNotFoundError");
    expect(error.message).toBe("Company 12345678 not found");
    expect(error.statusCode).toBe(404);
    expect(error.companyNumber).toBe("12345678");
  });

  it("should create RateLimitError with correct properties", () => {
    const error = new RateLimitError();

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toBeInstanceOf(CompaniesHouseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RateLimitError");
    expect(error.message).toBe("Companies House API rate limit exceeded");
    expect(error.statusCode).toBe(429);
  });

  it("should create APIServerError with correct properties", () => {
    const error = new APIServerError(503);

    expect(error).toBeInstanceOf(APIServerError);
    expect(error).toBeInstanceOf(CompaniesHouseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("APIServerError");
    expect(error.message).toBe("Companies House API server error: 503");
    expect(error.statusCode).toBe(503);
  });

  it("should create NetworkError with correct properties", () => {
    const originalError = new Error("Connection refused");
    const error = new NetworkError(originalError);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toBeInstanceOf(CompaniesHouseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NetworkError");
    expect(error.message).toContain(
      "Network error connecting to Companies House API",
    );
    expect(error.message).toContain("Connection refused");
  });

  it("should handle NetworkError with non-Error objects", () => {
    const error = new NetworkError("String error message");

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toContain("String error message");
  });
});
