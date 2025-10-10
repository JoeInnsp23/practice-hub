import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { uploadPublicFile } from "@/lib/s3/upload";

export const runtime = "nodejs";

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Upload file(s) to S3 and create database records
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authContext.userId;
    const tenantId = authContext.tenantId;

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const parentId = formData.get("parentId") as string | null;
    const clientId = formData.get("clientId") as string | null;
    const tagsJson = formData.get("tags") as string | null;
    const tags = tagsJson ? JSON.parse(tagsJson) : [];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 },
      );
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds maximum size of 50MB`,
          },
          { status: 400 },
        );
      }
    }

    // Get parent folder path if specified
    let parentPath = "";
    if (parentId) {
      const [parent] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, parentId), eq(documents.tenantId, tenantId)));

      if (!parent) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 },
        );
      }

      if (parent.type !== "folder") {
        return NextResponse.json(
          { error: "Parent must be a folder" },
          { status: 400 },
        );
      }

      parentPath = parent.path || "";
    }

    // Upload files and create database records
    const uploadedDocuments = [];

    for (const file of files) {
      // Generate unique S3 key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).slice(2, 11);
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const s3Key = `documents/${tenantId}/${timestamp}-${randomString}-${sanitizedFilename}`;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3
      const publicUrl = await uploadPublicFile(buffer, s3Key, file.type);

      // Create database record
      const path = parentPath ? `${parentPath}/${file.name}` : `/${file.name}`;

      const [doc] = await db
        .insert(documents)
        .values({
          tenantId,
          name: file.name,
          type: "file",
          mimeType: file.type,
          size: file.size,
          url: publicUrl,
          parentId: parentId || null,
          path,
          clientId: clientId || null,
          tags,
          uploadedById: userId,
        })
        .returning();

      uploadedDocuments.push(doc);
    }

    return NextResponse.json({
      success: true,
      documents: uploadedDocuments,
      count: uploadedDocuments.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
