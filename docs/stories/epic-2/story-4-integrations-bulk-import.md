# User Story: Integration Settings & Bulk Import Infrastructure

**Story ID:** STORY-2.4
**Epic:** Epic 2 - High-Impact Workflows
**Feature:** FR9 (Integration Settings) + FR10 (Bulk Import Infrastructure)
**Priority:** High
**Effort:** 6-8 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** integration settings with OAuth flows and CSV bulk import infrastructure
**So that** I can connect external services (Xero) and rapidly import client/task/service data

---

## Business Value

- **Automation:** Xero integration enables automated invoice sync and financial data flow
- **Efficiency:** Bulk CSV import enables rapid practice firm onboarding (100+ clients in <30s)
- **Foundation:** CSV import infrastructure foundation for Epic 5 (service/task import)
- **Scalability:** Reduces manual data entry from days to minutes

---

## Acceptance Criteria

### Functional Requirements - Integration Settings (FR9)

**AC1: Integration Settings Page**
- **Given** an admin navigates to `/client-hub/settings/integrations`
- **When** the page loads
- **Then** available integrations are displayed with toggle switches
- **And** integrations include: Xero (priority), QuickBooks, Sage, Slack, Teams, Stripe (placeholders)

**AC2: Xero Integration Toggle**
- **Given** an admin views the integrations page
- **When** they toggle Xero integration to "enabled"
- **Then** OAuth 2.0 flow is initiated
- **And** user is redirected to Xero authorization page
- **And** after authorization, they are redirected back with auth code

**AC3: Xero OAuth Callback Handling**
- **Given** Xero authorization completes
- **When** the callback URL is triggered
- **Then** auth code is exchanged for access token and refresh token
- **And** tokens are encrypted and stored in integrationSettings.credentials
- **And** integration status changes to "connected"
- **And** success toast is shown: "Xero connected successfully"

**AC4: Integration Status Indicators**
- **Given** integrations are configured
- **When** the settings page is viewed
- **Then** status indicators show: "Connected" (green) or "Disconnected" (gray)
- **And** last sync timestamp is displayed (e.g., "Last synced: 2 hours ago")

**AC5: Test Connection Button**
- **Given** an integration is connected
- **When** the admin clicks "Test Connection" button
- **Then** API call is made to verify credentials
- **And** success message is shown if credentials are valid
- **And** error message is shown if credentials are invalid

**AC6: Integration Configuration Modal**
- **Given** an admin clicks "Configure" button for an integration
- **When** the modal opens
- **Then** configuration options are displayed (e.g., sync frequency, account mapping)
- **And** saving configuration updates integrationSettings.config JSONB

**AC7: Secure Credential Storage**
- **Given** OAuth tokens or API keys are received
- **When** they are stored in database
- **Then** credentials are encrypted using AES-256
- **And** encrypted text is stored in integrationSettings.credentials
- **And** credentials are decrypted only when needed for API calls

**AC8: Placeholder Integrations**
- **Given** QuickBooks/Sage/Slack/Teams/Stripe integrations are displayed
- **When** the admin clicks "Configure" on placeholder integrations
- **Then** "Coming Soon" message is shown
- **And** toggle is disabled (UI only, Phase 2 implementation)

### Functional Requirements - Bulk Import Infrastructure (FR10)

**AC9: CSV Import API Routes**
- **Given** CSV import infrastructure is implemented
- **When** API routes are accessed
- **Then** endpoints are available at:
  - `/api/import/clients` - Client CSV import
  - `/api/import/tasks` - Task CSV import
  - `/api/import/services` - Service CSV import

**AC10: CSV Parsing Service**
- **Given** a CSV file is uploaded
- **When** the parsing service processes it
- **Then** CSV is parsed using Papa Parse library
- **And** headers are extracted and validated
- **And** rows are converted to typed objects

**AC11: Import Validation Framework**
- **Given** CSV data is parsed
- **When** validation runs
- **Then** field types are validated (e.g., email format, date format)
- **And** required fields are checked (e.g., company_name, email)
- **And** invalid rows are flagged with error messages

**AC12: Dry Run Mode**
- **Given** a CSV file is uploaded
- **When** "Preview Import" button is clicked
- **Then** validation runs without database writes
- **And** validation report is returned with row counts:
  - Valid rows: 45
  - Invalid rows: 3 (with specific errors)
