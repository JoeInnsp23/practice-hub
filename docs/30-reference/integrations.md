# Integrations Reference

**Last Updated**: 2025-10-21
**Version**: 1.1

This document provides a comprehensive reference for all third-party integrations used in Practice Hub. Each integration includes setup instructions, API documentation, and troubleshooting tips.

---

## Table of Contents

1. [Overview](#overview)
2. [LEM Verify (KYC/AML)](#lem-verify-kycaml)
3. [Google Gemini (AI)](#google-gemini-ai)
4. [Resend (Email)](#resend-email)
5. [Hetzner S3 / MinIO (Storage)](#hetzner-s3--minio-storage)
6. [Better Auth (Authentication)](#better-auth-authentication)
7. [Xero (Accounting)](#xero-accounting)
8. [Companies House (UK Company Data)](#companies-house-uk-company-data)
9. [Planned Integrations](#planned-integrations)
10. [Testing Integrations](#testing-integrations)
11. [Monitoring](#monitoring)

---

## Overview

### Integration Stack

| Service | Purpose | Cost | Documentation |
|---------|---------|------|---------------|
| **LEM Verify** | KYC/AML verification | £1/verification | https://lemverify.com/docs |
| **Google Gemini** | AI document extraction | $0.075/1K tokens | https://ai.google.dev/docs |
| **Resend** | Transactional email | $20/50K emails | https://resend.com/docs |
| **Hetzner S3** | Object storage (production) | €5/250GB | https://docs.hetzner.com/storage |
| **MinIO** | Object storage (development) | Free (self-hosted) | https://min.io/docs |
| **Better Auth** | Authentication | Free (open-source) | https://better-auth.com/docs |
| **Xero** | Accounting & bank feeds | Free API | https://developer.xero.com/documentation |
| **Companies House** | UK company data lookup | Free API | https://developer.company-information.service.gov.uk/ |

### Environment Variables Summary

```bash
# LEM Verify
LEMVERIFY_API_KEY="lv_live_xxxxxxxx"
LEMVERIFY_WEBHOOK_SECRET="whsec_xxxxxx"

# Google Gemini
GOOGLE_GEMINI_API_KEY="AIzaxxxxxx"

# Resend
RESEND_API_KEY="re_xxxxxxxx"
RESEND_FROM_EMAIL="noreply@practicehub.com"

# S3 (Hetzner or MinIO)
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="eu-central"

# Better Auth
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="https://practicehub.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://practicehub.com"

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MICROSOFT_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
MICROSOFT_TENANT_ID="common"

# Xero
XERO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
XERO_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
XERO_REDIRECT_URI="https://practicehub.com/api/xero/callback"

# Companies House
COMPANIES_HOUSE_API_KEY="your-api-key-here"
NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"
```

---

## LEM Verify (KYC/AML)

### Overview

LEM Verify provides UK MLR 2017 compliant identity verification with:
- Document verification (passport, driving licence)
- Facial recognition with liveness detection
- AML screening (PEP, sanctions, watchlists, adverse media)

**Pricing**: £1 per verification (vs £5 ComplyCube)

### Setup

**1. Create Account**:
- Sign up: https://lemverify.com/
- Get API key from dashboard

**2. Configure Environment**:
```bash
# .env.local
LEMVERIFY_API_KEY="lv_test_xxxxxxxx"  # Test mode
LEMVERIFY_WEBHOOK_SECRET="whsec_test_xxxxxx"

# Production
LEMVERIFY_API_KEY="lv_live_xxxxxxxx"
LEMVERIFY_WEBHOOK_SECRET="whsec_live_xxxxxx"
```

**3. Configure Webhook**:
- Dashboard → Settings → Webhooks
- URL: `https://yourdomain.com/api/webhooks/lemverify`
- Events: `verification.completed`, `verification.failed`
- Copy webhook secret

### API Documentation

**Create Verification Session**:
```typescript
import { LemVerify } from "@/lib/lemverify";

const lemverify = new LemVerify(process.env.LEMVERIFY_API_KEY!);

const session = await lemverify.createVerificationSession({
  clientReference: "client-abc-123",
  redirectUrl: "https://yourdomain.com/client-portal/onboarding/complete",
  requiredDocuments: ["passport", "driving_licence"],
  amlChecks: true,
});

// Returns:
{
  id: "vs_xxxxxxxx",
  url: "https://verify.lemverify.com/vs_xxxxxxxx",
  expiresAt: "2025-10-11T12:00:00Z"
}
```

**Get Verification Result**:
```typescript
const result = await lemverify.getVerification("vs_xxxxxxxx");

// Returns:
{
  id: "vs_xxxxxxxx",
  status: "completed",  // or "pending", "failed"
  outcome: "pass",  // or "fail", "refer"
  document: {
    type: "passport",
    verified: true,
    number: "123456789",
    expiryDate: "2030-01-01"
  },
  biometrics: {
    facematchScore: 98.5,  // 0-100
    livenessScore: 99.2
  },
  aml: {
    status: "clear",  // or "match", "pep"
    pepMatch: false,
    sanctionsMatch: false,
    watchlistMatch: false
  }
}
```

### Webhook Handling

**Webhook payload**:
```json
{
  "id": "evt_xxxxxxxx",
  "type": "verification.completed",
  "data": {
    "id": "vs_xxxxxxxx",
    "status": "completed",
    "outcome": "pass",
    // ... full verification result
  }
}
```

**Webhook handler**:
```typescript
// app/api/webhooks/lemverify/route.ts
import { verifyWebhookSignature } from "@/lib/lemverify";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("lemverify-signature");

  // Verify signature
  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.LEMVERIFY_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Process event
  if (event.type === "verification.completed") {
    await handleVerificationCompleted(event.data);
  }

  return new Response("OK", { status: 200 });
}
```

### Rate Limits

- **API requests**: 100 requests/minute
- **Webhook retries**: 3 attempts with exponential backoff

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `invalid_api_key` | API key invalid | Check LEMVERIFY_API_KEY |
| `verification_not_found` | Verification ID doesn't exist | Check ID is correct |
| `document_expired` | ID document expired | Request new document |
| `rate_limit_exceeded` | Too many requests | Wait and retry |

### Testing

**Test Mode**:
- Use `lv_test_` API key
- Test verification: Use sample documents from dashboard
- Webhook testing: Use ngrok for local webhook URL

**Sample test data**:
```typescript
// Always passes verification
const testPassport = {
  documentType: "passport",
  number: "TEST123456",
  firstName: "John",
  lastName: "Smith",
  dateOfBirth: "1990-01-01"
};

// Always fails verification
const testPassport = {
  documentType: "passport",
  number: "FAIL123456",
  // ...
};
```

---

## Google Gemini (AI)

### Overview

Google Gemini 2.0 Flash extracts structured data from ID documents (passports, driving licences) to pre-fill onboarding questionnaire.

**Pricing**: $0.075 per 1K tokens (≈$0.01 per document)

### Setup

**1. Get API Key**:
- Visit: https://aistudio.google.com/app/apikey
- Create new API key
- Copy key

**2. Configure Environment**:
```bash
# .env.local
GOOGLE_GEMINI_API_KEY="AIzaxxxxxx"
```

### API Documentation

**Extract Document Data**:
```typescript
import { extractDocumentData } from "@/lib/gemini";

const documentUrl = "https://s3.example.com/passport.jpg";

const extracted = await extractDocumentData(documentUrl);

// Returns:
{
  firstName: "John",
  lastName: "Smith",
  dateOfBirth: "1990-01-01",
  nationality: "British",
  documentNumber: "123456789",
  documentType: "passport",
  expiryDate: "2030-01-01",
  issueDate: "2020-01-01",
  placeOfBirth: "London, UK",
  address: {
    line1: "123 Main St",
    city: "London",
    postcode: "SW1A 1AA",
    country: "United Kingdom"
  }
}
```

**Implementation**:
```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function extractDocumentData(imageUrl: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Extract all information from this ID document and return as JSON.
    Include: firstName, lastName, dateOfBirth, nationality, documentNumber,
    documentType, expiryDate, issueDate, placeOfBirth, address.
  `;

  const image = await fetch(imageUrl).then(r => r.arrayBuffer());

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: Buffer.from(image).toString("base64"),
        mimeType: "image/jpeg"
      }
    }
  ]);

  return JSON.parse(result.response.text());
}
```

### Rate Limits

- **Requests per minute**: 60
- **Requests per day**: 1,500 (free tier)

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_API_KEY` | API key invalid | Check GOOGLE_GEMINI_API_KEY |
| `QUOTA_EXCEEDED` | Daily quota exceeded | Upgrade plan or wait until reset |
| `INVALID_IMAGE` | Image format not supported | Use JPG, PNG, or WebP |

### Testing

**Test with sample documents**:
- Use sample IDs from `tests/fixtures/documents/`
- Mock API in tests:

```typescript
import { vi } from "vitest";
import * as gemini from "@/lib/gemini";

vi.spyOn(gemini, "extractDocumentData").mockResolvedValue({
  firstName: "John",
  lastName: "Smith",
  // ... test data
});
```

---

## Resend (Email)

### Overview

Resend provides transactional email for:
- Onboarding invitations
- KYC approval/rejection notifications
- Password reset emails
- Portal access credentials

**Pricing**: $20/month for 50,000 emails

### Setup

**1. Create Account**:
- Sign up: https://resend.com/
- Verify domain (or use test domain)
- Get API key

**2. Configure Environment**:
```bash
# .env.local
RESEND_API_KEY="re_xxxxxxxx"
RESEND_FROM_EMAIL="noreply@practicehub.com"  # Must be verified
```

**3. Verify Domain**:
- Dashboard → Domains → Add Domain
- Add DNS records (SPF, DKIM)
- Verify domain

### API Documentation

**Send Email**:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Practice Hub <noreply@practicehub.com>",
  to: "client@example.com",
  subject: "Welcome to Practice Hub",
  html: "<h1>Welcome!</h1><p>Your account is ready.</p>",
});
```

**Email Templates**:
```typescript
// lib/email-templates.ts
export const approvalEmailTemplate = (clientName: string) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .button {
        background: #3b82f6;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Verification Approved!</h1>
      <p>Hi ${clientName},</p>
      <p>Your identity verification has been approved. You can now access the client portal.</p>
      <a href="https://practicehub.com/client-portal/sign-in" class="button">
        Sign In
      </a>
    </div>
  </body>
</html>
`;
```

### Rate Limits

- **Test mode**: 100 emails/day
- **Production**: 50,000 emails/month (can upgrade)

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `invalid_api_key` | API key invalid | Check RESEND_API_KEY |
| `unverified_domain` | Sender domain not verified | Verify domain in dashboard |
| `rate_limit_exceeded` | Too many emails | Upgrade plan |

### Testing

**Test Mode**:
```bash
# Use test API key
RESEND_API_KEY="re_test_xxxxxxxx"
```

**Verify emails sent**:
- Dashboard → Logs → View sent emails
- Check delivery status

---

## Hetzner S3 / MinIO (Storage)

### Overview

S3-compatible object storage for:
- Proposal PDFs
- Client documents
- KYC identity documents
- Invoice PDFs

**Development**: MinIO (local)
**Production**: Hetzner S3 (€5/250GB)

### Setup

#### MinIO (Development)

**1. Start MinIO**:
```bash
docker compose up -d minio
```

**2. Initialize Bucket**:
```bash
chmod +x scripts/setup-minio.sh
./scripts/setup-minio.sh
```

**3. Configure Environment**:
```bash
# .env.local
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="us-east-1"
```

**4. Access Console**:
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

#### Hetzner S3 (Production)

**1. Create Storage Box**:
- Hetzner Cloud Console → Storage → Create Storage Box
- Choose region: eu-central (Frankfurt)
- Size: 250GB

**2. Get Credentials**:
- Copy access key and secret key
- Copy endpoint URL

**3. Configure Environment**:
```bash
# .env.production
S3_ENDPOINT="https://fsn1.your-objectstorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="practice-hub-proposals"
S3_REGION="eu-central"
```

### API Documentation

**Upload File**:
```typescript
import { uploadToS3 } from "@/lib/s3";

const file = await fetch(url).then(r => r.arrayBuffer());

const s3Url = await uploadToS3({
  key: "proposals/abc-123.pdf",
  body: Buffer.from(file),
  contentType: "application/pdf",
});

// Returns: https://fsn1.your-objectstorage.com/practice-hub-proposals/proposals/abc-123.pdf
```

**Generate Pre-signed URL** (temporary access):
```typescript
import { getSignedUrl } from "@/lib/s3";

const signedUrl = await getSignedUrl("proposals/abc-123.pdf", 3600);
// URL expires in 1 hour

// Client can download without authentication
// https://...?X-Amz-Signature=...&X-Amz-Expires=3600
```

**Delete File**:
```typescript
import { deleteFromS3 } from "@/lib/s3";

await deleteFromS3("proposals/abc-123.pdf");
```

**Implementation**:
```typescript
// lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlAWS } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,  // Required for MinIO
});

export async function uploadToS3(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  }));

  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${params.key}`;
}

export async function getSignedUrl(key: string, expiresIn: number): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrlAWS(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  }));
}
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `NoSuchBucket` | Bucket doesn't exist | Create bucket or check name |
| `AccessDenied` | Invalid credentials | Check access key and secret |
| `NoSuchKey` | File doesn't exist | Check key is correct |

### Testing

**Test with MinIO**:
```bash
# Upload test file
curl -X PUT \
  -H "Content-Type: application/pdf" \
  --data-binary @test.pdf \
  "http://minioadmin:minioadmin@localhost:9000/practice-hub-proposals/test.pdf"

# Verify in console: http://localhost:9001
```

---

## Better Auth (Authentication)

### Overview

Better Auth provides:
- Email/password authentication with bcrypt
- Microsoft OAuth (personal and work accounts)
- Session management (7-day expiration)
- CSRF protection

**Pricing**: Free (open-source)

### Setup

See [docs/MICROSOFT_OAUTH_SETUP.md](docs/MICROSOFT_OAUTH_SETUP.md) for complete setup.

**Quick setup**:
```bash
# .env.local
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Optional: Microsoft OAuth
MICROSOFT_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MICROSOFT_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
MICROSOFT_TENANT_ID="common"
```

### Documentation

See Better Auth official docs: https://better-auth.com/docs

---

## Xero (Accounting)

### Overview

✅ **COMPLETE** - Xero integration provides complete two-way sync:
- **Practice Hub → Xero**: Push clients, invoices, and payments to Xero
- **Xero → Practice Hub**: Receive webhook events for data changes
- OAuth 2.0 authentication with PKCE
- Automatic token refresh (API middleware + background worker)
- Webhook infrastructure (event receiving and processing)
- AES-256-GCM encrypted credential storage
- Tenant-level integration (one connection per accountancy firm)
- Sync status tracking and error handling

**Pricing**: Free API (requires Xero account)

**Architecture**: Complete two-way sync with automatic token management and conflict resolution.

### Implementation

**Status**: ✅ Complete two-way sync infrastructure
- **Integration Settings**: Tenant-level configuration (`integrationSettings` table)
- **Credential Storage**: AES-256-GCM encrypted (`lib/services/encryption.ts`)
- **Webhook Events**: Incoming events storage (`xeroWebhookEvents` table)
- **Token Refresh**: Dual-layer refresh (API client + background worker)
- **Sync Service**: Orchestrates two-way sync between Practice Hub and Xero
- **Sync Tracking**: Database fields track sync status for invoices and clients

**Features**:
- ✅ OAuth 2.0 flow with PKCE for secure authentication
- ✅ Tenant-level integration settings (`integrationSettings` table)
- ✅ AES-256-GCM encrypted credential storage
- ✅ Webhook receiver with HMAC-SHA256 signature validation
- ✅ Webhook event processor (INVOICE, CONTACT, PAYMENT, BANKTRANSACTION)
- ✅ Token refresh worker (background job, runs every 10 days)
- ✅ Token refresh middleware (auto-refresh with 5-min buffer)
- ✅ Xero API client (push contacts, invoices, payments to Xero)
- ✅ Sync orchestration service (two-way sync coordination)
- ✅ Sync status tracking (pending, synced, error states)
- ✅ Automatic retry for failed syncs

### Setup

**1. Create Xero App**:
- Register: https://developer.xero.com/app/manage
- Create OAuth 2.0 app
- Set redirect URI: `https://practicehub.com/api/xero/callback`
- Copy Client ID and Client Secret

**2. Configure Environment**:
```bash
# .env.local
XERO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
XERO_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
XERO_REDIRECT_URI="http://localhost:3000/api/xero/callback"

# Production
XERO_REDIRECT_URI="https://practicehub.com/api/xero/callback"
```

**3. Database Schema**:
```typescript
// lib/db/schema.ts

// Integration Settings - Tenant-level Xero configuration
export const integrationSettings = pgTable("integration_settings", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  integrationType: text("integration_type").notNull(),  // "xero" | "quickbooks" | "slack"
  enabled: boolean("enabled").default(false).notNull(),
  credentials: text("credentials"),  // AES-256-GCM encrypted JSON
  config: jsonb("config"),  // Integration-specific config
  metadata: jsonb("metadata"),  // Integration metadata (org name, etc.)
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status"),  // "connected" | "error" | null
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Xero Webhook Events - Store incoming webhooks from Xero
export const xeroWebhookEvents = pgTable("xero_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  eventId: text("event_id").notNull().unique(),  // Xero's event ID (idempotency)
  eventType: text("event_type").notNull(),  // "CREATE" | "UPDATE" | "DELETE"
  eventCategory: text("event_category").notNull(),  // "INVOICE" | "CONTACT" | "PAYMENT"
  eventDateUtc: timestamp("event_date_utc").notNull(),
  resourceId: text("resource_id").notNull(),  // Resource UUID
  resourceUrl: text("resource_url"),  // Xero API resource URL
  xeroTenantId: text("xero_tenant_id").notNull(),  // Xero org ID
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processed_at"),
  processingError: text("processing_error"),
  rawPayload: jsonb("raw_payload").notNull(),  // Full webhook payload
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices - Add Xero sync tracking fields
export const invoices = pgTable("invoices", {
  // ... existing fields ...

  // Xero Integration (Two-way sync)
  xeroInvoiceId: text("xero_invoice_id"),  // Xero's invoice UUID
  xeroSyncStatus: text("xero_sync_status"),  // "synced" | "pending" | "error" | null
  xeroLastSyncedAt: timestamp("xero_last_synced_at"),
  xeroSyncError: text("xero_sync_error"),  // Error message if sync failed
});

// Clients - Add Xero sync tracking fields
export const clients = pgTable("clients", {
  // ... existing fields ...

  // Xero Integration (Two-way sync)
  xeroContactId: text("xero_contact_id"),  // Xero's contact UUID
  xeroSyncStatus: text("xero_sync_status"),  // "synced" | "pending" | "error" | null
  xeroLastSyncedAt: timestamp("xero_last_synced_at"),
  xeroSyncError: text("xero_sync_error"),  // Error message if sync failed
});

```

**4. Credential Encryption**:
```bash
# Generate encryption key (required for credential storage)
openssl rand -hex 32

# Add to .env.local
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

**Credentials Format** (encrypted JSON):
```typescript
{
  accessToken: "xxx",
  refreshToken: "xxx",
  expiresAt: "2025-10-22T12:00:00Z",
  selectedTenantId: "xxx",  // Xero organisation ID
  tokenType: "Bearer",
  scope: "accounting.transactions offline_access"
}
```

**5. Webhook Configuration**:
```bash
# Xero Developer Portal → Webhooks
# URL: https://practicehub.com/api/webhooks/xero
# Signing Key: Copy from Xero dashboard

# Add to .env.local
XERO_WEBHOOK_KEY="your-webhook-signing-key"
```

### API Documentation

**Initiate OAuth Flow**:
```typescript
import { XeroClient } from "@/lib/xero/client";

const xeroClient = new XeroClient();

// Generate authorization URL with PKCE
const { authUrl, codeVerifier } = await xeroClient.getAuthorizationUrl();

// Store codeVerifier in session for callback
// Redirect user to authUrl
```

**Handle OAuth Callback**:
```typescript
// app/api/xero/callback/route.ts
import { XeroClient } from "@/lib/xero/client";
import { encryptObject } from "@/lib/services/encryption";
import { db } from "@/lib/db";
import { integrationSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const codeVerifier = session.get("xero_code_verifier");

  const xeroClient = new XeroClient();

  // Exchange code for tokens
  const tokens = await xeroClient.exchangeCodeForToken(code, codeVerifier);

  // Prepare credentials object
  const credentials = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    selectedTenantId: tokens.tenantId,  // Xero organisation ID
    tokenType: "Bearer",
    scope: tokens.scope,
  };

  // Encrypt credentials
  const encryptedCredentials = encryptObject(credentials);

  // Upsert integration settings (tenant-level)
  await db
    .insert(integrationSettings)
    .values({
      tenantId: authContext.tenantId,
      integrationType: "xero",
      enabled: true,
      credentials: encryptedCredentials,
      config: {
        syncFrequency: "daily",
        autoSync: false,
      },
    })
    .onConflictDoUpdate({
      target: [integrationSettings.tenantId, integrationSettings.integrationType],
      set: {
        credentials: encryptedCredentials,
        enabled: true,
        updatedAt: new Date(),
      },
    });

  return redirect("/client-hub/settings/integrations?success=xero");
}
```

**Fetch Bank Transactions**:
```typescript
import { XeroClient } from "@/lib/xero/client";

