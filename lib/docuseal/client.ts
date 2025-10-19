import axios, { type AxiosInstance } from "axios";

export interface TemplateField {
  name: string;
  type: "signature" | "text" | "email" | "date" | "select" | "checkbox";
  required: boolean;
  description?: string;
  options?: string[];
  default_value?: string;
}

export interface Submitter {
  email: string;
  name: string;
  role?: string;
}

export interface CreateTemplateParams {
  name: string;
  fields: TemplateField[];
}

export interface CreateSubmissionParams {
  template_id: string;
  send_email: boolean;
  submitters: Submitter[];
  metadata?: Record<string, any>;
}

export interface DocuSealSubmission {
  id: string;
  template_id: string;
  status: string;
  submitters: Array<{
    email: string;
    name: string;
    ip?: string;
    user_agent?: string;
    opened_at?: string;
    completed_at?: string;
    values?: Record<string, any>;
  }>;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export class DocuSealClient {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.DOCUSEAL_HOST || "http://localhost:3030";
    const apiKey = process.env.DOCUSEAL_API_KEY;

    if (!apiKey) {
      throw new Error("DOCUSEAL_API_KEY environment variable is required");
    }

    this.client = axios.create({
      baseURL: `${this.apiUrl}/api`,
      headers: {
        "X-Auth-Token": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Create a new template with specified fields
   */
  async createTemplate(params: CreateTemplateParams) {
    const response = await this.client.post("/templates", params);
    return response.data;
  }

  /**
   * Create a submission for signing
   */
  async createSubmission(params: CreateSubmissionParams) {
    const response = await this.client.post("/submissions", params);
    return response.data;
  }

  /**
   * Get submission details by ID
   */
  async getSubmission(submissionId: string): Promise<DocuSealSubmission> {
    const response = await this.client.get(`/submissions/${submissionId}`);
    return response.data;
  }

  /**
   * Download signed PDF as buffer
   */
  async downloadSignedPdf(submissionId: string): Promise<Buffer> {
    const response = await this.client.get(
      `/submissions/${submissionId}/download`,
      {
        responseType: "arraybuffer",
      },
    );
    return Buffer.from(response.data);
  }

  /**
   * Get embedded signing URL for a specific submitter
   */
  getEmbedUrl(submissionId: string, email: string): string {
    return `${this.apiUrl}/s/${submissionId}?email=${encodeURIComponent(email)}`;
  }

  /**
   * List all templates
   */
  async listTemplates() {
    const response = await this.client.get("/templates");
    return response.data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string) {
    const response = await this.client.delete(`/templates/${templateId}`);
    return response.data;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string) {
    const response = await this.client.get(`/templates/${templateId}`);
    return response.data;
  }
}

// Export singleton instance
export const docusealClient = new DocuSealClient();