- **And** first 5 rows are displayed as preview

**AC13: Error Reporting with Row Numbers**
- **Given** CSV validation finds errors
- **When** the validation report is displayed
- **Then** errors include row numbers (e.g., "Row 15: Invalid email format")
- **And** errors include field name and error reason
- **And** error summary is shown: "3 errors in 100 rows"

**AC14: Progress Tracking**
- **Given** a large CSV file is being imported
- **When** the import runs
- **Then** progress events are emitted (e.g., "50 of 100 rows processed")
- **And** progress bar is updated in real-time
- **And** estimated time remaining is displayed

**AC15: Import Templates Generation**
- **Given** an admin navigates to data import page
- **When** they click "Download Template" button
- **Then** CSV template is generated for selected entity type
- **And** template includes:
  - Header row with all required and optional fields
  - Example row with sample data
  - Comments row with field descriptions

**AC16: Bulk Database Insertion**
- **Given** CSV validation passes
- **When** import is confirmed
- **Then** all rows are inserted in a single database transaction
- **And** if any row fails, entire transaction rolls back
- **And** error message shows which row caused failure

**AC17: Import Audit Trail**
- **Given** an import completes (success or failure)
- **When** the import log is created
- **Then** importLogs table is updated with:
  - Import type (clients/tasks/services)
  - File name, rows processed, rows failed
  - Errors JSONB with row numbers and messages
  - Imported by user ID, imported at timestamp

**AC18: Connect DataImportModal**
- **Given** DataImportModal component exists
- **When** the "Import" button is clicked
- **Then** modal opens with file upload and entity type selection
- **And** clicking "Upload" calls correct API endpoint (not 404)
- **And** progress is displayed during import

**AC19: Import History Page**
- **Given** an admin navigates to `/client-hub/data/import-history`
- **When** the page loads
- **Then** all import logs are displayed in a table
- **And** columns show: date, type, file name, rows processed, rows failed, status
- **And** clicking a row shows detailed error report

### Integration Requirements

**AC20: Multi-tenant Isolation**
- **Given** multiple tenants use integrations and bulk import
- **When** data is queried or imported
- **Then** all queries filter by tenantId
- **And** imported data is automatically tagged with tenantId

**AC21: Integration Credentials Scoped**
- **Given** integrations are configured per tenant
- **When** API calls are made
- **Then** correct tenant credentials are used
- **And** tenants cannot access other tenants' integration credentials

### Quality Requirements

**AC22: Performance**
- **Given** a CSV file with 100 rows is imported
- **When** performance is measured
- **Then** parsing completes in <5 seconds
- **And** database insertion completes in <10 seconds
- **And** total import time is <30 seconds

**AC23: Error Recovery**
- **Given** an import fails mid-process
- **When** the transaction rolls back
- **Then** no partial data is left in database
- **And** user can retry import with corrected CSV

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// integrationSettings table
export const integrationSettings = pgTable("integration_settings", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  integrationType: text("integration_type").notNull(), // "xero" | "quickbooks" | "slack" | etc.
  enabled: boolean("enabled").default(false).notNull(),
  credentials: text("credentials"), // encrypted JSON (access_token, refresh_token, etc.)
  config: json("config"), // integration-specific config (sync frequency, mappings, etc.)
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status"), // "success" | "error" | null
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("integration_settings_tenant_id_idx").on(table.tenantId),
  typeIdx: index("integration_settings_type_idx").on(table.integrationType),
}));

// importLogs table
export const importLogs = pgTable("import_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  importType: text("import_type").notNull(), // "clients" | "services" | "tasks"
  fileName: text("file_name").notNull(),
  rowsProcessed: integer("rows_processed").notNull(),
  rowsFailed: integer("rows_failed").notNull(),
  errors: json("errors"), // array of error objects: [{ row: 15, field: "email", error: "Invalid format" }]
  importedBy: text("imported_by").references(() => users.id).notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("import_logs_tenant_id_idx").on(table.tenantId),
  typeIdx: index("import_logs_type_idx").on(table.importType),
}));
```

### File Structure

```
app/client-hub/settings/
  integrations/
    page.tsx                  # Integration settings UI
app/client-hub/data/
  import-history/
    page.tsx                  # Import history page