const xeroClient = new XeroClient();

// Automatically handles token refresh if expired
const transactions = await xeroClient.getBankTransactions(tenantId, {
  fromDate: "2025-01-01",
  toDate: "2025-01-31",
});

// Returns:
[
  {
    bankTransactionID: "xxx",
    type: "RECEIVE",
    contact: { name: "Customer Ltd" },
    lineItems: [
      {
        description: "Invoice payment",
        quantity: 1,
        unitAmount: 1000.00,
        accountCode: "200",
      }
    ],
    date: "2025-01-15",
    status: "AUTHORISED",
  }
]
```

**Refresh Token**:
```typescript
// Automatically handled by XeroClient
// Tokens are refreshed when within 5 minutes of expiry

const xeroClient = new XeroClient();
await xeroClient.refreshAccessToken(tenantId);
```

### Token Management

**Dual-Layer Token Refresh Architecture**:

1. **API Middleware** (auto-refresh with 5-min buffer):
```typescript
// lib/xero/middleware.ts
export async function withXeroTokenRefresh(tenantId: string) {
  const settings = await getIntegrationSettings(tenantId, "xero");
  const credentials = decryptObject(settings.credentials);

  // Check if token expires within 5 minutes
  const expiresAt = new Date(credentials.expiresAt);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt < fiveMinutesFromNow) {
    // Refresh token
    const newTokens = await xeroClient.refreshAccessToken(credentials.refreshToken);

    // Update credentials
    const updatedCredentials = {
      ...credentials,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
    };

    // Encrypt and save
    await updateIntegrationCredentials(tenantId, "xero", updatedCredentials);
  }

  return credentials;
}
```

2. **Background Worker** (runs every 10 days):
```typescript
// scripts/token-refresh-worker.ts
import { CronJob } from "cron";

