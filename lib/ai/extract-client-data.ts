/**
 * AI Document Extraction for Client Onboarding
 *
 * Uses Gemini Flash 2.0 to extract structured data from uploaded documents
 * for AML compliance and client onboarding questionnaire pre-fill.
 *
 * Supported document types:
 * - Passport / Driver's License / National ID (individual identification)
 * - Certificate of Incorporation (company registration)
 * - Proof of Address (utility bills, bank statements)
 * - Beneficial Ownership Documents
 * - Bank Statements (source of funds verification)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.warn("GOOGLE_AI_API_KEY not configured - AI extraction will fail");
}

const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

/**
 * Extracted individual data from ID documents
 */
export interface ExtractedIndividualData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  documentNumber?: string;
  documentType?: "passport" | "driving_licence" | "national_id";
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
 * Extracted company data from incorporation certificates
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
  sicCodes?: string[];
  natureOfBusiness?: string;
}

/**
 * Extracted beneficial ownership data
 */
export interface ExtractedOwnershipData {
  beneficialOwners?: Array<{
    name: string;
    dateOfBirth?: string;
    nationality?: string;
    ownershipPercentage?: number;
    controlType?: string;
  }>;
  personsWithSignificantControl?: Array<{
    name: string;
    notifiedDate?: string;
    natureOfControl?: string[];
  }>;
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
 * Extracted source of funds data from bank statements
 */
export interface ExtractedFundsData {
  accountHolder?: string;
  bankName?: string;
  accountNumber?: string; // Last 4 digits only
  sortCode?: string;
  statementDate?: string;
  averageBalance?: number;
  largeTransactions?: Array<{
    date: string;
    amount: number;
    description: string;
  }>;
}

/**
 * Combined extraction result
 */
export interface DocumentExtractionResult {
  documentType: "individual_id" | "company_certificate" | "ownership" | "address_proof" | "bank_statement" | "unknown";
  confidence: "high" | "medium" | "low";
  individualData?: ExtractedIndividualData;
  companyData?: ExtractedCompanyData;
  ownershipData?: ExtractedOwnershipData;
  addressData?: ExtractedAddressData;
  fundsData?: ExtractedFundsData;
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

  const prompt = `You are a UK AML compliance assistant analyzing documents for client onboarding.

Extract ALL available information from this document in a structured JSON format.

Document types you may encounter:
1. Individual ID (passport, driver's license, national ID card)
2. Company Certificate (Certificate of Incorporation, Companies House extract)
3. Beneficial Ownership Documents (PSC register, ownership structure)
4. Proof of Address (utility bill, bank statement, council tax)
5. Bank Statement (for source of funds verification)

For each document type, extract:

**Individual ID:**
- firstName, lastName
- dateOfBirth (YYYY-MM-DD format)
- nationality
- documentNumber
- documentType ("passport", "driving_licence", "national_id")
- expiryDate (YYYY-MM-DD format)
- address (line1, line2, city, postalCode, country)

**Company Certificate:**
- companyName
- registrationNumber (Companies House number)
- incorporationDate (YYYY-MM-DD format)
- companyType (e.g., "Private Limited Company", "LLP")
- registeredAddress (line1, line2, city, postalCode, country)
- directors (array of {name, appointedDate})
- sicCodes (array of SIC codes)
- natureOfBusiness (description)

**Beneficial Ownership:**
- beneficialOwners (array of {name, dateOfBirth, nationality, ownershipPercentage, controlType})
- personsWithSignificantControl (array of {name, notifiedDate, natureOfControl})

**Proof of Address:**
- address (line1, line2, city, postalCode, country)
- documentType ("utility_bill", "bank_statement", "council_tax", "other")
- documentDate (YYYY-MM-DD format)
- accountHolder (name on document)

**Bank Statement:**
- accountHolder
- bankName
- accountNumber (last 4 digits only)
- sortCode
- statementDate (YYYY-MM-DD format)
- averageBalance (estimated)
- largeTransactions (top 3-5 unusual transactions: {date, amount, description})

Return ONLY valid JSON with this structure:
{
  "documentType": "individual_id" | "company_certificate" | "ownership" | "address_proof" | "bank_statement" | "unknown",
  "confidence": "high" | "medium" | "low",
  "individualData": {...},
  "companyData": {...},
  "ownershipData": {...},
  "addressData": {...},
  "fundsData": {...},
  "warnings": ["any issues or unclear information"]
}

Only include the relevant data objects based on the document type.
If you cannot extract certain fields, omit them (do not use null or empty strings).
Be conservative with confidence ratings - only use "high" if you're very certain.`;

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

  // Company data mapping
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
    if (extraction.companyData.natureOfBusiness) {
      responses.nature_of_business = extraction.companyData.natureOfBusiness;
    }
    if (extraction.companyData.sicCodes) {
      responses.sic_codes = extraction.companyData.sicCodes;
    }
  }

  // Ownership data mapping
  if (extraction.ownershipData) {
    if (extraction.ownershipData.beneficialOwners) {
      responses.beneficial_owners = extraction.ownershipData.beneficialOwners;
    }
    if (extraction.ownershipData.personsWithSignificantControl) {
      responses.psc_register = extraction.ownershipData.personsWithSignificantControl;
    }
  }

  // Address data mapping (backup if no individual data)
  if (extraction.addressData && !extraction.individualData?.address) {
    if (extraction.addressData.address) {
      responses.contact_address = extraction.addressData.address;
    }
  }

  // Funds data mapping
  if (extraction.fundsData) {
    if (extraction.fundsData.bankName) {
      responses.source_of_funds_bank = extraction.fundsData.bankName;
    }
    if (extraction.fundsData.averageBalance) {
      responses.source_of_funds_balance = extraction.fundsData.averageBalance;
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