app/api/
  import/
    clients/
      route.ts                # Client CSV import endpoint
    tasks/
      route.ts                # Task CSV import endpoint
    services/
      route.ts                # Service CSV import endpoint
  templates/
    [type]/
      route.ts                # Template download endpoint
lib/services/
  csv-parser.ts               # CSV parsing service (Papa Parse)
  import-validators.ts        # Import validation framework
  encryption.ts               # Credential encryption service
lib/integrations/
  xero.ts                     # Xero OAuth service
```

### CSV Parser Service

```typescript
// lib/services/csv-parser.ts

import Papa from "papaparse";

export interface CSVParseResult<T> {
  data: T[];
  errors: Array<{ row: number; field: string; error: string }>;
  meta: {
    fields: string[];
    rowCount: number;
  };
}

export async function parseCSV<T>(
  file: File,
  validator: (row: any) => { valid: boolean; errors: string[] }
): Promise<CSVParseResult<T>> {
  return new Promise((resolve) => {
    const errors: Array<{ row: number; field: string; error: string }> = [];
    const validData: T[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: (results, parser) => {
        const rowIndex = results.meta.cursor || 0;
        const validation = validator(results.data);

        if (validation.valid) {
          validData.push(results.data as T);
        } else {
          validation.errors.forEach((error) => {
            errors.push({
              row: rowIndex + 2, // +2 for 1-indexed + header row
              field: "unknown",
              error,
            });
          });
        }
      },
      complete: (results) => {
        resolve({
          data: validData,
          errors,
          meta: {
            fields: results.meta.fields || [],
            rowCount: results.data.length,
          },
        });
      },
    });
  });
}
```

### Import Validation Framework

```typescript
// lib/services/import-validators.ts

import { z } from "zod";

export const clientImportSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  vat_number: z.string().optional(),
  companies_house_number: z.string().length(8).optional(),
  client_type: z.enum(["individual", "company", "partnership", "trust"]),
  status: z.enum(["lead", "prospect", "active", "inactive"]).default("active"),
  // ... other fields
});

export function validateClientRow(row: any): { valid: boolean; errors: string[] } {
  const result = clientImportSchema.safeParse(row);

  if (result.success) {
    return { valid: true, errors: [] };
  } else {
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }
}
```

### Encryption Service

```typescript
// lib/services/encryption.ts

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

### Xero OAuth Service