// Run every 10 days
const job = new CronJob("0 0 */10 * *", async () => {
  console.log("🔄 Running token refresh worker...");

  const activeIntegrations = await db
    .select()
    .from(integrationSettings)
    .where(
      and(
        eq(integrationSettings.integrationType, "xero"),
        eq(integrationSettings.enabled, true)
      )
    );

  for (const integration of activeIntegrations) {
    try {
      const credentials = decryptObject(integration.credentials);

      // Refresh token (Xero refresh tokens expire after 60 days)
      const newTokens = await xeroClient.refreshAccessToken(credentials.refreshToken);

      // Update credentials
      await updateIntegrationCredentials(
        integration.tenantId,
        "xero",
        {
          ...credentials,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        }
      );

      console.log(`✓ Refreshed token for tenant ${integration.tenantId}`);
    } catch (error) {
      console.error(`✗ Failed to refresh token for tenant ${integration.tenantId}:`, error);
    }
  }
});

job.start();
```

**Circuit Breaker Pattern**:
- Automatic retry with exponential backoff
- Circuit opens after 5 consecutive failures
- Half-open state after 5 minutes
- Prevents cascading failures

### Webhook Infrastructure

**1. Webhook Receiver** (`/api/webhooks/xero`):
```typescript
// app/api/webhooks/xero/route.ts
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { xeroWebhookEvents } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-xero-signature");

  // Verify signature (HMAC-SHA256)
  const webhookKey = process.env.XERO_WEBHOOK_KEY!;
  const expectedSignature = crypto
    .createHmac("sha256", webhookKey)
    .update(body)
    .digest("base64");

  if (signature !== expectedSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  // Store events (idempotent)
  for (const event of payload.events) {
    await db.insert(xeroWebhookEvents).values({
      tenantId: getTenantIdFromXeroTenantId(event.tenantId),
      eventId: event.eventId,
      eventType: event.eventType,
      eventCategory: event.eventCategory,
      eventDateUtc: new Date(event.eventDateUtc),
      resourceId: event.resourceId,
      resourceUrl: event.resourceUrl,
      xeroTenantId: event.tenantId,
      processed: false,
      rawPayload: payload,
    }).onConflictDoNothing();
  }

  return new Response("OK", { status: 200 });
}
```

**2. Webhook Event Processor**:
```typescript
// lib/xero/webhook-processor.ts
export async function processWebhookEvents() {
  const unprocessedEvents = await db
    .select()
    .from(xeroWebhookEvents)
    .where(eq(xeroWebhookEvents.processed, false))
    .limit(100);

  for (const event of unprocessedEvents) {
    try {
      // Handle event based on category
      switch (event.eventCategory) {
        case "INVOICE":
          await handleInvoiceEvent(event);
          break;
        case "CONTACT":
          await handleContactEvent(event);
          break;
        case "PAYMENT":
          await handlePaymentEvent(event);
          break;
        case "BANKTRANSACTION":
          await handleBankTransactionEvent(event);
          break;
      }

      // Mark as processed
      await db
        .update(xeroWebhookEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(xeroWebhookEvents.id, event.id));
    } catch (error) {
      // Log error but don't fail the batch
      await db
        .update(xeroWebhookEvents)
        .set({ processingError: error.message })
        .where(eq(xeroWebhookEvents.id, event.id));
    }
  }
}
```

### Two-Way Sync Service

**1. Push Client to Xero** (Practice Hub → Xero):
```typescript
// lib/xero/sync-service.ts
import { syncClientToXero } from "@/lib/xero/sync-service";

