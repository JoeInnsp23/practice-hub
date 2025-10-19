/**
 * Questionnaire Pre-fill Logic
 *
 * Retrieves AI-extracted data and formats it for the onboarding questionnaire UI
 * with visual indicators for AI-extracted vs user-entered data.
 *
 * Uses in-memory caching (30s TTL) to reduce repeated database reads.
 */

import { questionnaireResponsesCache } from "@/lib/cache";
import { getOnboardingResponses } from "./save-extracted-data";

/**
 * Questionnaire field definition
 */
export interface QuestionnaireField {
  key: string;
  label: string;
  type:
    | "text"
    | "email"
    | "date"
    | "select"
    | "textarea"
    | "number"
    | "address"
    | "array";
  required: boolean;
  category:
    | "individual"
    | "company"
    | "business_activity"
    | "ownership"
    | "risk_assessment";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
}

/**
 * Pre-filled questionnaire response
 */
export interface PrefilledQuestionnaireResponse {
  fields: Record<
    string,
    {
      value: any;
      extractedFromAi: boolean;
      verifiedByUser: boolean;
      fieldDefinition: QuestionnaireField;
    }
  >;
  completionPercentage: number;
  requiredFieldsRemaining: string[];
  aiExtractedCount: number;
  userEnteredCount: number;
}

/**
 * Complete questionnaire field definitions
 */
