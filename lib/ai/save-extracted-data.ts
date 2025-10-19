/**
 * Save Extracted Data to Database
 *
 * Handles saving AI-extracted document data to the onboarding_responses table
 * with proper metadata tracking for compliance and verification.
 */

import { and, eq } from "drizzle-orm";
import { invalidateQuestionnaireCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { onboardingResponses } from "@/lib/db/schema";

/**
 * Save extracted data to onboarding_responses table
 *
 * Each field from the extraction is saved as a separate response record
 * with extractedFromAi = true and verifiedByUser = false.
 *
 * The client will later verify/edit these values in the questionnaire UI.
 */
export async function saveExtractedDataToOnboarding(
  tenantId: string,
  onboardingSessionId: string,
  extractedData: Record<string, any>,
  documentType: string,
): Promise<void> {
  console.log(
    "Saving extracted data to onboarding session:",
    onboardingSessionId,
  );
  console.log("Document type:", documentType);
  console.log("Fields to save:", Object.keys(extractedData).length);

  const responsesToInsert = [];

  for (const [questionKey, answerValue] of Object.entries(extractedData)) {
    // Skip undefined/null values
    if (answerValue === undefined || answerValue === null) {
      continue;
    }

    responsesToInsert.push({
      tenantId,
      onboardingSessionId,
      questionKey,
      answerValue,
      extractedFromAi: true,
      verifiedByUser: false,
    });
  }

  if (responsesToInsert.length === 0) {
    console.log("No valid data to save from extraction");
    return;
  }

  // Insert all responses in batch
  await db.insert(onboardingResponses).values(responsesToInsert);

  console.log(`Saved ${responsesToInsert.length} extracted fields to database`);

  // Invalidate cache so next read gets fresh data
  invalidateQuestionnaireCache(onboardingSessionId);
}

/**
 * Update extracted data with user verification
 *
 * When a user reviews and confirms an AI-extracted field,
 * mark it as verified.
 */
export async function markResponseAsVerified(
  onboardingSessionId: string,
  questionKey: string,
): Promise<void> {
  const [existingResponse] = await db
    .select()
    .from(onboardingResponses)
    .where(
      and(
        eq(onboardingResponses.onboardingSessionId, onboardingSessionId),
        eq(onboardingResponses.questionKey, questionKey),
      ),
    )
    .limit(1);

  if (!existingResponse) {
    throw new Error("Response not found");
  }

  await db
    .update(onboardingResponses)
    .set({
      verifiedByUser: true,
      updatedAt: new Date(),
    })
    .where(eq(onboardingResponses.id, existingResponse.id));

  // Invalidate cache so next read gets fresh data
  invalidateQuestionnaireCache(onboardingSessionId);
}

/**
 * Update extracted data with user edits
 *
 * When a user edits an AI-extracted field, update the value
 * and mark as verified.
 */
export async function updateExtractedResponse(
  onboardingSessionId: string,
  questionKey: string,
  newValue: any,
  tenantId?: string,
): Promise<void> {
  const [existingResponse] = await db
    .select()
    .from(onboardingResponses)
    .where(
      and(
        eq(onboardingResponses.onboardingSessionId, onboardingSessionId),
        eq(onboardingResponses.questionKey, questionKey),
      ),
    )
    .limit(1);

  if (!existingResponse) {
    // Create new response if doesn't exist
    // Need tenantId - fetch from onboarding session if not provided
    let effectiveTenantId = tenantId;

    if (!effectiveTenantId) {
      const { onboardingSessions } = await import("@/lib/db/schema");
      const [session] = await db
        .select({ tenantId: onboardingSessions.tenantId })
        .from(onboardingSessions)
        .where(eq(onboardingSessions.id, onboardingSessionId))
        .limit(1);

      if (!session) {
        throw new Error("Onboarding session not found");
      }

      effectiveTenantId = session.tenantId;
    }

    await db.insert(onboardingResponses).values({
      tenantId: effectiveTenantId,
      onboardingSessionId,
      questionKey,
      answerValue: newValue,
      extractedFromAi: false,
      verifiedByUser: true,
    });
  } else {
    // Update existing response
    await db
      .update(onboardingResponses)
      .set({
        answerValue: newValue,
        verifiedByUser: true,
        updatedAt: new Date(),
      })
      .where(eq(onboardingResponses.id, existingResponse.id));
  }

  // Invalidate cache so next read gets fresh data
  invalidateQuestionnaireCache(onboardingSessionId);
}

/**
 * Get all responses for an onboarding session
 *
 * Returns a map of questionKey -> response data
 */
export async function getOnboardingResponses(
  onboardingSessionId: string,
): Promise<
  Record<
    string,
    { value: any; extractedFromAi: boolean; verifiedByUser: boolean }
  >
> {
  const responses = await db
    .select()
    .from(onboardingResponses)
    .where(eq(onboardingResponses.onboardingSessionId, onboardingSessionId));

  const responsesMap: Record<
    string,
    { value: any; extractedFromAi: boolean; verifiedByUser: boolean }
  > = {};

  for (const response of responses) {
    responsesMap[response.questionKey] = {
      value: response.answerValue,
      extractedFromAi: response.extractedFromAi || false,
      verifiedByUser: response.verifiedByUser || false,
    };
  }

  return responsesMap;
}

/**
 * Calculate onboarding completion percentage
 *
 * Based on required fields being verified
 */
export function calculateCompletionPercentage(
  responses: Record<
    string,
    { value: any; extractedFromAi: boolean; verifiedByUser: boolean }
  >,
  requiredFields: string[],
): number {
  const verifiedRequiredFields = requiredFields.filter(
    (field) => responses[field]?.verifiedByUser === true,
  );

  return Math.round(
    (verifiedRequiredFields.length / requiredFields.length) * 100,
  );
}

/**
 * Get list of required fields for AML compliance
 *
 * Note: source_of_funds removed as we only need proof of address, not source of funds.
 * We are not providing finance services.
 */
export const REQUIRED_AML_FIELDS = [
  // Individual/Contact Information
  "contact_first_name",
  "contact_last_name",
  "contact_date_of_birth",
  "contact_nationality",
  "contact_address",

  // Company Information (for limited companies)
  "company_name",
  "company_number",
  "company_type",
  "company_registered_address",

  // Business Activity
  "nature_of_business",
  "annual_turnover",

  // Beneficial Ownership (for companies)
  "beneficial_owners",

  // Risk Assessment
  "high_risk_jurisdictions",
  "cash_intensive_business",
  "politically_exposed_person",
];
