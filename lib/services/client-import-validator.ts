import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";

// CSV Row Schema - Maps to CSV column names
export const clientImportRowSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  client_code: z.string().optional(), // Generated if missing
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim()), // Normalize email
  phone: z.string().optional(),
  vat_number: z
    .string()
    .regex(/^GB\d{9,12}$/, "VAT number must be GB followed by 9-12 digits")
    .optional()
    .or(z.literal("")),
  companies_house_number: z
    .string()
    .length(8, "Companies House number must be 8 characters")
    .optional()
    .or(z.literal("")),
  client_type: z.enum(["individual", "company", "partnership", "trust"]),
  status: z.enum(["lead", "prospect", "active", "inactive"]).default("active"),
  street_address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
  country: z.string().default("United Kingdom"),
  client_manager_email: z
    .string()
    .email("Invalid manager email format")
    .optional()
    .or(z.literal("")),
});

export type ClientImportRow = z.infer<typeof clientImportRowSchema>;

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  managerId?: string;
  normalizedRow?: ClientImportRow;
}

// Parse date formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
export function parseFlexibleDate(dateString: string): {
  success: boolean;
  date?: Date;
  error?: string;
} {
  if (!dateString || dateString.trim() === "") {
    return { success: true }; // Empty date is valid
  }

  const trimmed = dateString.trim();

  // Try DD/MM/YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(`${year}-${month}-${day}`);
    if (!Number.isNaN(date.getTime())) {
      return { success: true, date };
    }
  }

  // Try YYYY-MM-DD
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return { success: true, date };
    }
  }

  // Try MM/DD/YYYY
  const mmddyyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(`${year}-${month}-${day}`);
    if (!Number.isNaN(date.getTime())) {
      return { success: true, date };
    }
  }

  return {
    success: false,
    error: `Invalid date format: ${trimmed}. Supported formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY`,
  };
}

// Validate individual client row
export async function validateClientRow(
  row: Record<string, unknown>,
  rowNumber: number,
  tenantId: string,
): Promise<ValidationResult> {
  const _errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Validate schema
  const result = clientImportRowSchema.safeParse(row);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(
        (e) => `Row ${rowNumber}: ${e.path.join(".")}: ${e.message}`,
      ),
    };
  }

  const normalizedRow = result.data;

  // Step 2: Check for duplicate by email or Companies House number
  if (normalizedRow.email || normalizedRow.companies_house_number) {
    const conditions = [];

    if (normalizedRow.email) {
      conditions.push(eq(clients.email, normalizedRow.email));
    }

    if (
      normalizedRow.companies_house_number &&
      normalizedRow.companies_house_number.trim() !== ""
    ) {
      conditions.push(
        eq(clients.registrationNumber, normalizedRow.companies_house_number),
      );
    }

    if (conditions.length > 0) {
      const duplicateCheck = await db
        .select({ id: clients.id, email: clients.email })
        .from(clients)
        .where(and(eq(clients.tenantId, tenantId), or(...conditions)))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return {
          valid: false,
          errors: [
            `Row ${rowNumber}: Duplicate client (email or Companies House number already exists)`,
          ],
        };
      }
    }
  }

  // Step 3: Look up client manager by email
  let managerId: string | undefined;
  if (
    normalizedRow.client_manager_email &&
    normalizedRow.client_manager_email.trim() !== ""
  ) {
    const manager = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.email, normalizedRow.client_manager_email),
        ),
      )
      .limit(1);

    if (manager.length === 0) {
      return {
        valid: false,
        errors: [
          `Row ${rowNumber}: Manager email not found: ${normalizedRow.client_manager_email}`,
        ],
      };
    }

    managerId = manager[0].id;
  }

  return {
    valid: true,
    errors: [],
    warnings,
    managerId,
    normalizedRow,
  };
}

// Batch validation for entire CSV
export async function validateClientImport(
  rows: Record<string, unknown>[],
  tenantId: string,
): Promise<{
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; errors: string[] }>;
  validatedData: Array<{
    row: number;
    data: ClientImportRow;
    managerId?: string;
  }>;
}> {
  const errors: Array<{ row: number; errors: string[] }> = [];
  const validatedData: Array<{
    row: number;
    data: ClientImportRow;
    managerId?: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // Account for header row (1-indexed)
    const result = await validateClientRow(rows[i], rowNumber, tenantId);

    if (result.valid && result.normalizedRow) {
      validatedData.push({
        row: rowNumber,
        data: result.normalizedRow,
        managerId: result.managerId,
      });
    } else {
      errors.push({ row: rowNumber, errors: result.errors });
    }
  }

  return {
    valid: errors.length === 0,
    totalRows: rows.length,
    validRows: validatedData.length,
    errorRows: errors.length,
    errors,
    validatedData,
  };
}

// Generate sequential client code
export async function generateClientCode(tenantId: string): Promise<string> {
  // Get the latest client code for this tenant
  const latestClient = await db
    .select({ clientCode: clients.clientCode })
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
    .orderBy(desc(clients.createdAt))
    .limit(1);

  if (latestClient.length === 0) {
    // First client
    return "CL-001";
  }

  // Extract number from last code (e.g., "CL-042" -> 42)
  const lastCode = latestClient[0].clientCode;
  const match = lastCode.match(/CL-(\d+)/);

  if (!match) {
    // Fallback if code format is unexpected
    return `CL-${Date.now().toString().slice(-6)}`;
  }

  const lastNumber = Number.parseInt(match[1], 10);
  const nextNumber = lastNumber + 1;

  // Pad with zeros (e.g., 43 -> "043")
  return `CL-${nextNumber.toString().padStart(3, "0")}`;
}
