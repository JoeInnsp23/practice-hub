/**
 * LEM Verify API Client
 *
 * Complete KYC/AML verification solution integrating:
 * - Document verification (UK passport, UK driving license)
 * - Face matching (biometric verification)
 * - Liveness detection (video-based)
 * - AML/PEP screening via LexisNexis WorldCompliance
 *
 * Documentation: https://lemverify.com/docs.html
 * Cost: £1 per verification (vs ComplyCube £4-6)
 * UK MLR 2017 compliant via LexisNexis partnership
 *
 * CURRENT IMPLEMENTATION (v1.0):
 * - Uses LEM Verify hosted verification page
 * - Client uploads documents to LEM Verify's platform
 * - Results received via webhook
 *
 * FUTURE OPTIMIZATION (v2.0 - Pending API Documentation):
 * - Direct document upload via API (no hosted page)
 * - Unified experience within our app
 * - TODO: Contact LEM Verify support for complete "Upload a Document" API docs
 * - TODO: Add uploadDocument(), uploadSelfie(), uploadLivenessVideo() methods
 * - See: /docs/kyc/LEMVERIFY_INTEGRATION.md for details
 */

const LEMVERIFY_API_URL =
  process.env.LEMVERIFY_API_URL || "https://api.lemverify.com/v1";
const LEMVERIFY_API_KEY = process.env.LEMVERIFY_API_KEY;
const LEMVERIFY_ACCOUNT_ID = process.env.LEMVERIFY_ACCOUNT_ID;

if (!LEMVERIFY_API_KEY) {
  console.warn("LEMVERIFY_API_KEY not configured - KYC checks will fail");
}

if (!LEMVERIFY_ACCOUNT_ID) {
  console.warn("LEMVERIFY_ACCOUNT_ID not configured - KYC checks will fail");
}

/**
 * Verification request input
 */
export interface VerificationRequest {
  clientRef: string; // Our internal reference (e.g., client ID)
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  phoneNumber?: string;
  callbackUrl?: string; // Webhook URL for status updates
  metadata?: Record<string, unknown>; // Custom data
}

/**
 * Verification response from LEM Verify
 */
export interface VerificationResponse {
  id: string; // LEM Verify verification ID
  clientRef: string;
  status: "pending" | "completed" | "failed";
  verificationUrl: string; // URL to send to client for verification
  createdAt: string;
}

/**
 * Complete verification status including all checks
 */
export interface VerificationStatus {
  id: string;
  clientRef: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  outcome?: "pass" | "fail" | "refer";

  // Document verification
  documentVerification?: {
    verified: boolean;
    documentType: "passport" | "driving_licence";
    extractedData?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      documentNumber: string;
      expiryDate: string;
      nationality?: string;
    };
  };

  // Biometric verification
  facematch?: {
    result: "pass" | "fail";
    score: number; // 0-100
  };

  liveness?: {
    result: "pass" | "fail";
    score: number; // 0-100
  };

  // AML screening (LexisNexis)
  amlScreening?: {
    status: "clear" | "match" | "pep";
    pepMatch: boolean;
    sanctionsMatch: boolean;
    watchlistMatch: boolean;
    adverseMediaMatch: boolean;
    matches?: Array<{
      type: string;
      name: string;
      score: number;
    }>;
  };

  // URLs
  reportUrl?: string;
  documentUrls?: string[];

  // Timestamps
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

/**
 * LEM Verify API Client
 */
class LemVerifyAPIClient {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;

  constructor(apiKey?: string, accountId?: string) {
    this.apiKey = apiKey || LEMVERIFY_API_KEY || "";
    this.accountId = accountId || LEMVERIFY_ACCOUNT_ID || "";
    this.baseUrl = LEMVERIFY_API_URL;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("LEM Verify API key not configured");
    }

    if (!this.accountId) {
      throw new Error("LEM Verify account ID not configured");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "X-Account-ID": this.accountId,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LEM Verify API error (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  }

  /**
   * Initiate a verification request
   *
   * Returns a verification URL that should be sent to the client via email.
   * The client will upload their documents and complete biometric checks.
   */
  async requestVerification(
    request: VerificationRequest,
  ): Promise<VerificationResponse> {
    console.log("Requesting LEM Verify verification for:", request.clientRef);

    return this.request<VerificationResponse>("/verifications", "POST", {
      clientRef: request.clientRef,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      dateOfBirth: request.dateOfBirth,
      phoneNumber: request.phoneNumber,
      callbackUrl: request.callbackUrl,
      metadata: request.metadata,
    });
  }

  /**
   * Get verification status
   *
   * Check the current status of a verification including all check results.
   */
  async getVerificationStatus(
    verificationId: string,
  ): Promise<VerificationStatus> {
    return this.request<VerificationStatus>(`/verifications/${verificationId}`);
  }

  /**
   * Download PDF report
   *
   * Returns the compliance report as a Buffer for storage in S3/MinIO.
   */
  async downloadReport(verificationId: string): Promise<Buffer> {
    const response = await fetch(
      `${this.baseUrl}/verifications/${verificationId}/report`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "X-Account-ID": this.accountId,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Report download failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Download uploaded documents
   *
   * Returns URLs or buffers for the documents uploaded by the client.
   */
  async downloadDocuments(verificationId: string): Promise<{
    passport?: Buffer;
    drivingLicence?: Buffer;
    selfie?: Buffer;
    video?: Buffer;
  }> {
    // Get document URLs from verification status
    const status = await this.getVerificationStatus(verificationId);
    const documents: {
      passport?: Buffer;
      drivingLicence?: Buffer;
      selfie?: Buffer;
      video?: Buffer;
    } = {};

    if (!status.documentUrls || status.documentUrls.length === 0) {
      return documents;
    }

    // Download each document
    for (const url of status.documentUrls) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "X-Account-ID": this.accountId,
        },
      });

      if (!response.ok) {
        console.error(`Failed to download document from ${url}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Infer document type from URL or metadata
      if (url.includes("passport")) {
        documents.passport = buffer;
      } else if (url.includes("driving") || url.includes("licence")) {
        documents.drivingLicence = buffer;
      } else if (url.includes("selfie")) {
        documents.selfie = buffer;
      } else if (url.includes("video") || url.includes("liveness")) {
        documents.video = buffer;
      }
    }

    return documents;
  }

  /**
   * List all verifications for the account
   *
   * Useful for debugging and admin dashboards.
   */
  async listVerifications(params?: {
    status?: "pending" | "completed" | "failed";
    limit?: number;
    offset?: number;
  }): Promise<{
    verifications: VerificationStatus[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append("status", params.status);
    }

    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params?.offset) {
      queryParams.append("offset", params.offset.toString());
    }

    const endpoint = `/verifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    return this.request<{
      verifications: VerificationStatus[];
      total: number;
    }>(endpoint);
  }
}

// Export singleton instance
export const lemverifyClient = new LemVerifyAPIClient();
