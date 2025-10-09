/**
 * AI Document Extraction for Client Onboarding
 *
 * Uses Gemini Flash 2.0 to extract structured data from uploaded documents
 * for AML compliance and client onboarding questionnaire pre-fill.
 *
 * Supported document types (UK-specific):
 * - Passport / UK Driving License (individual identification)
 * - Certificate of Incorporation / Companies House extracts (includes beneficial ownership via PSC)
 * - Proof of Address (utility bills, council tax, bank statements)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.warn("GOOGLE_AI_API_KEY not configured - AI extraction will fail");
}

const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

/**
 * Extracted individual data from ID documents (UK-specific)
 */
export interface ExtractedIndividualData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  documentNumber?: string;
  documentType?: "passport" | "driving_licence";
  expiryDate?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Extracted company data from incorporation certificates and Companies House extracts
 * Note: Beneficial ownership (PSC) is included in Companies House extracts
 */
export interface ExtractedCompanyData {
  companyName?: string;
  registrationNumber?: string;
  incorporationDate?: string;
  companyType?: string;
  registeredAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  directors?: Array<{
    name: string;
    appointedDate?: string;
  }>;
  // Persons with Significant Control (PSC) from Companies House
  personsWithSignificantControl?: Array<{
    name: string;
    notifiedDate?: string;
    natureOfControl?: string[];
  }>;
  sicCodes?: string[];
  natureOfBusiness?: string;
}

/**
 * Extracted proof of address data
 */
export interface ExtractedAddressData {
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  documentType?: "utility_bill" | "bank_statement" | "council_tax" | "other";
  documentDate?: string;
  accountHolder?: string;
}

/**
 * Combined extraction result (UK-specific document types)
 */
export interface DocumentExtractionResult {
  documentType: "individual_id" | "company_certificate" | "address_proof" | "unknown";
  confidence: "high" | "medium" | "low";
  individualData?: ExtractedIndividualData;
  companyData?: ExtractedCompanyData;
  addressData?: ExtractedAddressData;
  rawText?: string; // For debugging
  warnings?: string[];
}

/**
 * Extract data from a document using Gemini Vision
 */
