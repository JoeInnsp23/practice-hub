/**
 * External API Documentation
 *
 * Documentation for third-party APIs integrated with Practice Hub:
 * - Companies House API
 * - HMRC APIs (MTD, VAT, Corporation Tax)
 * - DocuSeal (E-Signature)
 */

export interface ExternalApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  authentication: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    contentType: string;
    schema: string;
    example?: string;
  };
  responseExample?: string;
  rateLimit?: string;
  documentation?: string;
}

export interface ExternalApiDoc {
  name: string;
  description: string;
  baseUrl: string;
  authentication: {
    type: string;
    description: string;
  };
  endpoints: ExternalApiEndpoint[];
  links: {
    officialDocs: string;
    apiReference?: string;
    developerPortal?: string;
  };
}

/**
 * Companies House API Documentation
 */
export const companiesHouseApi: ExternalApiDoc = {
  name: "Companies House API",
  description:
    "UK Companies House REST API for company information, filing history, and director details",
  baseUrl: "https://api.company-information.service.gov.uk",
  authentication: {
    type: "HTTP Basic Auth",
    description:
      "API key as username, password left blank. Set COMPANIES_HOUSE_API_KEY in environment variables.",
  },
  endpoints: [
    {
      method: "GET",
      path: "/company/{companyNumber}",
      description: "Get company profile information",
      authentication: "API Key (Basic Auth)",
      parameters: [
        {
          name: "companyNumber",
          type: "string",
          required: true,
          description: "8-character company number (e.g., '12345678')",
        },
      ],
      responseExample: JSON.stringify(
        {
          company_number: "12345678",
          company_name: "ACME LIMITED",
          company_status: "active",
          type: "ltd",
          registered_office_address: {
            address_line_1: "123 Business Street",
            locality: "London",
            postal_code: "SW1A 1AA",
          },
        },
        null,
        2,
      ),
      rateLimit: "600 requests per 5 minutes",
      documentation:
        "https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/company-profile/company-profile",
    },
    {
      method: "GET",
      path: "/company/{companyNumber}/officers",
      description: "List company officers (directors and secretaries)",
      authentication: "API Key (Basic Auth)",
      parameters: [
        {
          name: "companyNumber",
          type: "string",
          required: true,
          description: "8-character company number",
        },
        {
          name: "items_per_page",
          type: "number",
          required: false,
          description: "Number of items per page (default: 35, max: 100)",
        },
        {
          name: "start_index",
          type: "number",
          required: false,
          description: "Start index for pagination (default: 0)",
        },
      ],
      responseExample: JSON.stringify(
        {
          items: [
            {
              name: "SMITH, John",
              officer_role: "director",
              appointed_on: "2020-01-15",
              date_of_birth: {
                month: 3,
                year: 1980,
              },
            },
          ],
          total_results: 1,
        },
        null,
        2,
      ),
      rateLimit: "600 requests per 5 minutes",
      documentation:
        "https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers/officers-list",
    },
    {
      method: "GET",
      path: "/company/{companyNumber}/persons-with-significant-control",
      description: "Get persons with significant control (PSCs)",
      authentication: "API Key (Basic Auth)",
      parameters: [
        {
          name: "companyNumber",
          type: "string",
          required: true,
          description: "8-character company number",
        },
      ],
      responseExample: JSON.stringify(
        {
          items: [
            {
              name: "John Smith",
              natures_of_control: [
                "ownership-of-shares-75-to-100-percent",
                "voting-rights-75-to-100-percent",
              ],
              notified_on: "2020-01-15",
            },
          ],
        },
        null,
        2,
      ),
      rateLimit: "600 requests per 5 minutes",
      documentation:
        "https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/persons-with-significant-control/psc-list",
    },
  ],
  links: {
    officialDocs: "https://developer.company-information.service.gov.uk/",
    apiReference:
      "https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference",
    developerPortal:
      "https://developer.company-information.service.gov.uk/get-started",
  },
};

/**
 * HMRC Making Tax Digital API Documentation
 */
