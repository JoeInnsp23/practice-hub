/**
 * ComplyCube API Client
 *
 * Official ComplyCube API wrapper for UK AML compliance checks
 * Documentation: https://docs.complycube.com/api-reference
 *
 * Features:
 * - Client registration for KYC/AML checks
 * - Document verification
 * - AML screening (watchlists, PEP, sanctions)
 * - Identity verification
 * - Risk assessment
 */

const COMPLYCUBE_API_URL = process.env.COMPLYCUBE_API_URL || "https://api.complycube.com/v1";
const COMPLYCUBE_API_KEY = process.env.COMPLYCUBE_API_KEY;

if (!COMPLYCUBE_API_KEY) {
  console.warn("COMPLYCUBE_API_KEY not configured - AML checks will fail");
}

interface ComplyCubeClient {
  id: string;
  email: string;
  personDetails?: {
    firstName: string;
    lastName: string;
    dob?: string;
  };
  companyDetails?: {
    name: string;
    number?: string;
    type?: string;
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

interface AMLCheckResponse {
  id: string;
  clientId: string;
  status: "pending" | "complete" | "clear" | "consider" | "attention";
  riskLevel: "low" | "medium" | "high";
  outcome?: string;
  matches?: Array<{
    type: string;
    name: string;
    matchStrength: number;
  }>;
  createdAt: string;
}

interface DocumentCheckResponse {
  id: string;
  clientId: string;
  type: string;
  status: "pending" | "complete" | "clear" | "rejected";
  outcome?: string;
  extractedData?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    documentNumber?: string;
    expiryDate?: string;
  };
}

class ComplyCubeAPIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || COMPLYCUBE_API_KEY || "";
    this.baseUrl = COMPLYCUBE_API_URL;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("ComplyCube API key not configured");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Authorization": `${this.apiKey}`,
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
      throw new Error(`ComplyCube API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a client for KYC/AML checks
   */
  async createClient(data: {
    email: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    companyNumber?: string;
    address?: {
      line1?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<ComplyCubeClient> {
    const clientData: any = {
      email: data.email,
      type: data.companyName ? "company" : "person",
    };

    if (data.companyName) {
      clientData.companyDetails = {
        name: data.companyName,
        number: data.companyNumber,
      };
    } else {
      clientData.personDetails = {
        firstName: data.firstName,
        lastName: data.lastName,
      };
    }

    if (data.address) {
      clientData.address = data.address;
    }

    return this.request<ComplyCubeClient>("/clients", "POST", clientData);
  }

  /**
   * Perform AML check (watchlist, PEP, sanctions screening)
   */
  async performAMLCheck(clientId: string): Promise<AMLCheckResponse> {
    return this.request<AMLCheckResponse>(
      "/checks",
      "POST",
      {
        clientId,
        type: "extensive_screening_check",
      }
    );
  }

  /**
   * Upload document for verification (UK-specific document types)
   */
  async uploadDocument(
    clientId: string,
    documentType: "passport" | "driving_licence" | "proof_of_address",
    fileBuffer: Buffer,
    filename: string
  ): Promise<DocumentCheckResponse> {
    // Note: This is a simplified version
    // In production, you'd use multipart/form-data for file upload
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("type", documentType);
    formData.append("document", new Blob([fileBuffer]), filename);

    const response = await fetch(`${this.baseUrl}/documents`, {
      method: "POST",
      headers: {
        "Authorization": `${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Document upload failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get check status
   */
  async getCheckStatus(checkId: string): Promise<AMLCheckResponse> {
    return this.request<AMLCheckResponse>(`/checks/${checkId}`);
  }

  /**
   * Get client details
   */
  async getClient(clientId: string): Promise<ComplyCubeClient> {
    return this.request<ComplyCubeClient>(`/clients/${clientId}`);
  }

  /**
   * Download compliance report PDF
   */
  async downloadReport(checkId: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/checks/${checkId}/pdf`, {
      headers: {
        "Authorization": `${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Report download failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * List all checks for a client
   */
  async listChecks(clientId: string): Promise<AMLCheckResponse[]> {
    const response = await this.request<{ items: AMLCheckResponse[] }>(
      `/checks?clientId=${clientId}`
    );
    return response.items || [];
  }

  /**
   * Perform identity verification check
   */
  async performIdentityCheck(clientId: string): Promise<DocumentCheckResponse> {
    return this.request<DocumentCheckResponse>(
      "/checks",
      "POST",
      {
        clientId,
        type: "identity_check",
      }
    );
  }
}

// Export singleton instance
export const complycubeClient = new ComplyCubeAPIClient();

// Export types
export type { ComplyCubeClient, AMLCheckResponse, DocumentCheckResponse };