// Sync a client to Xero (creates or updates contact)
const result = await syncClientToXero(clientId, tenantId);

if (result.success) {
  console.log("Client synced to Xero successfully");
} else {
  console.error("Sync failed:", result.error);
}
```

**2. Push Invoice to Xero** (Practice Hub → Xero):
```typescript
import { syncInvoiceToXero } from "@/lib/xero/sync-service";

// Sync an invoice to Xero (creates or updates invoice)
const result = await syncInvoiceToXero(invoiceId, tenantId);

if (result.success) {
  console.log("Invoice synced to Xero successfully");
}
```

**3. Push Payment to Xero** (Practice Hub → Xero):
```typescript
import { syncPaymentToXero } from "@/lib/xero/sync-service";

// Record a payment in Xero
const result = await syncPaymentToXero(
  invoiceId,
  tenantId,
  paymentAmount,
  paymentDate,
  bankAccountCode,
  reference
);
```

**4. Mark Entities as Pending Sync**:
```typescript
import { markClientAsPendingSync, markInvoiceAsPendingSync } from "@/lib/xero/sync-service";

// Mark client for sync (will be picked up by background worker)
await markClientAsPendingSync(clientId);

// Mark invoice for sync
await markInvoiceAsPendingSync(invoiceId);
```

**5. Process Pending Syncs** (Background Worker):
```typescript
import { processPendingSyncs } from "@/lib/xero/sync-service";

