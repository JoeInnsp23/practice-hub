import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getFromS3 } from "@/lib/storage/s3";

export const runtime = "nodejs";

/**
 * Download shared file (no authentication required)
 * GET /api/documents/share/[token]
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token: shareToken } = await context.params;

    // Get document by share token
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.shareToken, shareToken));

    if (!doc) {
      return NextResponse.json(
        { error: "Shared document not found" },
        { status: 404 },
      );
    }

    // Check if share has expired
    if (doc.shareExpiresAt && doc.shareExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 403 },
      );
    }

    // Check if document is public
    if (!doc.isPublic) {
      return NextResponse.json(
        { error: "Document is not shared" },
        { status: 403 },
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
    const key = url.pathname.split("/").slice(2).join("/");

    // Get file from S3
    const fileBuffer = await getFromS3(key);

    // Determine content disposition
    const contentDisposition =
      doc.mimeType?.startsWith("image/") || doc.mimeType === "application/pdf"
        ? `inline; filename="${doc.name}"`
        : `attachment; filename="${doc.name}"`;

    // Return file (convert Buffer to Uint8Array)
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": contentDisposition,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Shared file download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download shared file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
