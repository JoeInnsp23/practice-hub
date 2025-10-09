import type { TemplateField } from "./client";

/**
 * UK Simple Electronic Signature (SES) Compliance Field Definitions
 *
 * These fields ensure compliance with UK e-signature requirements:
 * - Explicit consent to electronic signature
 * - Signer identity verification (name, email)
 * - Signing capacity and company authority
 * - Date/time capture (auto-captured by DocuSeal)
 * - Technical metadata (IP, user agent - auto-captured by DocuSeal)
 */
export const UKComplianceFields: TemplateField[] = [
  // Core signature field
  {
    name: "signature",
    type: "signature",
    required: true,
    description: "Your signature",
  },

  // Signer identity
  {
    name: "signer_name",
    type: "text",
    required: true,
    description: "Full name",
  },
  {
    name: "signer_email",
    type: "email",
    required: true,
    description: "Email address",
  },

  // Date (auto-populated)
  {
    name: "signing_date",
    type: "date",
    required: true,
    default_value: "{{date}}", // DocuSeal auto-fills current date
    description: "Date of signature",
  },

  // Signing capacity (UK requirement)
  {
    name: "signing_capacity",
    type: "select",
    required: true,
    options: [
      "Director",
      "Authorized Signatory",
      "Partner",
      "Sole Proprietor",
      "Company Secretary",
      "Managing Director",
    ],
    description: "Your capacity/authority to sign",
  },

  // Company details
  {
    name: "company_name",
    type: "text",
    required: true,
    description: "Company or organization name",
  },
  {
    name: "company_number",
    type: "text",
    required: false,
    description: "Company registration number (if applicable)",
  },

  // Authority confirmation (UK SES requirement)
  {
    name: "authority_confirmation",
    type: "checkbox",
    required: true,
    description:
      "I confirm I have the authority to sign on behalf of the company/organization",
  },

  // E-signature consent (UK SES requirement)
  {
    name: "consent_to_electronic_signature",
    type: "checkbox",
    required: true,
    description:
      "I consent to use an electronic signature, which has the same legal effect as a handwritten signature",
  },
];

/**
 * Auto-captured fields by DocuSeal (no need to define):
 * - IP address
 * - User agent (browser/device information)
 * - View timestamp (when document first opened)
 * - Sign timestamp (when signature completed)
 * - Session metadata
 */

/**
 * Get field configuration for a specific proposal
 */
export function getProposalSignatureFields(
  proposalData: {
    companyName?: string;
    clientName?: string;
  },
): TemplateField[] {
  return UKComplianceFields.map((field) => {
    // Pre-fill company name if available
    if (
      field.name === "company_name" &&
      (proposalData.companyName || proposalData.clientName)
    ) {
      return {
        ...field,
        default_value: proposalData.companyName || proposalData.clientName,
      };
    }
    return field;
  });
}

/**
 * Extract audit trail data from DocuSeal submission
 */
export function extractAuditTrail(submission: any) {
  const submitter = submission.submitters?.[0];

  return {
    signerName: submitter?.name || "",
    signerEmail: submitter?.email || "",
    signedAt: submission.completed_at || submitter?.completed_at,
    viewedAt: submitter?.opened_at,
    ipAddress: submitter?.ip,
    userAgent: submitter?.user_agent,
    signingCapacity: submitter?.values?.signing_capacity,
    companyName: submitter?.values?.company_name,
    companyNumber: submitter?.values?.company_number,
    authorityConfirmed: submitter?.values?.authority_confirmation === true,
    consentConfirmed:
      submitter?.values?.consent_to_electronic_signature === true,
    sessionMetadata: {
      submissionId: submission.id,
      templateId: submission.template_id,
      status: submission.status,
    },
  };
}