// Process all pending syncs for a tenant
const result = await processPendingSyncs(tenantId);
console.log(`Synced ${result.clientsSynced} clients, ${result.invoicesSynced} invoices`);
```

**6. Retry Failed Syncs**:
```typescript
import { retryFailedSyncs } from "@/lib/xero/sync-service";

// Retry all failed syncs for a tenant
const result = await retryFailedSyncs(tenantId);
console.log(`Retried: ${result.clientsRetried} clients, ${result.invoicesRetried} invoices`);
```

**Sync Flow**:
```
┌─────────────────────┐
│  Practice Hub       │
│  Create/Update      │
│  Client/Invoice     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Mark as "pending"  │
│  xeroSyncStatus     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Sync Service       │
│  syncClientToXero() │
│  syncInvoiceToXero()│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Xero API Client    │
│  POST /Contacts     │
│  POST /Invoices     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Status      │
│  "synced" or "error"│
│  Store xeroId       │
└─────────────────────┘
```

### Rate Limits

- **API requests**: 60 requests/minute per organisation
- **Daily limit**: 5,000 requests/day per app
- **Concurrent requests**: 10 maximum

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `401` | Invalid or expired token | Refresh token or re-authenticate |
| `403` | Insufficient permissions | Check app scopes in Xero dashboard |
| `404` | Resource not found | Verify organisation ID and resource ID |
| `429` | Rate limit exceeded | Implement backoff and retry |
| `500` | Xero server error | Retry with exponential backoff |

### Scopes Required

Configure in Xero app dashboard:
- `accounting.transactions` - Read bank transactions
- `accounting.contacts` - Read contacts
- `offline_access` - Refresh token support

### Testing

**Development Mode**:
```bash
# Use Xero Demo Company
# https://developer.xero.com/documentation/getting-started-guide/

