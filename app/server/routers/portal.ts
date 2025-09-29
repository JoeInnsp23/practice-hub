import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  portalCategories,
  portalLinks,
  userFavorites,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

export const portalRouter = router({
  // Get all categories with their links
  getCategoriesWithLinks: protectedProcedure.query(async ({ ctx }) => {
    const categories = await db
      .select()
      .from(portalCategories)
      .where(
        and(
          eq(portalCategories.tenantId, ctx.authContext.tenantId),
          eq(portalCategories.isActive, true),
        ),
      )
      .orderBy(asc(portalCategories.sortOrder));

    const links = await db
      .select()
      .from(portalLinks)
      .where(
        and(
          eq(portalLinks.tenantId, ctx.authContext.tenantId),
          eq(portalLinks.isActive, true),
        ),
      )
      .orderBy(asc(portalLinks.sortOrder));

    // Check user role for filtering
    const userRole = ctx.authContext.role || "member";

    // Filter links based on allowed roles
    const filteredLinks = links.filter((link) => {
      if (!link.allowedRoles) return true;
      const allowedRoles = link.allowedRoles as string[];
      return allowedRoles.includes(userRole);
    });

    // Group links by category
    const categoriesWithLinks = categories.map((category) => ({
      ...category,
      links: filteredLinks.filter((link) => link.categoryId === category.id),
    }));

    return categoriesWithLinks;
  }),

  // Get all categories (for admin)
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.authContext.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can manage categories",
      });
    }

    return await db
      .select()
      .from(portalCategories)
      .where(eq(portalCategories.tenantId, ctx.authContext.tenantId))
      .orderBy(asc(portalCategories.sortOrder));
  }),

  // Create category (admin only)
  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        iconName: z.string().optional(),
        colorHex: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create categories",
        });
      }

      const [category] = await db
        .insert(portalCategories)
        .values({
          ...input,
          tenantId: ctx.authContext.tenantId,
          createdById: ctx.authContext.userId,
        })
        .returning();

      return category;
    }),

  // Update category (admin only)
  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        iconName: z.string().optional(),
        colorHex: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        sortOrder: z.number().int().min(0),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update categories",
        });
      }

      const { id, ...updateData } = input;

      const [category] = await db
        .update(portalCategories)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portalCategories.id, id),
            eq(portalCategories.tenantId, ctx.authContext.tenantId),
          ),
        )
        .returning();

      return category;
    }),

  // Delete category (admin only)
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete categories",
        });
      }

      await db
        .delete(portalCategories)
        .where(
          and(
            eq(portalCategories.id, input.id),
            eq(portalCategories.tenantId, ctx.authContext.tenantId),
          ),
        );

      return { success: true };
    }),

  // Get all links (for admin)
  getLinks: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can manage links",
        });
      }

      const conditions = [eq(portalLinks.tenantId, ctx.authContext.tenantId)];

      if (input.categoryId) {
        conditions.push(eq(portalLinks.categoryId, input.categoryId));
      }

      return await db
        .select()
        .from(portalLinks)
        .where(and(...conditions))
        .orderBy(asc(portalLinks.sortOrder));
    }),

  // Create link (admin only)
  createLink: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        url: z.string().url().or(z.string().startsWith("/")),
        isInternal: z.boolean().default(false),
        iconName: z.string().optional(),
        sortOrder: z.number().int().min(0).default(0),
        targetBlank: z.boolean().default(true),
        requiresAuth: z.boolean().default(false),
        allowedRoles: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create links",
        });
      }

      const [link] = await db
        .insert(portalLinks)
        .values({
          ...input,
          tenantId: ctx.authContext.tenantId,
          createdById: ctx.authContext.userId,
          allowedRoles: input.allowedRoles || null,
        })
        .returning();

      return link;
    }),

  // Update link (admin only)
  updateLink: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        categoryId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        url: z.string().url().or(z.string().startsWith("/")),
        isInternal: z.boolean(),
        iconName: z.string().optional(),
        sortOrder: z.number().int().min(0),
        isActive: z.boolean(),
        targetBlank: z.boolean(),
        requiresAuth: z.boolean(),
        allowedRoles: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update links",
        });
      }

      const { id, ...updateData } = input;

      const [link] = await db
        .update(portalLinks)
        .set({
          ...updateData,
          allowedRoles: updateData.allowedRoles || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portalLinks.id, id),
            eq(portalLinks.tenantId, ctx.authContext.tenantId),
          ),
        )
        .returning();

      return link;
    }),

  // Delete link (admin only)
  deleteLink: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete links",
        });
      }

      await db
        .delete(portalLinks)
        .where(
          and(
            eq(portalLinks.id, input.id),
            eq(portalLinks.tenantId, ctx.authContext.tenantId),
          ),
        );

      return { success: true };
    }),

  // Reorder categories (admin only)
  reorderCategories: protectedProcedure
    .input(
      z.object({
        categories: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reorder categories",
        });
      }

      // Update each category's sort order
      await Promise.all(
        input.categories.map((cat) =>
          db
            .update(portalCategories)
            .set({
              sortOrder: cat.sortOrder,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(portalCategories.id, cat.id),
                eq(portalCategories.tenantId, ctx.authContext.tenantId),
              ),
            ),
        ),
      );

      return { success: true };
    }),

  // Reorder links (admin only)
  reorderLinks: protectedProcedure
    .input(
      z.object({
        links: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.authContext.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reorder links",
        });
      }

      // Update each link's sort order
      await Promise.all(
        input.links.map((link) =>
          db
            .update(portalLinks)
            .set({
              sortOrder: link.sortOrder,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(portalLinks.id, link.id),
                eq(portalLinks.tenantId, ctx.authContext.tenantId),
              ),
            ),
        ),
      );

      return { success: true };
    }),

  // Get user favorites
  getUserFavorites: protectedProcedure.query(async ({ ctx }) => {
    // First get the database user ID from the Clerk ID
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, ctx.authContext.userId))
      .limit(1);

    if (!user[0]) {
      return [];
    }

    const favorites = await db
      .select({
        id: userFavorites.id,
        linkId: userFavorites.linkId,
        link: portalLinks,
      })
      .from(userFavorites)
      .innerJoin(portalLinks, eq(userFavorites.linkId, portalLinks.id))
      .where(eq(userFavorites.userId, user[0].id));

    return favorites;
  }),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ linkId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First get the database user ID from the Clerk ID
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, ctx.authContext.userId))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if favorite exists
      const existing = await db
        .select()
        .from(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, user[0].id),
            eq(userFavorites.linkId, input.linkId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Remove favorite
        await db
          .delete(userFavorites)
          .where(eq(userFavorites.id, existing[0].id));
        return { favorited: false };
      } else {
        // Add favorite
        await db.insert(userFavorites).values({
          userId: user[0].id,
          linkId: input.linkId,
        });
        return { favorited: true };
      }
    }),
});