export async function extractClientDataFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<DocumentExtractionResult> {
  if (!genAI) {
    throw new Error("Google AI API key not configured");
  }

  console.log("Extracting data from document:", filename);

  // Use Gemini Flash 2.0 for vision + text extraction
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // Convert buffer to base64 for Gemini API
  const base64Data = fileBuffer.toString("base64");

  const prompt = `You are a UK AML compliance assistant analyzing documents for client onboarding at an accounting practice.

Extract ALL available information from this document in a structured JSON format.

Document types you may encounter (UK-specific):
1. Individual ID - UK passport or UK driving license ONLY (no national ID cards in UK)
2. Company Certificate - Certificate of Incorporation or Companies House extract (may include PSC register)
3. Proof of Address - Utility bill, council tax bill, or bank statement (for address verification only)

For each document type, extract:

**Individual ID (passport or UK driving license):**
- firstName, lastName
- dateOfBirth (YYYY-MM-DD format)
- nationality
- documentNumber
- documentType ("passport" or "driving_licence")
- expiryDate (YYYY-MM-DD format)
- address (line1, line2, city, postalCode, country) - if shown on document

**Company Certificate (Certificate of Incorporation or Companies House extract):**
- companyName
- registrationNumber (Companies House number, typically 8 digits)
- incorporationDate (YYYY-MM-DD format)
- companyType (e.g., "Private Limited Company", "LLP", "PLC")
- registeredAddress (line1, line2, city, postalCode, country)
- directors (array of {name, appointedDate})
- personsWithSignificantControl (PSC register - array of {name, notifiedDate, natureOfControl}) - IF present on Companies House extract
- sicCodes (array of SIC codes) - if shown
- natureOfBusiness (description) - if shown

**Proof of Address (utility bill, council tax, or bank statement):**
- address (line1, line2, city, postalCode, country)
- documentType ("utility_bill", "council_tax", "bank_statement", or "other")
- documentDate (YYYY-MM-DD format)
- accountHolder (name on document)

Return ONLY valid JSON with this structure:
{
  "documentType": "individual_id" | "company_certificate" | "address_proof" | "unknown",
  "confidence": "high" | "medium" | "low",
  "individualData": {...},
  "companyData": {...},
  "addressData": {...},
  "warnings": ["any issues or unclear information"]
}

Only include the relevant data objects based on the document type.
If you cannot extract certain fields, omit them (do not use null or empty strings).
Be conservative with confidence ratings - only use "high" if you're very certain.
IMPORTANT: UK has NO national ID cards - only passport and driving license are valid ID.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  const text = response.text();

  console.log("Gemini raw response:", text);

  // Parse JSON from response
  let extractedData: DocumentExtractionResult;
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    extractedData = JSON.parse(jsonText);
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", error);
    console.error("Raw text:", text);

    // Return unknown type with raw text for manual review
    return {
      documentType: "unknown",
      confidence: "low",
      rawText: text,
      warnings: ["Failed to parse AI response - manual review required"],
    };
  }

  console.log("Successfully extracted data:", extractedData);

  return extractedData;
}

/**
 * Pre-fill onboarding questionnaire from extracted data
 *
 * Maps extracted document data to questionnaire response format
 */
export function mapExtractedDataToQuestionnaire(
  extraction: DocumentExtractionResult
): Record<string, any> {
  const responses: Record<string, any> = {};

  // Individual data mapping
  if (extraction.individualData) {
    if (extraction.individualData.firstName) {
      responses.contact_first_name = extraction.individualData.firstName;
    }
    if (extraction.individualData.lastName) {
      responses.contact_last_name = extraction.individualData.lastName;
    }
    if (extraction.individualData.dateOfBirth) {
      responses.contact_date_of_birth = extraction.individualData.dateOfBirth;
    }
    if (extraction.individualData.nationality) {
      responses.contact_nationality = extraction.individualData.nationality;
    }
    if (extraction.individualData.address) {
      responses.contact_address = extraction.individualData.address;
    }
  }

  // Company data mapping (includes PSC from Companies House)
  if (extraction.companyData) {
    if (extraction.companyData.companyName) {
      responses.company_name = extraction.companyData.companyName;
    }
    if (extraction.companyData.registrationNumber) {
      responses.company_number = extraction.companyData.registrationNumber;
    }
    if (extraction.companyData.incorporationDate) {
      responses.company_incorporation_date = extraction.companyData.incorporationDate;
    }
    if (extraction.companyData.companyType) {
      responses.company_type = extraction.companyData.companyType;
    }
    if (extraction.companyData.registeredAddress) {
      responses.company_registered_address = extraction.companyData.registeredAddress;
    }
    if (extraction.companyData.directors) {
      responses.company_directors = extraction.companyData.directors;
    }
    if (extraction.companyData.personsWithSignificantControl) {
      responses.psc_register = extraction.companyData.personsWithSignificantControl;
    }
    if (extraction.companyData.natureOfBusiness) {
      responses.nature_of_business = extraction.companyData.natureOfBusiness;
    }
    if (extraction.companyData.sicCodes) {
      responses.sic_codes = extraction.companyData.sicCodes;
    }
  }

  // Address data mapping (backup if no individual data)
  if (extraction.addressData && !extraction.individualData?.address) {
    if (extraction.addressData.address) {
      responses.contact_address = extraction.addressData.address;
    }
  }

  return responses;
}

/**
 * Batch extract data from multiple documents
 *
 * Useful for processing all uploaded documents at once
 */
export async function extractFromMultipleDocuments(
  documents: Array<{
    buffer: Buffer;
    mimeType: string;
    filename: string;
  }>
): Promise<{
  extractions: DocumentExtractionResult[];
  mergedData: Record<string, any>;
  confidence: "high" | "medium" | "low";
}> {
  console.log(`Extracting data from ${documents.length} documents...`);

  // Extract from each document
  const extractions = await Promise.all(
    documents.map((doc) =>
      extractClientDataFromDocument(doc.buffer, doc.mimeType, doc.filename)
    )
  );

  // Merge all extracted data (later documents override earlier ones for conflicts)
  let mergedData: Record<string, any> = {};
  for (const extraction of extractions) {
    const mapped = mapExtractedDataToQuestionnaire(extraction);
    mergedData = { ...mergedData, ...mapped };
  }

  // Calculate overall confidence
  const confidenceLevels = extractions.map((e) => e.confidence);
  const hasLow = confidenceLevels.includes("low");
  const hasMedium = confidenceLevels.includes("medium");
  const overallConfidence = hasLow ? "low" : hasMedium ? "medium" : "high";

  console.log("Batch extraction complete. Overall confidence:", overallConfidence);

  return {
    extractions,
    mergedData,
    confidence: overallConfidence,
  };
}