# Test OAuth flow locally
XERO_REDIRECT_URI="http://localhost:3000/api/xero/callback"
```

**Mock in Tests**:
```typescript
import { vi } from "vitest";
import * as xero from "@/lib/xero/client";

vi.spyOn(xero.XeroClient.prototype, "getBankTransactions").mockResolvedValue([
  {
    bankTransactionID: "test-123",
    type: "RECEIVE",
    contact: { name: "Test Customer" },
    date: "2025-01-15",
    lineItems: [
      {
        description: "Test transaction",
        unitAmount: 100.00,
      }
    ],
  }
]);
```

### Implementation Files

**Core Integration**:
- `lib/xero/client.ts` - OAuth 2.0 client (authorization, token exchange)
- `lib/xero/api-client.ts` - Xero API client (create/update contacts, invoices, payments)
- `lib/xero/sync-service.ts` - Two-way sync orchestration service
- `lib/xero/middleware.ts` - Token refresh middleware for API routes
- `lib/xero/token-refresh-worker.ts` - Background token refresh worker
- `lib/xero/webhook-processor.ts` - Webhook event processor (Xero → Practice Hub)

**API Routes**:
- `app/api/xero/authorize/route.ts` - OAuth authorization initiation (tenant-level)
- `app/api/xero/callback/route.ts` - OAuth callback handler (encrypted credential storage)
- `app/api/webhooks/xero/route.ts` - Webhook receiver (HMAC-SHA256 validation)
- `app/api/cron/xero-token-refresh/route.ts` - Token refresh cron endpoint

**Database**:
- `lib/db/schema.ts` - Integration settings, webhook events, sync tracking fields
- `lib/services/encryption.ts` - AES-256-GCM credential encryption service

**Total**: ~1,500 lines of code across 10 files

---

## Companies House (UK Company Data)

### Overview

✅ **COMPLETE & TESTED** - Companies House integration provides:
- Company lookup by registration number
- Automatic company details pre-filling
- Directors and PSCs (Persons with Significant Control) data fetch
- Company officer information
- Database-backed caching (24-hour TTL)
- Database-backed rate limiting (600 requests per 5 minutes)

**Pricing**: Free (requires API key)

**Testing**: Basic integration functional with caching and rate limiting. See [Companies House Integration Guide](../guides/integrations/companies-house.md) for detailed documentation.

### Implementation

**Status**: Fully implemented and tested in `app/server/routers/clients.ts`
- **Caching**: Database-backed with 24-hour TTL (`companiesHouseCache` table)
- **Rate Limiting**: Database-backed, 600 requests per 5-minute window (`companiesHouseRateLimits` table)
- **Activity Logging**: All lookups tracked in `companiesHouseActivityLog` table

**Features**:
- ✅ Company lookup by registration number
- ✅ Auto-populate company name, type, status, and registered address
- ✅ Directors data fetching and storage
- ✅ PSCs data fetching and storage
- ✅ Automatic retry on rate limit exceeded
- ✅ Database-backed caching to reduce API calls

### Setup

**1. Get API Key**:
- Register: https://developer.company-information.service.gov.uk/
- Create application
- Copy API key

**2. Configure Environment**:
```bash
# .env.local
COMPANIES_HOUSE_API_KEY="your-api-key-here"
NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"  # Feature flag

