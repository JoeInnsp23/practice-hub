import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  departments,
  sopAssignments,
  sopCategories,
  sops,
  sopVersions,
  users,
} from "@/lib/db/schema";
import type { SopFileType } from "@/lib/storage/sop-storage";
import { getSopFileUrl, uploadSopFile } from "@/lib/storage/sop-storage";
import { adminProcedure, protectedProcedure, router } from "../trpc";

// Zod validation schemas
const createSopSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  fileBuffer: z.string(), // Base64-encoded file
  fileName: z.string().min(1, "File name is required"),
  fileType: z.enum(["pdf", "video", "document", "image"]),
  contentType: z.string(),
  requiresAcknowledgment: z.boolean().default(true),
  requiresPasswordVerification: z.boolean().default(true),
  expiryDate: z.string().nullable().optional(), // ISO date string
});

const updateSopSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  requiresAcknowledgment: z.boolean().optional(),
  requiresPasswordVerification: z.boolean().optional(),
  expiryDate: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived", "under_review"]).optional(),
});

const uploadNewVersionSchema = z.object({
  sopId: z.string().uuid(),
  fileBuffer: z.string(), // Base64-encoded
  fileName: z.string().min(1),
  fileType: z.enum(["pdf", "video", "document", "image"]),
  contentType: z.string(),
  version: z.string().min(1, "Version is required"),
  changeNotes: z.string().optional(),
});

const assignSopSchema = z.object({
  sopId: z.string().uuid(),
  assignedToUserId: z.string().uuid().optional(),
  assignedToRole: z.enum(["admin", "accountant", "member"]).optional(),
  assignedToDepartmentId: z.string().uuid().optional(),
  dueDate: z.string().optional(), // ISO date string
});

