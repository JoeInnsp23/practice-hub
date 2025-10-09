import { NextResponse } from "next/server";
import { extractClientDataFromDocument, mapExtractedDataToQuestionnaire } from "@/lib/ai/extract-client-data";
import { saveExtractedDataToOnboarding } from "@/lib/ai/save-extracted-data";
import { uploadToS3 } from "@/lib/s3/upload";
import { db } from "@/lib/db";
import { onboardingSessions, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Document Upload & AI Extraction API
 *
 * POST /api/onboarding/upload-documents
 *
 * Handles client onboarding document uploads:
 * 1. Receives files via multipart/form-data
 * 2. Uploads to S3 for storage
 * 3. Extracts data using Gemini AI
 * 4. Saves extracted data to onboarding_responses
 * 5. Returns pre-filled questionnaire data
 *
 * Request body (multipart/form-data):
 * - onboardingSessionId: string
 * - tenantId: string
 * - files: File[] (1-10 files, max 10MB each)
 *
 * Response:
 * {
 *   success: boolean,
 *   extractedData: Record<string, any>,
 *   uploadedFiles: Array<{filename, url, documentType}>,
 *   confidence: "high" | "medium" | "low",
 *   warnings: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    const onboardingSessionId = formData.get("onboardingSessionId") as string;
    const tenantId = formData.get("tenantId") as string;

    if (!onboardingSessionId || !tenantId) {
      return NextResponse.json(
        { error: "Missing onboardingSessionId or tenantId" },
        { status: 400 }
      );
    }

    // Verify onboarding session exists
    const [session] = await db
      .select()
      .from(onboardingSessions)
      .where(eq(onboardingSessions.id, onboardingSessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Onboarding session not found" },
        { status: 404 }
      );
    }

    // Get all uploaded files
    const files: Array<{ buffer: Buffer; mimeType: string; filename: string }> = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds 10MB limit` },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/heic",
        ];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `File ${file.name} has unsupported type: ${file.type}` },
            { status: 400 }
          );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        files.push({
          buffer,
          mimeType: file.type,
          filename: file.name,
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} uploaded documents for session ${onboardingSessionId}`);

    // Upload files to S3 and extract data
    const uploadedFiles = [];
    const allExtractions = [];
    let mergedData: Record<string, any> = {};

    for (const file of files) {
      // Upload to S3
      const s3Key = `onboarding/${onboardingSessionId}/${Date.now()}_${file.filename}`;
      const s3Url = await uploadToS3(file.buffer, s3Key, file.mimeType);

      console.log(`Uploaded ${file.filename} to S3:`, s3Url);

      // Extract data with AI
      let extraction;
      try {
        extraction = await extractClientDataFromDocument(
          file.buffer,
          file.mimeType,
          file.filename
        );

        allExtractions.push(extraction);

        // Map to questionnaire format and merge
        const mapped = mapExtractedDataToQuestionnaire(extraction);
        mergedData = { ...mergedData, ...mapped };

        uploadedFiles.push({
          filename: file.filename,
          url: s3Url,
          documentType: extraction.documentType,
          confidence: extraction.confidence,
        });
      } catch (aiError) {
        console.error(`AI extraction failed for ${file.filename}:`, aiError);

        uploadedFiles.push({
          filename: file.filename,
          url: s3Url,
          documentType: "unknown",
          confidence: "low",
          error: "AI extraction failed",
        });
      }
    }

    // Save extracted data to database
    if (Object.keys(mergedData).length > 0) {
      await saveExtractedDataToOnboarding(
        tenantId,
        onboardingSessionId,
        mergedData,
        "batch_upload"
      );

      console.log(`Saved ${Object.keys(mergedData).length} extracted fields to database`);
    }

    // Calculate overall confidence
    const confidenceLevels = allExtractions.map((e) => e.confidence);
    const hasLow = confidenceLevels.includes("low");
    const hasMedium = confidenceLevels.includes("medium");
    const overallConfidence = hasLow ? "low" : hasMedium ? "medium" : "high";

    // Collect warnings
    const warnings = allExtractions.flatMap((e) => e.warnings || []);

    // Log activity
    await db.insert(activityLogs).values({
      tenantId,
      entityType: "onboarding_session",
      entityId: onboardingSessionId,
      action: "documents_uploaded",
      description: `Uploaded ${files.length} documents with AI extraction`,
      userId: null,
      userName: "Client Portal User",
      metadata: {
        filesCount: files.length,
        extractedFieldsCount: Object.keys(mergedData).length,
        confidence: overallConfidence,
        documentTypes: uploadedFiles.map((f) => f.documentType),
      },
    });

    return NextResponse.json({
      success: true,
      extractedData: mergedData,
      uploadedFiles,
      confidence: overallConfidence,
      warnings,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
