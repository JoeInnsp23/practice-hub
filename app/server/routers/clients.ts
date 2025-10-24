import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import Papa from "papaparse";
import { z } from "zod";
import {
  getCachedCompany,
  setCachedCompany,
} from "@/lib/companies-house/cache";
import {
  APIServerError,
  CompanyNotFoundError,
  getCompany,
  getOfficers,
  getPSCs,
  NetworkError,
  RateLimitError,
} from "@/lib/companies-house/client";
import {
  checkRateLimit,
  incrementRateLimit,
} from "@/lib/companies-house/rate-limit";
import { db } from "@/lib/db";
import { getClientsList } from "@/lib/db/queries/client-queries";
import {
  activityLogs,
  clientContacts,
  clientDirectors,
  clientPSCs,
  clientServices,
  clients,
  importLogs,
  onboardingSessions,
  services,
  users,
} from "@/lib/db/schema";
import {
  AuthenticationError,
  APIServerError as HMRCAPIServerError,
  NetworkError as HMRCNetworkError,
  RateLimitError as HMRCRateLimitError,
  validateVAT as hmrcValidateVAT,
  VATNotFoundError,
} from "@/lib/hmrc/client";
import {
  generateClientCode,
  validateClientImport,
} from "@/lib/services/client-import-validator";
import { protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertClientSchema = createInsertSchema(clients, {
  incorporationDate: z.string().optional(),
  yearEnd: z.string().optional(),
});

// Schema for create/update operations (omit auto-generated fields)
const clientSchema = insertClientSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
  })
  .extend({
    primaryContact: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        position: z.string().optional(),
      })
      .optional(),
  });

