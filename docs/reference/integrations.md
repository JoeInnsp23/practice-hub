# Integrations Reference

**Last Updated**: 2025-10-10
**Version**: 1.0

This document provides a comprehensive reference for all third-party integrations used in Practice Hub. Each integration includes setup instructions, API documentation, and troubleshooting tips.

---

## Table of Contents

1. [Overview](#overview)
2. [LEM Verify (KYC/AML)](#lem-verify-kycaml)
3. [Google Gemini (AI)](#google-gemini-ai)
4. [Resend (Email)](#resend-email)
5. [Hetzner S3 / MinIO (Storage)](#hetzner-s3--minio-storage)
6. [Better Auth (Authentication)](#better-auth-authentication)
7. [Companies House API](#companies-house-api)
8. [Testing Integrations](#testing-integrations)
9. [Monitoring](#monitoring)

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
| **Companies House** | UK company data | Free | https://developer.company-information.service.gov.uk |

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

# Companies House
COMPANIES_HOUSE_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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

## Companies House API

### Overview

UK Companies House API provides company information for pre-filling client data.

**Pricing**: Free (requires API key)

### Setup

**1. Get API Key**:
- Register: https://developer.company-information.service.gov.uk/
- Create application
- Copy API key

**2. Configure Environment**:
```bash
# .env.local
COMPANIES_HOUSE_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### API Documentation

**Get Company by Number**:
```typescript
import { getCompany } from "@/lib/companies-house";

const company = await getCompany("12345678");

// Returns:
{
  companyNumber: "12345678",
  companyName: "ABC LIMITED",
  status: "active",
  type: "ltd",
  registeredOffice: {
    addressLine1: "123 Main St",
    addressLine2: "",
    locality: "London",
    postalCode: "SW1A 1AA",
    country: "England"
  },
  dateOfCreation: "2010-01-15",
  sicCodes: ["62020"],  // IT consulting
  officers: [...],
  personsWithSignificantControl: [...]
}
```

### Rate Limits

- **Requests per 5 minutes**: 600

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `401` | Invalid API key | Check COMPANIES_HOUSE_API_KEY |
| `404` | Company not found | Check company number |
| `429` | Rate limit exceeded | Wait and retry |

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

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
