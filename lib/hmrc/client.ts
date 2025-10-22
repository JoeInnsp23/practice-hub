/**
 * HMRC VAT API Client
 *
 * Provides type-safe access to HMRC VAT API endpoints for:
 * - VAT number validation
 * - Business name retrieval
 *
 * Documentation: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-registered-companies-api
 *
 * Authentication: OAuth 2.0 Server-to-Server (Client Credentials Grant)
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface VATValidationResult {
  isValid: boolean;
  vatNumber: string;
  businessName?: string;
  businessAddress?: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
    line5?: string;
    postcode?: string;
    countryCode?: string;
  };
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class HMRCError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public vatNumber?: string,
  ) {
    super(message);
    this.name = "HMRCError";
  }
}

export class VATNotFoundError extends HMRCError {
  constructor(vatNumber: string) {
    super(`VAT number ${vatNumber} not found or invalid`, 404, vatNumber);
    this.name = "VATNotFoundError";
  }
}

export class RateLimitError extends HMRCError {
  constructor() {
    super("HMRC API rate limit exceeded", 429);
    this.name = "RateLimitError";
  }
}

export class APIServerError extends HMRCError {
  constructor(statusCode: number) {
    super(`HMRC API server error: ${statusCode}`, statusCode);
    this.name = "APIServerError";
  }
}

export class NetworkError extends HMRCError {
  constructor(originalError: unknown) {
    super(
      `Network error connecting to HMRC API: ${originalError instanceof Error ? originalError.message : String(originalError)}`,
    );
    this.name = "NetworkError";
  }
}

export class AuthenticationError extends HMRCError {
  constructor(message: string) {
    super(`HMRC authentication failed: ${message}`, 401);
    this.name = "AuthenticationError";
  }
}

// ============================================================================
// API Client Configuration
// ============================================================================

/**
 * Get HMRC API endpoint based on sandbox mode
 */
function getBaseURL(): string {
  const isSandbox = process.env.HMRC_SANDBOX_MODE === "true";
  return isSandbox
    ? "https://test-api.service.hmrc.gov.uk"
    : "https://api.service.hmrc.gov.uk";
}

/**
 * Get HMRC OAuth credentials from environment variables
 */
function getOAuthCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new HMRCError(
      "HMRC_CLIENT_ID and HMRC_CLIENT_SECRET environment variables must be set",
    );
  }

  return { clientId, clientSecret };
}

// ============================================================================
// OAuth 2.0 Token Management
// ============================================================================

let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

/**
 * Reset cached token (for testing purposes only)
 * @internal
 */
export function __resetTokenCache() {
  cachedToken = null;
}

/**
 * Get OAuth 2.0 access token using Client Credentials Grant
 *
 * Token is cached in memory until it expires (minus 60 second buffer)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60 second buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  const { clientId, clientSecret } = getOAuthCredentials();
  const baseURL = getBaseURL();
  const tokenEndpoint = `${baseURL}/oauth/token`;

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "read:vat",
      }),
    });

    if (!response.ok) {
      throw new AuthenticationError(
        `Token request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as OAuthTokenResponse;

    // Cache the token
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  } catch (error) {
    if (error instanceof HMRCError) {
      throw error;
    }
    throw new NetworkError(error);
  }
}

/**
 * Generic fetch wrapper with OAuth authentication and error handling
 */
async function fetchHMRCAPI<T>(
  endpoint: string,
  vatNumber?: string,
): Promise<T> {
  const baseURL = getBaseURL();
  const url = `${baseURL}${endpoint}`;

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.hmrc.1.0+json",
      },
    });

    // Handle specific HTTP error codes
    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw new VATNotFoundError(vatNumber || "unknown");
        case 429:
          throw new RateLimitError();
        case 401:
        case 403:
          // Token might be invalid, clear cache and retry once
          cachedToken = null;
          throw new AuthenticationError(
            `Authentication failed with status ${response.status}`,
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new APIServerError(response.status);
        default:
          throw new HMRCError(
            `API request failed with status ${response.status}`,
            response.status,
            vatNumber,
          );
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof HMRCError) {
      throw error;
    }

    // Wrap network/fetch errors
    throw new NetworkError(error);
  }
}

// ============================================================================
// API Response Types (Internal)
// ============================================================================

interface VATLookupResponse {
  target: {
    name?: string;
    vatNumber: string;
    address?: {
      line1?: string;
      line2?: string;
      line3?: string;
      line4?: string;
      line5?: string;
      postcode?: string;
      countryCode?: string;
    };
  };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Validate a UK VAT number and retrieve business details
 *
 * @param vatNumber - The UK VAT number (e.g., "GB123456789", "123456789")
 * @returns Validation result with business details if found
 * @throws {VATNotFoundError} If VAT number is not registered or invalid
 * @throws {RateLimitError} If API rate limit exceeded
 * @throws {APIServerError} If HMRC API has server error
 * @throws {AuthenticationError} If OAuth authentication fails
 * @throws {NetworkError} If network request fails
 *
 * @example
 * ```typescript
 * const result = await validateVAT("GB123456789");
 * if (result.isValid) {
 *   console.log(`Business: ${result.businessName}`);
 * }
 * ```
 */
export async function validateVAT(
  vatNumber: string,
): Promise<VATValidationResult> {
  // Normalize VAT number (remove GB prefix if present)
  const normalizedVAT = vatNumber.replace(/^GB/i, "").trim();

  try {
    const response = await fetchHMRCAPI<VATLookupResponse>(
      `/organisations/vat/check-vat-number/lookup/${normalizedVAT}`,
      vatNumber,
    );

    return {
      isValid: true,
      vatNumber: response.target.vatNumber,
      businessName: response.target.name,
      businessAddress: response.target.address,
    };
  } catch (error) {
    // If VAT not found, return invalid result instead of throwing
    if (error instanceof VATNotFoundError) {
      return {
        isValid: false,
        vatNumber: normalizedVAT,
      };
    }

    // Re-throw other errors
    throw error;
  }
}
