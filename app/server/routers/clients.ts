import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { clients, clientContacts, activityLogs } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const clientSchema = z.object({
  clientCode: z.string(),
  name: z.string(),
  type: z.enum(["individual", "company", "trust", "partnership"]),
  status: z.enum(["active", "inactive", "prospect", "archived"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  vatNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  accountManagerId: z.string().optional(),
  incorporationDate: z.string().optional(),
  yearEnd: z.string().optional(),
  notes: z.string().optional(),
  primaryContact: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    position: z.string().optional(),
  }).optional(),
});

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;
      const { search, type, status } = input;

      // Build query using the client details view
      let query = sql`
        SELECT * FROM client_details_view
        WHERE tenant_id = ${tenantId}
      `;

      // Add filters
      const conditions = [];
      if (search) {
        conditions.push(sql`(
          name ILIKE ${`%${search}%`} OR
          client_code ILIKE ${`%${search}%`} OR
          email ILIKE ${`%${search}%`}
        )`);
      }
      if (type && type !== "all") {
        conditions.push(sql`type = ${type}`);
      }
      if (status && status !== "all") {
        conditions.push(sql`status = ${status}`);
      }

      // Combine conditions
      if (conditions.length > 0) {
        query = sql`
          SELECT * FROM client_details_view
          WHERE tenant_id = ${tenantId}
            AND ${sql.join(conditions, sql` AND `)}
        `;
      }

      // Add ordering
      query = sql`${query} ORDER BY created_at DESC`;

      const result = await db.execute(query);

      // Format the response
      const clientsList = result.rows.map((client: any) => ({
        id: client.id,
        clientCode: client.client_code,
        name: client.name,
        type: client.type,
        status: client.status,
        email: client.email,
        phone: client.phone,
        website: client.website,
        vatNumber: client.vat_number,
        registrationNumber: client.registration_number,
        addressLine1: client.address_line1,
        addressLine2: client.address_line2,
        city: client.city,
        state: client.state,
        postalCode: client.postal_code,
        country: client.country,
        accountManagerId: client.account_manager_id,
        accountManagerName: client.account_manager_name,
        incorporationDate: client.incorporation_date,
        yearEnd: client.year_end,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      }));

      return { clients: clientsList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const client = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
        .limit(1);

      if (!client[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found"
        });
      }

      return client[0];
    }),

  create: protectedProcedure
    .input(clientSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Start a transaction
      const result = await db.transaction(async (tx) => {
        // Create the client
        const [newClient] = await tx
          .insert(clients)
          .values({
            tenantId,
            clientCode: input.clientCode,
            name: input.name,
            type: input.type,
            status: input.status || "active",
            email: input.email,
            phone: input.phone,
            website: input.website,
            vatNumber: input.vatNumber,
            registrationNumber: input.registrationNumber,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country,
            accountManagerId: input.accountManagerId || userId,
            incorporationDate: input.incorporationDate,
            yearEnd: input.yearEnd,
            notes: input.notes,
            createdBy: userId
          })
          .returning();

        // Add primary contact if provided
        if (input.primaryContact) {
          await tx.insert(clientContacts).values({
            clientId: newClient.id,
            firstName: input.primaryContact.firstName,
            lastName: input.primaryContact.lastName,
            email: input.primaryContact.email,
            phone: input.primaryContact.phone,
            mobile: input.primaryContact.mobile,
            position: input.primaryContact.position
          });
        }

        // Log the activity
        await tx.insert(activityLogs).values({
          tenantId,
          entityType: "client",
          entityId: newClient.id,
          action: "created",
          description: `Created new client "${input.name}"`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: { name: input.name, type: input.type, status: input.status || "active" }
        });

        return newClient;
      });

      return { success: true, client: result };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: clientSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check client exists and belongs to tenant
      const existingClient = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.tenantId, tenantId)))
        .limit(1);

      if (!existingClient[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found"
        });
      }

      // Update client
      const [updatedClient] = await db
        .update(clients)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client",
        entityId: input.id,
        action: "updated",
        description: `Updated client "${updatedClient.name}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingClient[0],
        newValues: input.data,
      });

      return { success: true, client: updatedClient };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check client exists and belongs to tenant
      const existingClient = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
        .limit(1);

      if (!existingClient[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found"
        });
      }

      // Archive instead of hard delete
      const [archivedClient] = await db
        .update(clients)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(clients.id, id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client",
        entityId: id,
        action: "archived",
        description: `Archived client "${existingClient[0].name}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),
});