```typescript
// lib/integrations/xero.ts

export class XeroService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.XERO_CLIENT_ID!;
    this.clientSecret = process.env.XERO_CLIENT_SECRET!;
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/xero/callback`;
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "accounting.transactions accounting.contacts offline_access",
    });

    return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    return response.json();
  }

  async testConnection(accessToken: string): Promise<boolean> {
    const response = await fetch("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  }
}
```

### CSV Import API Route Example

```typescript
// app/api/import/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { parseCSV } from "@/lib/services/csv-parser";
import { validateClientRow } from "@/lib/services/import-validators";
import { db } from "@/lib/db";
import { clients, importLogs } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  const authContext = await requireAuth();

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const dryRun = formData.get("dryRun") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Parse and validate CSV
  const result = await parseCSV(file, validateClientRow);

  if (dryRun) {
    // Return validation report without importing
    return NextResponse.json({
      validRows: result.data.length,
      invalidRows: result.errors.length,
      errors: result.errors,
      preview: result.data.slice(0, 5),
    });
  }

  // Import to database in transaction
  try {
    await db.transaction(async (tx) => {
      for (const clientData of result.data) {
        await tx.insert(clients).values({
          id: crypto.randomUUID(),
          tenantId: authContext.tenantId,
          ...clientData,
        });
      }
    });

    // Log successful import
    await db.insert(importLogs).values({
      id: crypto.randomUUID(),
      tenantId: authContext.tenantId,
      importType: "clients",
      fileName: file.name,
      rowsProcessed: result.data.length,
      rowsFailed: result.errors.length,
      errors: result.errors,
      importedBy: authContext.userId,
    });

    return NextResponse.json({
      success: true,
      imported: result.data.length,
      failed: result.errors.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
```

### Technical Notes

- **Papa Parse:** Use `papaparse` library for CSV parsing (handles edge cases)
- **Encryption:** Use AES-256-GCM for credential encryption with `crypto` module
- **Xero OAuth:** Register app at https://developer.xero.com to get client ID/secret
- **Transaction Safety:** Use database transactions for bulk inserts (rollback on error)
- **Progress Tracking:** Use Server-Sent Events (SSE) or WebSocket for real-time progress

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] integrationSettings table created with indexes
- [ ] importLogs table created with indexes
- [ ] Integration settings page created at `/client-hub/settings/integrations`
- [ ] Xero integration toggle with OAuth 2.0 flow functional
- [ ] Xero OAuth callback handling and token storage
- [ ] Integration status indicators (connected/disconnected, last sync)
- [ ] Test connection button functional
- [ ] Secure credential encryption with AES-256-GCM
- [ ] Placeholder integrations displayed (QuickBooks, Sage, Slack, Teams, Stripe)
- [ ] CSV import API routes created: /api/import/clients, /api/import/tasks, /api/import/services
- [ ] CSV parsing service implemented with Papa Parse
- [ ] Import validation framework with Zod schemas
- [ ] Dry run mode with validation report
- [ ] Error reporting with row numbers and field names
- [ ] Progress tracking during import
- [ ] Import templates generation endpoint
- [ ] Bulk database insertion with transaction rollback
- [ ] Import audit trail in importLogs table
- [ ] DataImportModal connected to API endpoints (not 404)
- [ ] Import history page created at `/client-hub/data/import-history`
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Unit tests written for CSV parser and validators
- [ ] Integration tests for import workflow (dry run → import)
- [ ] E2E tests for Xero OAuth flow and CSV import
- [ ] Seed data updated with sample import logs
- [ ] Code reviewed with focus on security (credential encryption, SQL injection prevention)
- [ ] Documentation updated: Xero OAuth setup guide, CSV import templates
- [ ] Performance benchmarks met (<30s for 100 rows)
- [ ] No regressions in existing functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- None (independent of other stories)

**Downstream:**
- Epic 5: Bulk Operations extends CSV import infrastructure for services/tasks

**External:**
- Xero developer account (create at https://developer.xero.com)
- Papa Parse library: `npm install papaparse @types/papaparse`
- Encryption key: Generate 32-byte key with `openssl rand -hex 32`

---

## Testing Strategy

### Unit Tests
- Test CSV parsing with various formats (quoted fields, different delimiters)
- Test import validation (email format, required fields, enum values)
- Test credential encryption/decryption
- Test multi-tenant isolation (imported data tagged with tenantId)

### Integration Tests
- Test Xero OAuth flow (mocked authorization)
- Test CSV import dry run mode
- Test CSV import with transaction rollback on error
- Test import audit log creation

### E2E Tests
- Test Xero integration: enable → authorize → token storage → test connection
- Test CSV import: upload file → preview → import → verify in database
- Test import history page displays logs

---

## Risks & Mitigation

**Risk:** CSV parsing edge cases cause import failures
**Mitigation:** Use battle-tested Papa Parse library; extensive testing with various CSV formats; handle quoted fields, BOM, different encodings
**Impact:** Medium - import failures require manual data cleanup

**Risk:** Xero OAuth flow complexity underestimated
**Mitigation:** Follow Xero developer documentation; test with sandbox environment; handle token refresh
**Impact:** Low - well-documented OAuth pattern

**Risk:** Credential encryption key compromise
**Mitigation:** Store encryption key in environment variable (not in code); rotate keys periodically; use strong AES-256-GCM encryption
**Impact:** High - credential leak if key compromised

**Risk:** Large CSV files cause timeout or memory issues
**Mitigation:** Stream CSV parsing with Papa Parse; process in chunks; implement queue for large imports
**Impact:** Medium - large imports may need optimization

---

## Notes

- **DataImportModal Already Exists:** UI component exists, just needs backend endpoints (currently returns 404)
- **Xero Priority:** Xero integration is Phase 1 priority (most requested by users)
- **Papa Parse:** Handles edge cases (quoted fields with commas, different delimiters, BOM)
- **Encryption Key:** Generate with `openssl rand -hex 32`, store in `.env.local` as `ENCRYPTION_KEY`
- **Import Foundation:** CSV import infrastructure is foundation for Epic 5 (service/task import extends same pattern)
- **Transaction Safety:** Database transactions ensure no partial data on import failure
- **Xero Developer:** Register app at https://developer.xero.com, use sandbox for testing
- **CSV Templates:** Downloadable templates with example rows and field descriptions help users prepare imports

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-2 - High-Impact Workflows
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR9 + FR10)
