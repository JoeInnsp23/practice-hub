import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getFromS3 } from "@/lib/storage/s3";

export const runtime = "nodejs";

/**
 * Download file from S3
 * GET /api/documents/[id]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate user
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = authContext.tenantId;
    const documentId = params.id;

    // Get document from database
    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
      );

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (doc.type !== "file" || !doc.url) {
      return NextResponse.json(
        { error: "Document is not a file" },
        { status: 400 },
      );
    }

    // Extract S3 key from URL
    const url = new URL(doc.url);
    const key = url.pathname.split("/").slice(2).join("/"); // Remove /bucket-name/

    // Get file from S3
    const fileBuffer = await getFromS3(key);

    // Determine content disposition (inline for images/PDFs, attachment for others)
    const contentDisposition =
      doc.mimeType?.startsWith("image/") ||
      doc.mimeType === "application/pdf"
        ? `inline; filename="${doc.name}"`
        : `attachment; filename="${doc.name}"`;

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": contentDisposition,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
