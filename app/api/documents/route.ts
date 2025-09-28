import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, or, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const clientId = searchParams.get("clientId");
    const taskId = searchParams.get("taskId");

    const filters = [
      eq(documents.tenantId, authContext.tenantId),
      eq(documents.isArchived, false)
    ];

    // Handle folder navigation
    if (parentId === "root" || parentId === null) {
      filters.push(isNull(documents.parentId));
    } else if (parentId) {
      filters.push(eq(documents.parentId, parentId));
    }

    if (clientId) {
      filters.push(eq(documents.clientId, clientId));
    }
    if (taskId) {
      filters.push(eq(documents.taskId, taskId));
    }

    const docs = await db
      .select()
      .from(documents)
      .where(and(...filters))
      .orderBy(documents.type, documents.name);

    const formattedDocs = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      mimeType: doc.mimeType,
      size: doc.size,
      url: doc.url,
      thumbnailUrl: doc.thumbnailUrl,
      parentId: doc.parentId,
      path: doc.path,
      clientId: doc.clientId,
      taskId: doc.taskId,
      description: doc.description,
      tags: doc.tags,
      version: doc.version,
      isPublic: doc.isPublic,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    console.error("Documents API: Failed to fetch documents", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 },
      );
    }

    // Build path based on parent
    let path = `/${body.name}`;
    if (body.parentId) {
      const [parent] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, body.parentId));

      if (parent) {
        path = `${parent.path}/${body.name}`;
      }
    }

    const [newDoc] = await db
      .insert(documents)
      .values({
        tenantId: authContext.tenantId,
        name: body.name,
        type: body.type,
        mimeType: body.mimeType,
        size: body.size,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        parentId: body.parentId,
        path,
        clientId: body.clientId,
        taskId: body.taskId,
        description: body.description,
        tags: body.tags,
        uploadedById: authContext.userId
      })
      .returning();

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error) {
    console.error("Documents API: Failed to create document", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}