export const QUESTIONNAIRE_FIELDS: QuestionnaireField[] = [
  // Individual/Contact Information
  {
    key: "contact_first_name",
    label: "First Name",
    type: "text",
    required: true,
    category: "individual",
    placeholder: "John",
  },
  {
    key: "contact_last_name",
    label: "Last Name",
    type: "text",
    required: true,
    category: "individual",
    placeholder: "Smith",
  },
  {
    key: "contact_date_of_birth",
    label: "Date of Birth",
    type: "date",
    required: true,
    category: "individual",
    helpText: "Required for identity verification",
  },
  {
    key: "contact_nationality",
    label: "Nationality",
    type: "text",
    required: true,
    category: "individual",
    placeholder: "British",
  },
  {
    key: "contact_address",
    label: "Residential Address",
    type: "address",
    required: true,
    category: "individual",
    helpText: "Your current residential address",
  },

  // Company Information
  {
    key: "company_name",
    label: "Company Name",
    type: "text",
    required: true,
    category: "company",
    placeholder: "Acme Ltd",
  },
  {
    key: "company_number",
    label: "Company Registration Number",
    type: "text",
    required: true,
    category: "company",
    placeholder: "12345678",
    helpText: "Your Companies House registration number",
  },
  {
    key: "company_type",
    label: "Company Type",
    type: "select",
    required: true,
    category: "company",
    options: [
      { value: "limited_company", label: "Private Limited Company (Ltd)" },
      { value: "plc", label: "Public Limited Company (PLC)" },
      { value: "llp", label: "Limited Liability Partnership (LLP)" },
      { value: "sole_trader", label: "Sole Trader" },
      { value: "partnership", label: "Partnership" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "company_registered_address",
    label: "Registered Office Address",
    type: "address",
    required: true,
    category: "company",
    helpText: "Your company's registered address with Companies House",
  },
  {
    key: "company_incorporation_date",
    label: "Date of Incorporation",
    type: "date",
    required: false,
    category: "company",
  },
  {
    key: "company_directors",
    label: "Directors",
    type: "array",
    required: false,
    category: "company",
    helpText: "List of company directors",
  },

  // Business Activity
  {
    key: "nature_of_business",
    label: "Nature of Business",
    type: "textarea",
    required: true,
    category: "business_activity",
    placeholder: "Describe what your business does...",
    helpText: "Please describe your main business activities",
  },
  {
    key: "annual_turnover",
    label: "Estimated Annual Turnover",
    type: "select",
    required: true,
    category: "business_activity",
    options: [
      { value: "0-50k", label: "£0 - £50,000" },
      { value: "50k-250k", label: "£50,000 - £250,000" },
      { value: "250k-1m", label: "£250,000 - £1,000,000" },
      { value: "1m-5m", label: "£1,000,000 - £5,000,000" },
      { value: "5m+", label: "£5,000,000+" },
    ],
  },
  {
    key: "sic_codes",
    label: "SIC Codes",
    type: "array",
    required: false,
    category: "business_activity",
    helpText: "Standard Industrial Classification codes",
  },

  // Beneficial Ownership
  {
    key: "beneficial_owners",
    label: "Beneficial Owners",
    type: "array",
    required: true,
    category: "ownership",
    helpText:
      "Individuals who own 25% or more of the company or have significant control",
  },
  {
    key: "psc_register",
    label: "Persons with Significant Control",
    type: "array",
    required: false,
    category: "ownership",
    helpText: "From your Companies House PSC register",
  },

  // Risk Assessment
  {
    key: "high_risk_jurisdictions",
    label: "Do you operate in or have connections to high-risk jurisdictions?",
    type: "select",
    required: true,
    category: "risk_assessment",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
    helpText: "Countries on FATF high-risk or increased monitoring lists",
  },
  {
    key: "high_risk_jurisdictions_details",
    label: "Please provide details",
    type: "textarea",
    required: false,
    category: "risk_assessment",
    placeholder: "Which countries and what is the nature of the connection?",
  },
  {
    key: "cash_intensive_business",
    label: "Is your business cash-intensive?",
    type: "select",
    required: true,
    category: "risk_assessment",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
    helpText: "E.g., retail, hospitality, gambling",
  },
  {
    key: "politically_exposed_person",
    label:
      "Are you or any beneficial owners politically exposed persons (PEPs)?",
    type: "select",
    required: true,
    category: "risk_assessment",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
    helpText:
      "Individuals in prominent public positions or their close associates",
  },
  {
    key: "pep_details",
    label: "Please provide details",
    type: "textarea",
    required: false,
    category: "risk_assessment",
    placeholder: "Name, position, and relationship",
  },
];

/**
 * Get pre-filled questionnaire for an onboarding session
 *
 * Uses in-memory cache (30s TTL) to reduce database reads
 */
export async function getPrefilledQuestionnaire(
  onboardingSessionId: string,
): Promise<PrefilledQuestionnaireResponse> {
  // Check cache first
  let responses = questionnaireResponsesCache.get(onboardingSessionId);

  if (!responses) {
    // Cache miss - fetch from database
    responses = await getOnboardingResponses(onboardingSessionId);

    // Cache for 30 seconds
    questionnaireResponsesCache.set(onboardingSessionId, responses, 30000);
  }

  // Build fields map with definitions
  const fields: Record<
    string,
    {
      value: any;
      extractedFromAi: boolean;
      verifiedByUser: boolean;
      fieldDefinition: QuestionnaireField;
    }
  > = {};

  for (const fieldDef of QUESTIONNAIRE_FIELDS) {
    const response = responses[fieldDef.key];

    fields[fieldDef.key] = {
      value: response?.value || null,
      extractedFromAi: response?.extractedFromAi || false,
      verifiedByUser: response?.verifiedByUser || false,
      fieldDefinition: fieldDef,
    };
  }

  // Calculate metrics
  const aiExtractedCount = Object.values(fields).filter(
    (f) => f.extractedFromAi && !f.verifiedByUser,
  ).length;

  const userEnteredCount = Object.values(fields).filter(
    (f) => f.verifiedByUser || (!f.extractedFromAi && f.value !== null),
  ).length;

  const requiredFieldsRemaining = QUESTIONNAIRE_FIELDS.filter((f) => f.required)
    .filter((f) => !fields[f.key].verifiedByUser)
    .map((f) => f.key);

  const totalRequiredFields = QUESTIONNAIRE_FIELDS.filter(
    (f) => f.required,
  ).length;
  const completedRequiredFields =
    totalRequiredFields - requiredFieldsRemaining.length;
  const completionPercentage = Math.round(
    (completedRequiredFields / totalRequiredFields) * 100,
  );

  return {
    fields,
    completionPercentage,
    requiredFieldsRemaining,
    aiExtractedCount,
    userEnteredCount,
  };
}

/**
 * Validate questionnaire is complete and ready for AML check
 */
export function validateQuestionnaireComplete(
  prefilledData: PrefilledQuestionnaireResponse,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all required fields are verified
  if (prefilledData.requiredFieldsRemaining.length > 0) {
    errors.push(
      `${prefilledData.requiredFieldsRemaining.length} required fields are not completed`,
    );
  }

  // Check specific AML requirements
  const beneficialOwners = prefilledData.fields.beneficial_owners?.value;
  if (
    !beneficialOwners ||
    (Array.isArray(beneficialOwners) && beneficialOwners.length === 0)
  ) {
    errors.push("At least one beneficial owner must be specified");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