export const sopsRouter = router({
  // LIST SOPs (with filters, search, pagination)
  list: protectedProcedure
    .input(
      z
        .object({
          categoryId: z.string().uuid().optional(),
          status: z
            .enum(["draft", "published", "archived", "under_review"])
            .optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          sortBy: z
            .enum(["title", "createdAt", "publishedAt", "status"])
            .optional()
            .default("createdAt"),
          sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const whereConditions = [eq(sops.tenantId, tenantId)];

      // Filter by category
      if (input?.categoryId) {
        whereConditions.push(eq(sops.categoryId, input.categoryId));
      }

      // Filter by status
      if (input?.status) {
        whereConditions.push(eq(sops.status, input.status));
      }

      // Search in title and description
      if (input?.search) {
        const searchCondition = or(
          ilike(sops.title, `%${input.search}%`),
          ilike(sops.description, `%${input.search}%`),
        );
        if (searchCondition) {
          whereConditions.push(searchCondition);
        }
      }

      // Build orderBy
      const orderByArray = [];
      const sortDirection = input?.sortOrder === "desc" ? desc : asc;

      switch (input?.sortBy) {
        case "title":
          orderByArray.push(sortDirection(sops.title));
          break;
        case "publishedAt":
          orderByArray.push(sortDirection(sops.publishedAt));
          break;
        case "status":
          orderByArray.push(sortDirection(sops.status));
          break;
        default:
          orderByArray.push(sortDirection(sops.createdAt));
          break;
      }

      const sopList = await db
        .select({
          id: sops.id,
          title: sops.title,
          description: sops.description,
          categoryId: sops.categoryId,
          fileUrl: sops.fileUrl,
          fileType: sops.fileType,
          fileSizeBytes: sops.fileSizeBytes,
          version: sops.version,
          status: sops.status,
          requiresAcknowledgment: sops.requiresAcknowledgment,
          requiresPasswordVerification: sops.requiresPasswordVerification,
          expiryDate: sops.expiryDate,
          publishedAt: sops.publishedAt,
          archivedAt: sops.archivedAt,
          createdAt: sops.createdAt,
          updatedAt: sops.updatedAt,
          categoryName: sopCategories.name,
          createdByName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        })
        .from(sops)
        .innerJoin(sopCategories, eq(sops.categoryId, sopCategories.id))
        .innerJoin(users, eq(sops.createdBy, users.id))
        .where(and(...whereConditions))
        .orderBy(...orderByArray)
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(sops)
        .where(and(...whereConditions));

      return {
        sops: sopList,
        total: countResult?.count ?? 0,
      };
    }),

  // GET single SOP by ID
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [sop] = await db
        .select({
          id: sops.id,
          title: sops.title,
          description: sops.description,
          categoryId: sops.categoryId,
          fileUrl: sops.fileUrl,
          fileType: sops.fileType,
          fileSizeBytes: sops.fileSizeBytes,
          version: sops.version,
          status: sops.status,
          requiresAcknowledgment: sops.requiresAcknowledgment,
          requiresPasswordVerification: sops.requiresPasswordVerification,
          expiryDate: sops.expiryDate,
          publishedAt: sops.publishedAt,
          archivedAt: sops.archivedAt,
          createdAt: sops.createdAt,
          updatedAt: sops.updatedAt,
          categoryName: sopCategories.name,
          createdByName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        })
        .from(sops)
        .innerJoin(sopCategories, eq(sops.categoryId, sopCategories.id))
        .innerJoin(users, eq(sops.createdBy, users.id))
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      if (!sop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      return { sop };
    }),

  // GET SOP file presigned URL
  getFileUrl: protectedProcedure
    .input(
      z.object({
        sopId: z.string().uuid(),
        expiresIn: z.number().optional().default(3600),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const [sop] = await db
        .select({ fileUrl: sops.fileUrl })
        .from(sops)
        .where(and(eq(sops.id, input.sopId), eq(sops.tenantId, tenantId)));

      if (!sop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      try {
        const presignedUrl = await getSopFileUrl(sop.fileUrl, input.expiresIn);
        return { url: presignedUrl, expiresIn: input.expiresIn };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate file URL",
          cause: error,
        });
      }
    }),

  // CREATE new SOP (admin only)
  create: adminProcedure
    .input(createSopSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Verify category exists and belongs to tenant
      const [category] = await db
        .select({ id: sopCategories.id })
        .from(sopCategories)
        .where(
          and(
            eq(sopCategories.id, input.categoryId),
            eq(sopCategories.tenantId, tenantId),
          ),
        );

      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Category not found",
        });
      }

      // Create SOP record first (need sopId for S3 key)
      const sopId = crypto.randomUUID();

      try {
        // Decode base64 file buffer
        const fileBuffer = Buffer.from(input.fileBuffer, "base64");

        // Upload file to S3
        const s3Key = await uploadSopFile({
          tenantId,
          sopId,
          version: "1.0",
          buffer: fileBuffer,
          fileName: input.fileName,
          fileType: input.fileType as SopFileType,
          contentType: input.contentType,
        });

        // Insert SOP record
        const [newSop] = await db
          .insert(sops)
          .values({
            tenantId,
            title: input.title,
            description: input.description,
            categoryId: input.categoryId,
            fileUrl: s3Key,
            fileType: input.fileType,
            fileSizeBytes: fileBuffer.length,
            version: "1.0",
            status: "draft",
            requiresAcknowledgment: input.requiresAcknowledgment,
            requiresPasswordVerification: input.requiresPasswordVerification,
            expiryDate: input.expiryDate || null,
            createdBy: userId,
          })
          .returning();

        // Create initial version record
        await db.insert(sopVersions).values({
          tenantId,
          sopId: newSop.id,
          version: "1.0",
          fileUrl: s3Key,
          fileType: input.fileType,
          changeNotes: "Initial version",
          createdBy: userId,
        });

        return { sop: newSop };
      } catch (error) {
        // Cleanup: delete SOP record if file upload failed
        await db
          .delete(sops)
          .where(eq(sops.id, sopId))
          .catch(() => {});

        Sentry.captureException(error, {
          tags: { operation: "createSop" },
          extra: { tenantId, sopId, fileName: input.fileName },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create SOP",
          cause: error,
        });
      }
    }),

  // UPDATE SOP metadata (admin only)
  update: adminProcedure
    .input(updateSopSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { id, ...updates } = input;

      // Verify SOP exists and belongs to tenant
      const [existingSop] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      if (!existingSop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      // Verify category if provided
      if (updates.categoryId) {
        const [category] = await db
          .select({ id: sopCategories.id })
          .from(sopCategories)
          .where(
            and(
              eq(sopCategories.id, updates.categoryId),
              eq(sopCategories.tenantId, tenantId),
            ),
          );

        if (!category) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Category not found",
          });
        }
      }

      // Convert expiryDate string to Date if provided
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.expiryDate !== undefined) {
        updateData.expiryDate = updates.expiryDate
          ? new Date(updates.expiryDate)
          : null;
      }

      const [updatedSop] = await db
        .update(sops)
        .set(updateData)
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)))
        .returning();

      return { sop: updatedSop };
    }),

  // PUBLISH SOP (admin only)
  publish: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [existingSop] = await db
        .select({ id: sops.id, status: sops.status })
        .from(sops)
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      if (!existingSop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      if (existingSop.status === "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SOP is already published",
        });
      }

      const [updatedSop] = await db
        .update(sops)
        .set({ status: "published", publishedAt: new Date() })
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)))
        .returning();

      return { sop: updatedSop };
    }),

  // ARCHIVE SOP (admin only)
  archive: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [existingSop] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      if (!existingSop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      const [updatedSop] = await db
        .update(sops)
        .set({ status: "archived", archivedAt: new Date() })
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)))
        .returning();

      return { sop: updatedSop };
    }),

  // DELETE SOP (admin only) - soft delete via archive
  delete: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [existingSop] = await db
        .select({ fileUrl: sops.fileUrl })
        .from(sops)
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      if (!existingSop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      // Archive instead of hard delete
      await db
        .update(sops)
        .set({ status: "archived", archivedAt: new Date() })
        .where(and(eq(sops.id, id), eq(sops.tenantId, tenantId)));

      return { success: true };
    }),

  // UPLOAD NEW VERSION (admin only)
  uploadNewVersion: adminProcedure
    .input(uploadNewVersionSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Verify SOP exists
      const [existingSop] = await db
        .select({ id: sops.id, version: sops.version })
        .from(sops)
        .where(and(eq(sops.id, input.sopId), eq(sops.tenantId, tenantId)));

      if (!existingSop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      // Check if version already exists
      const [existingVersion] = await db
        .select({ id: sopVersions.id })
        .from(sopVersions)
        .where(
          and(
            eq(sopVersions.sopId, input.sopId),
            eq(sopVersions.version, input.version),
          ),
        );

      if (existingVersion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Version ${input.version} already exists`,
        });
      }

      try {
        // Decode and upload new file
        const fileBuffer = Buffer.from(input.fileBuffer, "base64");

        const s3Key = await uploadSopFile({
          tenantId,
          sopId: input.sopId,
          version: input.version,
          buffer: fileBuffer,
          fileName: input.fileName,
          fileType: input.fileType as SopFileType,
          contentType: input.contentType,
        });

        // Create version record
        const [newVersion] = await db
          .insert(sopVersions)
          .values({
            tenantId,
            sopId: input.sopId,
            version: input.version,
            fileUrl: s3Key,
            fileType: input.fileType,
            changeNotes: input.changeNotes,
            createdBy: userId,
          })
          .returning();

        // Update SOP to point to new version
        await db
          .update(sops)
          .set({
            version: input.version,
            fileUrl: s3Key,
            fileType: input.fileType,
            fileSizeBytes: fileBuffer.length,
          })
          .where(eq(sops.id, input.sopId));

        return { version: newVersion };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "uploadSopVersion" },
          extra: { tenantId, sopId: input.sopId, version: input.version },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload new version",
          cause: error,
        });
      }
    }),

  // LIST VERSIONS for a SOP
  listVersions: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: sopId }) => {
      const { tenantId } = ctx.authContext;

      // Verify SOP exists
      const [sop] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(and(eq(sops.id, sopId), eq(sops.tenantId, tenantId)));

      if (!sop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      const versions = await db
        .select({
          id: sopVersions.id,
          version: sopVersions.version,
          fileUrl: sopVersions.fileUrl,
          fileType: sopVersions.fileType,
          changeNotes: sopVersions.changeNotes,
          createdAt: sopVersions.createdAt,
          createdByName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        })
        .from(sopVersions)
        .innerJoin(users, eq(sopVersions.createdBy, users.id))
        .where(eq(sopVersions.sopId, sopId))
        .orderBy(desc(sopVersions.createdAt));

      return { versions };
    }),

  // ASSIGN SOP to users/roles/departments (admin only)
  assign: adminProcedure
    .input(assignSopSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      // Must specify at least one assignment target
      if (
        !input.assignedToUserId &&
        !input.assignedToRole &&
        !input.assignedToDepartmentId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Must specify at least one assignment target (user, role, or department)",
        });
      }

      // Verify SOP exists
      const [sop] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(and(eq(sops.id, input.sopId), eq(sops.tenantId, tenantId)));

      if (!sop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      // Verify user if specified
      if (input.assignedToUserId) {
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.id, input.assignedToUserId),
              eq(users.tenantId, tenantId),
            ),
          );

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User not found",
          });
        }
      }

      // Verify department if specified
      if (input.assignedToDepartmentId) {
        const [department] = await db
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.id, input.assignedToDepartmentId),
              eq(departments.tenantId, tenantId),
            ),
          );

        if (!department) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Department not found",
          });
        }
      }

      // Create assignment
      const [assignment] = await db
        .insert(sopAssignments)
        .values({
          tenantId,
          sopId: input.sopId,
          assignedToUserId: input.assignedToUserId,
          assignedToRole: input.assignedToRole,
          assignedToDepartmentId: input.assignedToDepartmentId,
          dueDate: input.dueDate || null,
          status: "pending",
          assignedBy: userId,
        })
        .returning();

      return { assignment };
    }),

  // LIST ASSIGNMENTS for a SOP
  listAssignments: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: sopId }) => {
      const { tenantId } = ctx.authContext;

      // Verify SOP exists
      const [sop] = await db
        .select({ id: sops.id })
        .from(sops)
        .where(and(eq(sops.id, sopId), eq(sops.tenantId, tenantId)));

      if (!sop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SOP not found",
        });
      }

      const assignments = await db
        .select({
          id: sopAssignments.id,
          assignedToUserId: sopAssignments.assignedToUserId,
          assignedToRole: sopAssignments.assignedToRole,
          assignedToDepartmentId: sopAssignments.assignedToDepartmentId,
          dueDate: sopAssignments.dueDate,
          status: sopAssignments.status,
          completedAt: sopAssignments.completedAt,
          createdAt: sopAssignments.createdAt,
          assignedByName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          departmentName: departments.name,
        })
        .from(sopAssignments)
        .innerJoin(users, eq(sopAssignments.assignedBy, users.id))
        .leftJoin(
          departments,
          eq(sopAssignments.assignedToDepartmentId, departments.id),
        )
        .where(eq(sopAssignments.sopId, sopId))
        .orderBy(desc(sopAssignments.createdAt));

      return { assignments };
    }),

  // LIST CATEGORIES (for dropdowns)
  listCategories: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const categories = await db
      .select({
        id: sopCategories.id,
        name: sopCategories.name,
        description: sopCategories.description,
        parentCategoryId: sopCategories.parentCategoryId,
        sortOrder: sopCategories.sortOrder,
      })
      .from(sopCategories)
      .where(
        and(
          eq(sopCategories.tenantId, tenantId),
          eq(sopCategories.isActive, true),
        ),
      )
      .orderBy(asc(sopCategories.sortOrder), asc(sopCategories.name));

    return { categories };
  }),

  // GET STATS (for dashboard)
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const [stats] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        draft: sql<number>`cast(count(*) FILTER (WHERE ${sops.status} = 'draft') as int)`,
        published: sql<number>`cast(count(*) FILTER (WHERE ${sops.status} = 'published') as int)`,
        archived: sql<number>`cast(count(*) FILTER (WHERE ${sops.status} = 'archived') as int)`,
      })
      .from(sops)
      .where(eq(sops.tenantId, tenantId));

    return stats ?? { total: 0, draft: 0, published: 0, archived: 0 };
  }),
});