# Production
COMPANIES_HOUSE_API_KEY="your-production-api-key"
NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"
```

**3. Database Schema**:
```typescript
// lib/db/schema.ts
export const companiesHouseCache = pgTable("companies_house_cache", {
  id: text("id").primaryKey(),
  companyNumber: text("company_number").notNull().unique(),
  data: jsonb("data").notNull(),  // Full API response
  expiresAt: timestamp("expires_at").notNull(),  // 24-hour TTL
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companiesHouseRateLimits = pgTable("companies_house_rate_limits", {
  id: text("id").primaryKey(),
  windowStart: timestamp("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companiesHouseActivityLog = pgTable("companies_house_activity_log", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  companyNumber: text("company_number").notNull(),
  action: text("action").notNull(),  // "lookup", "cache_hit", "cache_miss"
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### API Documentation

**Lookup Company**:
```typescript
import { trpc } from "@/lib/trpc";

// In client wizard "Registration Details" step
const { data: companyData } = trpc.clients.lookupCompany.useQuery({
  companyNumber: "00000006",  // e.g., Tesco PLC
});

// Returns:
{
  companyName: "TESCO PLC",
  companyNumber: "00000006",
  companyType: "plc",
  companyStatus: "active",
  registeredOffice: {
    addressLine1: "Tesco House",
    addressLine2: "Shire Park",
    city: "Welwyn Garden City",
    county: "Hertfordshire",
    postcode: "AL7 1GA",
    country: "England"
  },
  directors: [
    {
      name: "John Smith",
      dateOfBirth: "1970-01",
      nationality: "British",
      occupation: "Director",
      appointedOn: "2020-01-15",
      resignedOn: null,
    }
  ],
  pscs: [
    {
      name: "Jane Doe",
      naturesOfControl: ["ownership-of-shares-75-to-100-percent"],
      notifiedOn: "2020-01-01",
    }
  ]
}
```

**Integration in Client Wizard**:
```typescript
// app/client-hub/clients/create/components/registration-details-step.tsx
const lookupMutation = trpc.clients.lookupCompany.useMutation({
  onSuccess: (data) => {
    // Auto-populate form fields
    form.setValue("companyName", data.companyName);
    form.setValue("registeredAddress", data.registeredOffice);
    // Directors and PSCs saved automatically by backend
    toast.success("Company details retrieved successfully");
  },
  onError: (error) => {
    if (error.message.includes("Rate limit exceeded")) {
      toast.error("Too many requests. Please try again in a few minutes.");
    } else {
      toast.error("Failed to lookup company");
    }
  },
});

// User enters company number
lookupMutation.mutate({ companyNumber: "00000006" });
```

### Caching Strategy

**Cache TTL**: 24 hours
- First lookup: API call → store in cache
- Subsequent lookups (within 24 hours): Serve from cache
- After 24 hours: New API call → update cache

**Cache Key**: Company registration number (normalized to uppercase)

**Cache Hit Tracking**:
- All cache hits/misses logged to `companiesHouseActivityLog`
- Helps monitor API usage and cache effectiveness

### Rate Limiting

**Limits**: 600 requests per 5 minutes (Companies House API limit)

**Implementation**:
- Database-backed rate limiter (not Redis)
- Tracks requests in 5-minute windows
- Returns `429 Too Many Requests` when limit exceeded
- Automatic retry after window reset

**Rate Limit Check**:
```typescript
// Automatic in tRPC procedure
const canMakeRequest = await checkRateLimit();
if (!canMakeRequest) {
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: "Rate limit exceeded. Please try again in a few minutes.",
  });
}
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `401` | Invalid API key | Check COMPANIES_HOUSE_API_KEY |
| `404` | Company not found | Verify company number is correct |
| `429` | Rate limit exceeded | Wait and retry after 5 minutes |
| `500` | Companies House API error | Retry with exponential backoff |

### Testing

**Test with known companies**:
- `00000006` - Tesco PLC (public company with directors)
- `OC123456` - Test limited liability partnership
- `SC123456` - Scottish company

**Mock in Tests**:
```typescript
import { vi } from "vitest";
import * as clientsRouter from "@/app/server/routers/clients";

vi.spyOn(clientsRouter, "lookupCompany").mockResolvedValue({
  companyName: "Test Company Ltd",
  companyNumber: "12345678",
  companyType: "ltd",
  companyStatus: "active",
  registeredOffice: {
    addressLine1: "123 Test St",
    city: "London",
    postcode: "SW1A 1AA",
  },
  directors: [],
  pscs: [],
});
```

### Implementation Files

- `app/server/routers/clients.ts` - Companies House lookup procedure
- `lib/db/schema.ts` - Cache, rate limit, and activity log tables
- `app/client-hub/clients/create/components/registration-details-step.tsx` - UI integration

---

## Planned Integrations

---

## Testing Integrations

### Test Mode vs Production

| Service | Test Mode | Production |
|---------|-----------|------------|
| LEM Verify | `lv_test_` key | `lv_live_` key |
| Resend | `re_test_` key | `re_` key |
| Gemini | Same key (quotas apply) | Same key |
| S3 | MinIO (localhost) | Hetzner S3 |

### Mock Services in Tests

```typescript
// tests/setup.ts
import { vi } from "vitest";

// Mock LEM Verify
vi.mock("@/lib/lemverify", () => ({
  LemVerify: vi.fn(() => ({
    createVerificationSession: vi.fn().mockResolvedValue({
      id: "vs_test_123",
      url: "https://test.lemverify.com/vs_test_123",
    }),
  })),
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email_test_123" }),
    },
  })),
}));
```

---

## Monitoring

### Health Checks

**Monitor integration status**:

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    lemverify: await checkLemVerify(),
    resend: await checkResend(),
    s3: await checkS3(),
    database: await checkDatabase(),
  };

  const allHealthy = Object.values(health).every(h => h.status === "ok");

  return Response.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

### Logging

**Log all integration calls**:

```typescript
// lib/logger.ts
export function logIntegration(service: string, action: string, data: any) {
  console.log({
    timestamp: new Date().toISOString(),
    service,
    action,
    data,
  });
}

// Usage:
logIntegration("lemverify", "create_session", { clientId });
logIntegration("resend", "send_email", { to, subject });
```

---

## Questions?

For integration support:
1. Check service status pages
2. Review error codes in this document
3. Check service documentation (links above)
4. Ask in `#practice-hub-dev` Slack

---

**Last Updated**: 2025-10-21
**Maintained By**: Development Team
**Next Review**: 2026-01-21