export const hmrcApi: ExternalApiDoc = {
  name: "HMRC Making Tax Digital API",
  description:
    "UK HMRC APIs for VAT submissions, Corporation Tax, and Self Assessment under Making Tax Digital (MTD)",
  baseUrl: "https://api.service.hmrc.gov.uk",
  authentication: {
    type: "OAuth 2.0",
    description:
      "OAuth 2.0 authorization with client credentials and user authorization. Requires HMRC Developer Hub application setup.",
  },
  endpoints: [
    {
      method: "POST",
      path: "/oauth/token",
      description: "Get OAuth access token",
      authentication: "Client credentials",
      requestBody: {
        contentType: "application/x-www-form-urlencoded",
        schema: "client_id, client_secret, grant_type, redirect_uri, code",
        example:
          "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code&redirect_uri=YOUR_REDIRECT_URI&code=AUTH_CODE",
      },
      responseExample: JSON.stringify(
        {
          access_token: "ACCESS_TOKEN",
          refresh_token: "REFRESH_TOKEN",
          expires_in: 14400,
          token_type: "bearer",
        },
        null,
        2,
      ),
      documentation:
        "https://developer.service.hmrc.gov.uk/api-documentation/docs/authorisation/user-restricted-endpoints",
    },
    {
      method: "GET",
      path: "/organisations/vat/{vrn}/obligations",
      description: "Retrieve VAT obligations (filing deadlines)",
      authentication: "OAuth 2.0 Bearer Token",
      parameters: [
        {
          name: "vrn",
          type: "string",
          required: true,
          description: "VAT Registration Number (9 digits)",
        },
        {
          name: "from",
          type: "string",
          required: true,
          description: "Start date (YYYY-MM-DD)",
        },
        {
          name: "to",
          type: "string",
          required: true,
          description: "End date (YYYY-MM-DD)",
        },
        {
          name: "status",
          type: "string",
          required: false,
          description: "O (Open) or F (Fulfilled)",
        },
      ],
      responseExample: JSON.stringify(
        {
          obligations: [
            {
              start: "2025-01-01",
              end: "2025-03-31",
              due: "2025-05-07",
              status: "O",
              periodKey: "25A1",
            },
          ],
        },
        null,
        2,
      ),
      rateLimit: "3 requests per second",
      documentation:
        "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/",
    },
    {
      method: "POST",
      path: "/organisations/vat/{vrn}/returns",
      description: "Submit VAT return",
      authentication: "OAuth 2.0 Bearer Token",
      parameters: [
        {
          name: "vrn",
          type: "string",
          required: true,
          description: "VAT Registration Number",
        },
      ],
      requestBody: {
        contentType: "application/json",
        schema: JSON.stringify(
          {
            periodKey: "string",
            vatDueSales: "number",
            vatDueAcquisitions: "number",
            totalVatDue: "number",
            vatReclaimedCurrPeriod: "number",
            netVatDue: "number",
            totalValueSalesExVAT: "number",
            totalValuePurchasesExVAT: "number",
            totalValueGoodsSuppliedExVAT: "number",
            totalAcquisitionsExVAT: "number",
            finalised: "boolean",
          },
          null,
          2,
        ),
      },
      responseExample: JSON.stringify(
        {
          processingDate: "2025-01-15T09:30:47Z",
          paymentIndicator: "DD",
          formBundleNumber: "256660290587",
        },
        null,
        2,
      ),
      rateLimit: "3 requests per second",
      documentation:
        "https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/",
    },
  ],
  links: {
    officialDocs: "https://developer.service.hmrc.gov.uk/",
    apiReference:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/api",
    developerPortal:
      "https://developer.service.hmrc.gov.uk/api-documentation/docs/using-the-hub",
  },
};

/**
 * DocuSeal API Documentation
 */
export const docuSealApi: ExternalApiDoc = {
  name: "DocuSeal API",
  description:
    "Self-hosted electronic signature platform for document signing workflows",
  baseUrl: process.env.DOCUSEAL_HOST || "http://localhost:3030",
  authentication: {
    type: "API Key",
    description:
      "API key in X-Auth-Token header. Generate from DocuSeal Admin UI: Settings → API Keys",
  },
  endpoints: [
    {
      method: "POST",
      path: "/api/submissions",
      description: "Create new submission from template",
      authentication: "X-Auth-Token header",
      requestBody: {
        contentType: "application/json",
        schema: JSON.stringify(
          {
            template_id: "number",
            send_email: "boolean",
            send_sms: "boolean",
            reply_to: "string (email)",
            submitters: [
              {
                role: "string",
                email: "string",
                name: "string",
                phone: "string (optional)",
                values: "object (optional)",
              },
            ],
          },
          null,
          2,
        ),
        example: JSON.stringify(
          {
            template_id: 123,
            send_email: true,
            submitters: [
              {
                role: "Client",
                email: "client@example.com",
                name: "John Smith",
              },
            ],
          },
          null,
          2,
        ),
      },
      responseExample: JSON.stringify(
        {
          id: 456,
          slug: "abc123",
          status: "pending",
          submitters: [
            {
              id: 789,
              email: "client@example.com",
              status: "pending",
            },
          ],
        },
        null,
        2,
      ),
      documentation:
        "https://www.docuseal.co/docs/api#create-submissions-from-template",
    },
    {
      method: "GET",
      path: "/api/submissions/{id}",
      description: "Get submission details",
      authentication: "X-Auth-Token header",
      parameters: [
        {
          name: "id",
          type: "number",
          required: true,
          description: "Submission ID",
        },
      ],
      responseExample: JSON.stringify(
        {
          id: 456,
          slug: "abc123",
          status: "completed",
          audit_log_url: "https://docuseal.co/s/abc123/audit_log",
          submitters: [
            {
              id: 789,
              email: "client@example.com",
              status: "completed",
              completed_at: "2025-01-15T10:30:00Z",
            },
          ],
        },
        null,
        2,
      ),
      documentation: "https://www.docuseal.co/docs/api#get-a-submission",
    },
    {
      method: "POST",
      path: "/api/webhooks",
      description: "Configure webhook for submission events",
      authentication: "X-Auth-Token header",
      requestBody: {
        contentType: "application/json",
        schema: JSON.stringify(
          {
            url: "string (webhook URL)",
            events: ["string (event types)"],
            secret: "string (optional)",
          },
          null,
          2,
        ),
        example: JSON.stringify(
          {
            url: "https://yourapp.com/api/webhooks/docuseal",
            events: ["submission.completed", "submission.declined"],
            secret: "your-webhook-secret",
          },
          null,
          2,
        ),
      },
      responseExample: JSON.stringify(
        {
          id: 123,
          url: "https://yourapp.com/api/webhooks/docuseal",
          events: ["submission.completed", "submission.declined"],
        },
        null,
        2,
      ),
      documentation: "https://www.docuseal.co/docs/api#create-a-webhook",
    },
  ],
  links: {
    officialDocs: "https://www.docuseal.co/docs",
    apiReference: "https://www.docuseal.co/docs/api",
  },
};

/**
 * Get all external API documentation
 */
export function getAllExternalApis(): ExternalApiDoc[] {
  return [companiesHouseApi, hmrcApi, docuSealApi];
}
