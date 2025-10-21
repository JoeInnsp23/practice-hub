/**
 * Companies House API Client
 *
 * Provides type-safe access to Companies House API endpoints for:
 * - Company details lookup
 * - Officers (directors, secretaries) lookup
 * - Persons with Significant Control (PSC) lookup
 *
 * Documentation: https://developer-specs.company-information.service.gov.uk/
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface CompanyDetails {
  companyNumber: string;
  companyName: string;
  status: string;
  type: string;
  registeredOffice: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  dateOfCreation: string;
  sicCodes?: string[];
}

export interface Officer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
}

export interface PSC {
  name: string;
  notifiedOn: string;
  natureOfControl: string[];
  kind: string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class CompaniesHouseError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public companyNumber?: string,
  ) {
    super(message);
    this.name = "CompaniesHouseError";
  }
}

export class CompanyNotFoundError extends CompaniesHouseError {
  constructor(companyNumber: string) {
    super(`Company ${companyNumber} not found`, 404, companyNumber);
    this.name = "CompanyNotFoundError";
  }
}

export class RateLimitError extends CompaniesHouseError {
  constructor() {
    super("Companies House API rate limit exceeded", 429);
    this.name = "RateLimitError";
  }
}

export class APIServerError extends CompaniesHouseError {
  constructor(statusCode: number) {
    super(`Companies House API server error: ${statusCode}`, statusCode);
    this.name = "APIServerError";
  }
}

export class NetworkError extends CompaniesHouseError {
  constructor(originalError: unknown) {
    super(
      `Network error connecting to Companies House API: ${originalError instanceof Error ? originalError.message : String(originalError)}`,
    );
    this.name = "NetworkError";
  }
}

// ============================================================================
// API Client Configuration
// ============================================================================

const BASE_URL = "https://api.company-information.service.gov.uk";

/**
 * Get Companies House API key from environment variables
 */
function getAPIKey(): string {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    throw new CompaniesHouseError(
      "COMPANIES_HOUSE_API_KEY environment variable is not set",
    );
  }
  return apiKey;
}

/**
 * Create Basic Auth header for Companies House API
 * Format: Authorization: Basic base64(api_key:)
 * Note: The API key is used as username with empty password
 */
function createAuthHeader(apiKey: string): string {
  const credentials = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchCompaniesHouseAPI<T>(
  endpoint: string,
  companyNumber?: string,
): Promise<T> {
  const apiKey = getAPIKey();
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: createAuthHeader(apiKey),
        Accept: "application/json",
      },
    });

    // Handle specific HTTP error codes
    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw new CompanyNotFoundError(companyNumber || "unknown");
        case 429:
          throw new RateLimitError();
        case 500:
        case 502:
        case 503:
        case 504:
          throw new APIServerError(response.status);
        default:
          throw new CompaniesHouseError(
            `API request failed with status ${response.status}`,
            response.status,
            companyNumber,
          );
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof CompaniesHouseError) {
      throw error;
    }

    // Wrap network/fetch errors
    throw new NetworkError(error);
  }
}

// ============================================================================
// API Response Types (Internal)
// ============================================================================

interface CompanyProfileResponse {
  company_number: string;
  company_name: string;
  company_status: string;
  type: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  date_of_creation: string;
  sic_codes?: string[];
}

interface OfficersResponse {
  items: Array<{
    name: string;
    officer_role: string;
    appointed_on: string;
    resigned_on?: string;
  }>;
}

interface PSCResponse {
  items: Array<{
    name: string;
    notified_on: string;
    natures_of_control: string[];
    kind: string;
  }>;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get company details by company number
 *
 * @param companyNumber - The company number (e.g., "00000006", "SC123456")
 * @returns Company details including registered office and SIC codes
 * @throws {CompanyNotFoundError} If company doesn't exist
 * @throws {RateLimitError} If API rate limit exceeded
 * @throws {APIServerError} If Companies House API has server error
 * @throws {NetworkError} If network request fails
 *
 * @example
 * ```typescript
 * const company = await getCompany("00000006");
 * console.log(company.companyName); // "MARINE AND GENERAL MUTUAL LIFE ASSURANCE SOCIETY"
 * ```
 */
export async function getCompany(
  companyNumber: string,
): Promise<CompanyDetails> {
  const response = await fetchCompaniesHouseAPI<CompanyProfileResponse>(
    `/company/${companyNumber}`,
    companyNumber,
  );

  return {
    companyNumber: response.company_number,
    companyName: response.company_name,
    status: response.company_status,
    type: response.type,
    registeredOffice: {
      addressLine1: response.registered_office_address.address_line_1,
      addressLine2: response.registered_office_address.address_line_2,
      locality: response.registered_office_address.locality,
      region: response.registered_office_address.region,
      postalCode: response.registered_office_address.postal_code,
      country: response.registered_office_address.country,
    },
    dateOfCreation: response.date_of_creation,
    sicCodes: response.sic_codes,
  };
}

/**
 * Get list of officers (directors, secretaries) for a company
 *
 * @param companyNumber - The company number (e.g., "00000006")
 * @returns Array of officers with their roles and appointment dates
 * @throws {CompanyNotFoundError} If company doesn't exist
 * @throws {RateLimitError} If API rate limit exceeded
 * @throws {APIServerError} If Companies House API has server error
 * @throws {NetworkError} If network request fails
 *
 * @example
 * ```typescript
 * const officers = await getOfficers("00000006");
 * officers.forEach(officer => {
 *   console.log(`${officer.name} - ${officer.role}`);
 * });
 * ```
 */
export async function getOfficers(companyNumber: string): Promise<Officer[]> {
  const response = await fetchCompaniesHouseAPI<OfficersResponse>(
    `/company/${companyNumber}/officers`,
    companyNumber,
  );

  return response.items.map((item) => ({
    name: item.name,
    role: item.officer_role,
    appointedOn: item.appointed_on,
    resignedOn: item.resigned_on,
  }));
}

/**
 * Get Persons with Significant Control (PSC) for a company
 *
 * PSCs are individuals or entities with significant influence or control over a company,
 * such as shareholders with >25% ownership or voting rights.
 *
 * @param companyNumber - The company number (e.g., "00000006")
 * @returns Array of PSCs with their control details
 * @throws {CompanyNotFoundError} If company doesn't exist
 * @throws {RateLimitError} If API rate limit exceeded
 * @throws {APIServerError} If Companies House API has server error
 * @throws {NetworkError} If network request fails
 *
 * @example
 * ```typescript
 * const pscs = await getPSCs("00000006");
 * pscs.forEach(psc => {
 *   console.log(`${psc.name} - ${psc.kind}`);
 *   console.log(`Nature of control: ${psc.natureOfControl.join(", ")}`);
 * });
 * ```
 */
export async function getPSCs(companyNumber: string): Promise<PSC[]> {
  const response = await fetchCompaniesHouseAPI<PSCResponse>(
    `/company/${companyNumber}/persons-with-significant-control`,
    companyNumber,
  );

  return response.items.map((item) => ({
    name: item.name,
    notifiedOn: item.notified_on,
    natureOfControl: item.natures_of_control,
    kind: item.kind,
  }));
}