export const clientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Use typed query function
      const clients = await getClientsList(tenantId, input);

      return { clients };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [client] = await db
        .select({
          id: clients.id,
          tenantId: clients.tenantId,
          clientCode: clients.clientCode,
          name: clients.name,
          type: clients.type,
          status: clients.status,
          email: clients.email,
          phone: clients.phone,
          website: clients.website,
          vatNumber: clients.vatNumber,
          registrationNumber: clients.registrationNumber,
          addressLine1: clients.addressLine1,
          addressLine2: clients.addressLine2,
          city: clients.city,
          state: clients.state,
          postalCode: clients.postalCode,
          country: clients.country,
          accountManagerId: clients.accountManagerId,
          incorporationDate: clients.incorporationDate,
          yearEnd: clients.yearEnd,
          notes: clients.notes,
          healthScore: clients.healthScore,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          // Account Manager info
          accountManagerFirstName: users.firstName,
          accountManagerLastName: users.lastName,
        })
        .from(clients)
        .leftJoin(users, eq(clients.accountManagerId, users.id))
        .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Concatenate account manager name
      const accountManagerName =
        client.accountManagerFirstName && client.accountManagerLastName
          ? `${client.accountManagerFirstName} ${client.accountManagerLastName}`
          : null;

      return {
        ...client,
        accountManagerName,
      };
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
            createdBy: userId,
          })
          .returning();

        // Add primary contact if provided
        if (input.primaryContact) {
          await tx.insert(clientContacts).values({
            tenantId,
            clientId: newClient.id,
            isPrimary: true,
            firstName: input.primaryContact.firstName,
            lastName: input.primaryContact.lastName,
            email: input.primaryContact.email,
            phone: input.primaryContact.phone,
            mobile: input.primaryContact.mobile,
            position: input.primaryContact.position,
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
          newValues: {
            name: input.name,
            type: input.type,
            status: input.status || "active",
          },
        });

        return newClient;
      });

      return { success: true, client: result };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: clientSchema.partial(),
      }),
    )
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
          message: "Client not found",
        });
      }

      // Validate: Cannot set status to active if onboarding not complete
      if (input.data.status === "active") {
        const [onboardingSession] = await db
          .select()
          .from(onboardingSessions)
          .where(eq(onboardingSessions.clientId, input.id))
          .limit(1);

        if (onboardingSession && onboardingSession.status !== "completed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot set client to active status until onboarding is completed",
          });
        }
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
          message: "Client not found",
        });
      }

      // Archive instead of hard delete
      const [_archivedClient] = await db
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

  getClientServices: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      // Get client services with service details
      const clientServicesList = await db
        .select({
          id: clientServices.id,
          serviceId: services.id,
          serviceName: services.name,
          serviceCode: services.code,
          serviceCategory: services.category,
          serviceDescription: services.description,
          defaultRate: services.defaultRate,
          customRate: clientServices.customRate,
          priceType: services.priceType,
          duration: services.duration,
          startDate: clientServices.startDate,
          endDate: clientServices.endDate,
          isActive: clientServices.isActive,
          createdAt: clientServices.createdAt,
        })
        .from(clientServices)
        .innerJoin(services, eq(clientServices.serviceId, services.id))
        .where(
          and(
            eq(clientServices.clientId, clientId),
            eq(clientServices.tenantId, tenantId),
          ),
        )
        .orderBy(clientServices.createdAt);

      return { services: clientServicesList };
    }),

  getClientContacts: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      const contactsList = await db
        .select()
        .from(clientContacts)
        .where(
          and(
            eq(clientContacts.clientId, clientId),
            eq(clientContacts.tenantId, tenantId),
            eq(clientContacts.isActive, true),
          ),
        )
        .orderBy(clientContacts.isPrimary);

      return { contacts: contactsList };
    }),

  getClientDirectors: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      const directorsList = await db
        .select()
        .from(clientDirectors)
        .where(
          and(
            eq(clientDirectors.clientId, clientId),
            eq(clientDirectors.tenantId, tenantId),
          ),
        )
        .orderBy(clientDirectors.isActive);

      return { directors: directorsList };
    }),

  getClientPSCs: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      const pscsList = await db
        .select()
        .from(clientPSCs)
        .where(
          and(
            eq(clientPSCs.clientId, clientId),
            eq(clientPSCs.tenantId, tenantId),
          ),
        )
        .orderBy(clientPSCs.isActive);

      return { pscs: pscsList };
    }),

  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          firstName: z.string().optional(),
          middleName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          jobTitle: z.string().optional(),
          position: z.string().optional(),
          isPrimary: z.boolean().optional(),
          addressLine1: z.string().optional(),
          addressLine2: z.string().optional(),
          city: z.string().optional(),
          region: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check contact exists and belongs to tenant
      const existingContact = await db
        .select()
        .from(clientContacts)
        .where(
          and(
            eq(clientContacts.id, input.id),
            eq(clientContacts.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!existingContact[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      }

      // Update contact
      const [updatedContact] = await db
        .update(clientContacts)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(clientContacts.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_contact",
        entityId: input.id,
        action: "updated",
        description: `Updated contact ${updatedContact.firstName} ${updatedContact.lastName}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingContact[0],
        newValues: input.data,
      });

      return { success: true, contact: updatedContact };
    }),

  lookupCompaniesHouse: protectedProcedure
    .input(
      z.object({
        companyNumber: z
          .string()
          .regex(/^[0-9]{8}$/, "Company number must be 8 digits"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;
      const { companyNumber } = input;

      try {
        // Check rate limit first
        const withinLimit = await checkRateLimit();
        if (!withinLimit) {
          // Try to return cached data if available
          const cached = await getCachedCompany(companyNumber);
          if (cached) {
            return cached;
          }

          // No cached data available, throw rate limit error
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again in 5 minutes.",
          });
        }

        // Check cache
        const cached = await getCachedCompany(companyNumber);
        if (cached) {
          return cached;
        }

        // Call API - fetch all data in parallel
        const [company, officers, pscs] = await Promise.all([
          getCompany(companyNumber),
          getOfficers(companyNumber),
          getPSCs(companyNumber),
        ]);

        // Increment rate limit counter after successful API calls
        await incrementRateLimit();

        // Prepare data for cache
        const data = {
          company,
          officers,
          pscs,
        };

        // Store in cache
        await setCachedCompany(companyNumber, data);

        // Log activity (use generated UUID for entityId, store company number in metadata)
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "companies_house_lookup",
          entityId: crypto.randomUUID(),
          action: "looked_up",
          description: `Looked up Companies House data for ${company.companyName} (${companyNumber})`,
          userId,
          userName: `${firstName} ${lastName}`,
          metadata: {
            companyNumber,
            companyName: company.companyName,
          },
        });

        return data;
      } catch (error) {
        // Convert Companies House errors to TRPCError with user-friendly messages
        const errorContext = {
          tags: { operation: "companies_house_lookup" },
          extra: {
            companyNumber,
            tenantId,
            userId,
          },
        };

        if (error instanceof CompanyNotFoundError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Company not found. Please check the company number and try again.",
          });
        }

        if (error instanceof RateLimitError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again in 5 minutes.",
          });
        }

        if (error instanceof APIServerError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Companies House API is currently unavailable. Please try again later.",
          });
        }

        if (error instanceof NetworkError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Unable to connect to Companies House. Please check your internet connection and try again.",
          });
        }

        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        // Unknown error - capture and throw generic error
        Sentry.captureException(error, errorContext);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unexpected error occurred while looking up company data.",
        });
      }
    }),

  validateVAT: protectedProcedure
    .input(
      z.object({
        vatNumber: z
          .string()
          .regex(
            /^(GB)?[0-9]{9}$/,
            "VAT number must be 9 digits (GB prefix optional)",
          ),
        clientId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;
      const { vatNumber, clientId } = input;

      try {
        // Call HMRC VAT validation API
        const result = await hmrcValidateVAT(vatNumber);

        // If clientId provided, update the client record
        if (clientId) {
          await db
            .update(clients)
            .set({
              vatValidationStatus: result.isValid ? "valid" : "invalid",
              vatValidatedAt: new Date(),
              // Optionally update business name if validated and name matches
              ...(result.isValid && result.businessName
                ? { name: result.businessName }
                : {}),
            })
            .where(
              and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)),
            );
        }

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "vat_validation",
          entityId: clientId || crypto.randomUUID(),
          action: result.isValid ? "validated" : "validation_failed",
          description: `VAT validation ${result.isValid ? "succeeded" : "failed"} for ${vatNumber}${result.businessName ? ` (${result.businessName})` : ""}`,
          userId,
          userName: `${firstName} ${lastName}`,
          metadata: {
            vatNumber,
            isValid: result.isValid,
            businessName: result.businessName,
            clientId,
          },
        });

        return {
          isValid: result.isValid,
          vatNumber: result.vatNumber,
          businessName: result.businessName,
          businessAddress: result.businessAddress,
        };
      } catch (error) {
        // Convert HMRC errors to TRPCError with user-friendly messages
        const errorContext = {
          tags: { operation: "vat_validation" },
          extra: {
            vatNumber,
            clientId,
            tenantId,
            userId,
          },
        };

        if (error instanceof VATNotFoundError) {
          Sentry.captureException(error, errorContext);
          // Return invalid result instead of throwing (validation is advisory)
          return {
            isValid: false,
            vatNumber,
            error: "VAT number not found or invalid",
          };
        }

        if (error instanceof HMRCRateLimitError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          });
        }

        if (error instanceof HMRCAPIServerError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "HMRC API is currently unavailable. Please try again later.",
          });
        }

        if (error instanceof HMRCNetworkError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Unable to connect to HMRC. Please check your internet connection and try again.",
          });
        }

        if (error instanceof AuthenticationError) {
          Sentry.captureException(error, errorContext);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "HMRC authentication failed. Please contact support.",
          });
        }

        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        // Unknown error - capture and throw generic error
        Sentry.captureException(error, errorContext);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while validating VAT number.",
        });
      }
    }),

  // Preview CSV import (dry run - validation only, no database writes)
  previewImport: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      try {
        // Parse CSV
        const parseResult = Papa.parse(input.csvContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CSV parsing failed",
          });
        }

        // Validate rows
        const validationResult = await validateClientImport(
          parseResult.data as Record<string, unknown>[],
          tenantId,
        );

        // Return preview (first 5 rows + validation results)
        const previewRows = validationResult.validatedData.slice(0, 5);

        return {
          totalRows: validationResult.totalRows,
          validRows: validationResult.validRows,
          errorRows: validationResult.errorRows,
          errors: validationResult.errors,
          previewRows: previewRows.map((r) => ({
            row: r.row,
            data: r.data,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        Sentry.captureException(error, {
          tags: { operation: "preview_import" },
          extra: { tenantId },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to preview import",
        });
      }
    }),

  // Import clients from CSV
  importClients: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      try {
        // Parse CSV
        const parseResult = Papa.parse(input.csvContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CSV parsing failed",
          });
        }

        // Validate rows
        const validationResult = await validateClientImport(
          parseResult.data as Record<string, unknown>[],
          tenantId,
        );

        // Abort if there are validation errors
        if (validationResult.errorRows > 0) {
          return {
            success: false,
            imported: 0,
            skipped: 0,
            failed: validationResult.errorRows,
            errors: validationResult.errors,
          };
        }

        // Import valid rows in transaction
        const result = await db.transaction(async (tx) => {
          let imported = 0;
          let skipped = 0;

          for (const { data, managerId } of validationResult.validatedData) {
            try {
              // Generate client code if missing
              const clientCode =
                data.client_code || (await generateClientCode(tenantId));

              // Insert client
              await tx.insert(clients).values({
                tenantId,
                clientCode,
                name: data.company_name,
                type: data.client_type,
                status: data.status === "lead" ? "prospect" : data.status,
                email: data.email,
                phone: data.phone,
                vatNumber: data.vat_number || null,
                registrationNumber: data.companies_house_number || null,
                addressLine1: data.street_address || null,
                city: data.city || null,
                postalCode: data.postcode || null,
                country: data.country,
                accountManagerId: managerId || userId,
                createdBy: userId,
              });

              imported++;
            } catch (_error) {
              // Skip duplicate or constraint errors
              skipped++;
            }
          }

          // Create import log
          await tx.insert(importLogs).values({
            tenantId,
            entityType: "clients",
            fileName: "csv_import",
            totalRows: imported + skipped,
            processedRows: imported,
            failedRows: 0,
            skippedRows: skipped,
            errors: [],
            status: "completed",
            importedBy: userId,
          });

          // Log activity
          await tx.insert(activityLogs).values({
            tenantId,
            entityType: "client_import",
            entityId: crypto.randomUUID(),
            action: "imported",
            description: `Imported ${imported} clients from CSV`,
            userId,
            userName: `${firstName} ${lastName}`,
            metadata: {
              imported,
              skipped,
            },
          });

          return { imported, skipped };
        });

        return {
          success: true,
          imported: result.imported,
          skipped: result.skipped,
          failed: 0,
          errors: [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        Sentry.captureException(error, {
          tags: { operation: "import_clients" },
          extra: { tenantId, userId },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import clients",
        });
      }
    }),
});
