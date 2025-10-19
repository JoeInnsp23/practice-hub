import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, documentSignatures, documents, users } from "@/lib/db/schema";
import { docusealClient } from "@/lib/docuseal/client";
import {
  deleteFromS3,
  getPresignedUrl as getS3PresignedUrl,
} from "@/lib/storage/s3";
import { protectedProcedure, router } from "../trpc";

export const documentsRouter = router({
  /**
   * List documents and folders
   */
  list: protectedProcedure
    .input(
      z.object({
        parentId: z.string().uuid().optional().nullable(),
        clientId: z.string().uuid().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: z.enum(["file", "folder"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      // Build where conditions
      const whereConditions = [eq(documents.tenantId, tenantId)];

      // Filter by parent folder
      if (input.parentId === null) {
        whereConditions.push(isNull(documents.parentId));
      } else if (input.parentId) {
        whereConditions.push(eq(documents.parentId, input.parentId));
      }

      // Filter by client
      if (input.clientId) {
        whereConditions.push(eq(documents.clientId, input.clientId));
      }

      // Filter by type
      if (input.type) {
        whereConditions.push(eq(documents.type, input.type));
      }

      // Search in name and description
      if (input.search) {
        whereConditions.push(
          or(
            ilike(documents.name, `%${input.search}%`),
            ilike(documents.description, `%${input.search}%`),
          )!,
        );
      }

      // Get documents with uploader and client info
      const docs = await db
        .select({
          document: documents,
          uploader: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          client: clients,
        })
        .from(documents)
        .innerJoin(users, eq(documents.uploadedById, users.id))
        .leftJoin(clients, eq(documents.clientId, clients.id))
        .where(and(...whereConditions))
        .orderBy(
          // Folders first, then files, sorted by name
          desc(documents.type),
          asc(documents.name),
        )
        .limit(input.limit)
        .offset(input.offset);

      // Filter by tags if provided (JSON contains check)
      let filtered = docs;
      if (input.tags && input.tags.length > 0) {
        filtered = docs.filter((doc) => {
          const docTags = (doc.document.tags as string[]) || [];
          return input.tags?.some((tag) => docTags.includes(tag));
        });
      }

      return {
        documents: filtered,
        total: filtered.length,
      };
    }),

  /**
   * Get single document with details
   */
  get: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const [doc] = await db
        .select({
          document: documents,
          uploader: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            image: users.image,
          },
          client: clients,
        })
        .from(documents)
        .innerJoin(users, eq(documents.uploadedById, users.id))
        .leftJoin(clients, eq(documents.clientId, clients.id))
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      return doc;
    }),

  /**
   * Create folder
   */
  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        parentId: z.string().uuid().optional().nullable(),
        clientId: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authContext.userId;
      const tenantId = ctx.authContext.tenantId;

      // Build path
      let path = `/${input.name}`;
      if (input.parentId) {
        const [parent] = await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.id, input.parentId),
              eq(documents.tenantId, tenantId),
            ),
          );

        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent folder not found",
          });
        }

        if (parent.type !== "folder") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent must be a folder",
          });
        }

        path = `${parent.path}/${input.name}`;
      }

      const [folder] = await db
        .insert(documents)
        .values({
          tenantId,
          name: input.name,
          description: input.description,
          type: "folder",
          parentId: input.parentId,
          path,
          clientId: input.clientId,
          tags: input.tags || [],
          uploadedById: userId,
        })
        .returning();

      return folder;
    }),

  /**
   * Update document (rename, move, edit metadata)
   */
  update: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        parentId: z.string().uuid().optional().nullable(),
        clientId: z.string().uuid().optional().nullable(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      // Verify document exists
      const [doc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Build updated path if name or parent changed
      let path = doc.path;
      if (input.name || input.parentId !== undefined) {
        const name = input.name || doc.name;
        if (input.parentId === null) {
          path = `/${name}`;
        } else if (input.parentId) {
          const [parent] = await db
            .select()
            .from(documents)
            .where(
              and(
                eq(documents.id, input.parentId),
                eq(documents.tenantId, tenantId),
              ),
            );

          if (!parent || parent.type !== "folder") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid parent folder",
            });
          }

          path = `${parent.path}/${name}`;
        }
      }

      const [updated] = await db
        .update(documents)
        .set({
          name: input.name,
          description: input.description,
          parentId: input.parentId,
          clientId: input.clientId,
          tags: input.tags,
          path,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, input.documentId))
        .returning();

      return updated;
    }),

  /**
   * Delete document or folder
   */
  delete: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      // Get document
      const [doc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // If it's a file, delete from S3
      if (doc.type === "file" && doc.url) {
        try {
          // Extract S3 key from URL
          const url = new URL(doc.url);
          const key = url.pathname.split("/").slice(2).join("/"); // Remove /bucket-name/
          await deleteFromS3(key);
        } catch (error) {
          console.error("Failed to delete from S3:", error);
          // Continue with database deletion even if S3 deletion fails
        }
      }

      // If it's a folder, check for children
      if (doc.type === "folder") {
        const children = await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.parentId, input.documentId),
              eq(documents.tenantId, tenantId),
            ),
          );

        if (children.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete folder with contents. Delete or move children first.",
          });
        }
      }

      // Delete from database
      await db.delete(documents).where(eq(documents.id, input.documentId));

      return { success: true };
    }),

  /**
   * Get presigned URL for secure file access
   */
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        expiresIn: z.number().min(60).max(86400).default(3600), // 1 min to 24 hours
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const [doc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      if (doc.type !== "file" || !doc.url) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Document is not a file",
        });
      }

      // Extract S3 key from URL
      const url = new URL(doc.url);
      const key = url.pathname.split("/").slice(2).join("/");

      // Generate presigned URL
      const presignedUrl = await getS3PresignedUrl(key, input.expiresIn);

      return {
        url: presignedUrl,
        expiresIn: input.expiresIn,
        expiresAt: new Date(Date.now() + input.expiresIn * 1000),
      };
    }),

  /**
   * Create shareable link
   */
  createShareLink: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        expiresIn: z.number().min(3600).max(2592000).optional(), // 1 hour to 30 days
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const [doc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      if (doc.type !== "file") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only files can be shared",
        });
      }

      // Generate random share token
      const shareToken = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      // Calculate expiration
      const shareExpiresAt = input.expiresIn
        ? new Date(Date.now() + input.expiresIn * 1000)
        : null;

      // Update document with share token
      const [_updated] = await db
        .update(documents)
        .set({
          isPublic: true,
          shareToken,
          shareExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, input.documentId))
        .returning();

      return {
        shareToken,
        shareUrl: `/api/documents/share/${shareToken}`,
        expiresAt: shareExpiresAt,
      };
    }),

  /**
   * Get shared document (by token)
   */
  getSharedDocument: protectedProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const [doc] = await db
        .select({
          document: documents,
          uploader: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(documents)
        .innerJoin(users, eq(documents.uploadedById, users.id))
        .where(eq(documents.shareToken, input.shareToken));

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared document not found",
        });
      }

      // Check if share has expired
      if (
        doc.document.shareExpiresAt &&
        doc.document.shareExpiresAt < new Date()
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Share link has expired",
        });
      }

      if (!doc.document.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Document is not shared",
        });
      }

      return doc;
    }),

  /**
   * Revoke share link
   */
  revokeShareLink: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      await db
        .update(documents)
        .set({
          isPublic: false,
          shareToken: null,
          shareExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      return { success: true };
    }),

  /**
   * Get storage statistics
   */
  getStorageStats: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.authContext.tenantId;

    const files = await db
      .select()
      .from(documents)
      .where(and(eq(documents.tenantId, tenantId), eq(documents.type, "file")));

    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalFiles = files.length;

    // Count by mime type
    const byMimeType: Record<string, number> = {};
    for (const file of files) {
      const mimeType = file.mimeType || "unknown";
      byMimeType[mimeType] = (byMimeType[mimeType] || 0) + 1;
    }

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      byMimeType,
      quota: 10 * 1024 * 1024 * 1024, // 10 GB default quota
      quotaUsedPercent: (totalSize / (10 * 1024 * 1024 * 1024)) * 100,
    };
  }),

  /**
   * Search documents
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        clientId: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const whereConditions = [
        eq(documents.tenantId, tenantId),
        or(
          ilike(documents.name, `%${input.query}%`),
          ilike(documents.description, `%${input.query}%`),
        )!,
      ];

      if (input.clientId) {
        whereConditions.push(eq(documents.clientId, input.clientId));
      }

      const results = await db
        .select({
          document: documents,
          client: clients,
        })
        .from(documents)
        .leftJoin(clients, eq(documents.clientId, clients.id))
        .where(and(...whereConditions))
        .limit(input.limit);

      // Filter by tags if provided
      let filtered = results;
      if (input.tags && input.tags.length > 0) {
        filtered = results.filter((result) => {
          const docTags = (result.document.tags as string[]) || [];
          return input.tags?.some((tag) => docTags.includes(tag));
        });
      }

      return filtered;
    }),

  /**
   * Create document requiring signature
   */
  createSignatureDocument: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        clientId: z.string().uuid(),
        url: z.string().url(), // S3 URL of uploaded PDF
        description: z.string().optional(),
        size: z.number().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;
      const userId = ctx.authContext.userId;

      // Verify client exists and belongs to tenant
      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(eq(clients.id, input.clientId), eq(clients.tenantId, tenantId)),
        );

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Create document record
      const [document] = await db
        .insert(documents)
        .values({
          tenantId,
          name: input.name,
          type: "file",
          mimeType: input.mimeType || "application/pdf",
          size: input.size || 0,
          url: input.url,
          description: input.description,
          clientId: input.clientId,
          uploadedById: userId,
          requiresSignature: true,
          signatureStatus: "pending",
          path: `/${input.name}`,
        })
        .returning();

      // Create DocuSeal submission
      try {
        const submission = await docusealClient.createSubmission({
          template_id: process.env.DOCUSEAL_GENERIC_TEMPLATE_ID || "",
          send_email: true,
          submitters: [
            {
              email: client.email,
              name: client.name,
              role: "Client",
            },
          ],
          metadata: {
            document_id: document.id,
            tenant_id: tenantId,
            client_id: input.clientId,
          },
        });

        // Update document with DocuSeal submission ID
        await db
          .update(documents)
          .set({
            docusealSubmissionId: submission.id,
          })
          .where(eq(documents.id, document.id));

        // Get signing URL
        const signingUrl = docusealClient.getEmbedUrl(
          submission.id,
          client.email,
        );

        return {
          document,
          submission,
          signingUrl,
        };
      } catch (error) {
        // If DocuSeal fails, delete the document record
        await db.delete(documents).where(eq(documents.id, document.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create signing request",
          cause: error,
        });
      }
    }),

  /**
   * Get signing status for a document
   */
  getSigningStatus: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.authContext.tenantId;

      const [doc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.tenantId, tenantId),
          ),
        );

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      if (!doc.requiresSignature) {
        return {
          requiresSignature: false,
          status: "none",
        };
      }

      // Get signature record if exists
      const [signature] = await db
        .select()
        .from(documentSignatures)
        .where(eq(documentSignatures.documentId, input.documentId))
        .limit(1);

      return {
        requiresSignature: true,
        status: doc.signatureStatus,
        signedPdfUrl: doc.signedPdfUrl,
        signedAt: doc.signedAt,
        signedBy: doc.signedBy,
        signature: signature || null,
      };
    }),
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
