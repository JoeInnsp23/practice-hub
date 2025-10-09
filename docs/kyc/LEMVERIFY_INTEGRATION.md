# LEM Verify KYC/AML Integration

## Overview

Integration with LEM Verify for UK MLR 2017 compliant identity verification and AML screening.

**Cost:** £1 per verification (vs ComplyCube £4-6)
**Compliance:** UK HMT/OFSI sanctions, UN/EU sanctions, PEP screening via LexisNexis
**Features:** Document verification + Face matching + Liveness + AML screening

---

## Current Implementation (v1.0 - Production Ready)

### User Flow

1. **Document Upload** (`/client-portal/onboarding`)
   - Client uploads identity documents to our app
   - Documents stored in S3 (MinIO local / Hetzner production)
   - Gemini AI extracts data from documents
   - Questionnaire pre-filled with extracted data

2. **Questionnaire Completion**
   - Client reviews and verifies AI-extracted data
   - Completes remaining required fields
   - Categories: Personal, Company, Business, Ownership, Risk Assessment

3. **Questionnaire Submission** (`submitQuestionnaire` mutation)
   - Backend creates LEM Verify verification request
   - LEM Verify generates unique verification URL
   - URL stored in `kyc_verifications` table
   - Client shown link on review page

4. **Identity Verification** (LEM Verify hosted page)
   - ⚠️ **Client uploads documents again** on LEM Verify's secure platform
   - Client completes face matching (selfie)
   - Client completes liveness check (video)
   - LEM Verify processes verification

5. **Webhook Processing** (`/api/webhooks/lemverify`)
   - LEM Verify sends results via webhook
   - Auto-approve if: outcome=pass + AML=clear
   - Manual review if: alerts found or checks failed
   - Update `onboarding_sessions.status` to `approved` or `pending_approval`
   - Client granted portal access on approval

### Why Documents Are Uploaded Twice

**Current limitation:** LEM Verify's public API documentation doesn't provide complete details for direct document upload via API.

**Client Experience:**
- Upload documents to our app → AI extraction works perfectly ✅
- Upload same documents again to LEM Verify → Required for biometric + AML checks ⚠️

**User Communication:**
- Clear disclaimer on review page
- Explains why second upload is necessary
- Sets expectation for 2-5 minute verification process

### Files Implemented

**UI Components:**
- `/app/client-portal/onboarding/components/document-upload.tsx`
- `/app/client-portal/onboarding/components/individual-form.tsx`
- `/app/client-portal/onboarding/components/company-form.tsx`
- `/app/client-portal/onboarding/components/business-form.tsx`
- `/app/client-portal/onboarding/components/ownership-form.tsx`
- `/app/client-portal/onboarding/components/risk-form.tsx`
- `/app/client-portal/onboarding/components/review.tsx`

**Backend:**
- `/app/api/onboarding/upload-documents/route.ts` - Document upload + AI extraction
- `/app/server/routers/onboarding.ts` - Questionnaire management + KYC initiation
- `/app/api/webhooks/lemverify/route.ts` - Webhook handler
- `/lib/kyc/lemverify-client.ts` - LEM Verify API client
- `/lib/ai/extract-client-data.ts` - Gemini AI document extraction
- `/lib/ai/questionnaire-prefill.ts` - Questionnaire field definitions
- `/lib/ai/save-extracted-data.ts` - Save AI-extracted data to DB

**Database:**
- `kyc_verifications` table - Tracks verification status and results
- `onboarding_sessions` table - Manages onboarding workflow
- `onboarding_responses` table - Stores questionnaire answers

---

## Future Optimization (v2.0 - Pending API Confirmation)

### Goal: Unified Upload Experience

Upload once → AI extraction + LEM Verify verification

### Required Information from LEM Verify

Need complete API documentation for:
1. **Document Upload Endpoint**
   - Endpoint URL and method
   - Request format (multipart/form-data? base64?)
   - Signed URL generation process (mentioned in docs but not detailed)
   - Supported document types and size limits

2. **Biometric Endpoints**
   - Selfie upload for face matching
   - Liveness video upload
   - Request/response formats

3. **Verification Workflow**
   - How to link documents + selfie + liveness to single verification
   - Triggering AML check after uploads complete
   - Status polling vs webhook-only approach

### Proposed v2.0 Flow

```
1. Client uploads documents to our app
2. Backend stores in S3
3. Gemini AI extracts data
4. Client completes questionnaire
5. Client submits questionnaire
6. Backend retrieves documents from S3
7. Backend uploads same documents to LEM Verify API ← NEW
8. Backend uploads selfie (client takes via our UI) ← NEW
9. Backend uploads liveness video (client records via our UI) ← NEW
10. LEM Verify processes all checks
11. Webhook receives results
12. Auto-approval logic runs
```

**Benefits:**
- ✅ Client uploads documents only once
- ✅ Seamless experience within our app
- ✅ AI extraction happens first (faster pre-fill)
- ✅ Reduced friction in onboarding
- ✅ Professional branded experience

**Blockers:**
- ❌ LEM Verify API documentation incomplete
- ❌ Need confirmation on biometric upload methods
- ❌ Need to understand signed URL workflow

### Action Items for v2.0

1. **Contact LEM Verify Support**
   - Request complete "Upload a Document" API documentation
   - Request biometric upload API documentation
   - Ask for integration examples or SDK

2. **Update LEM Verify Client** (`/lib/kyc/lemverify-client.ts`)
   ```typescript
   // Add new methods:
   async uploadDocument(buffer: Buffer, documentType: string): Promise<string>
   async uploadSelfie(buffer: Buffer): Promise<string>
   async uploadLivenessVideo(buffer: Buffer): Promise<string>
   async triggerVerification(verificationId: string): Promise<void>
   ```

3. **Update Onboarding Router**
   - Remove `requestVerification` call
   - Add document retrieval from S3
   - Add document upload to LEM Verify
   - Add biometric collection UI prompts

4. **Add Biometric Collection UI**
   - Camera access for selfie capture
   - Video recording for liveness check
   - Inline in our onboarding flow

---

## Environment Variables

```bash
# LEM Verify Configuration
LEMVERIFY_API_KEY="your-api-key"
LEMVERIFY_ACCOUNT_ID="your-account-id"
LEMVERIFY_API_URL="https://api.lemverify.com/v1"
LEMVERIFY_WEBHOOK_SECRET="your-webhook-secret"
```

Get credentials from: https://lemverify.com/dashboard

---

## Webhook Configuration

**Production Webhook URL:**
```
https://app.innspiredaccountancy.com/api/webhooks/lemverify
```

**Register in LEM Verify Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL
3. Copy webhook secret to `LEMVERIFY_WEBHOOK_SECRET`
4. Enable signature verification in `/app/api/webhooks/lemverify/route.ts` (currently commented out)

---

## Testing

### Local Testing
1. Use ngrok to expose local webhook: `ngrok http 3000`
2. Register ngrok URL with LEM Verify
3. Test verification flow end-to-end

### Production Testing
1. Create test verification request
2. Complete verification on LEM Verify hosted page
3. Verify webhook received
4. Check auto-approval logic
5. Confirm client portal access granted

---

## Support

**LEM Verify Support:**
- Email: support@lemverify.com
- Docs: https://lemverify.com/docs.html

**Internal Questions:**
- Backend: `/app/server/routers/onboarding.ts`
- Webhook: `/app/api/webhooks/lemverify/route.ts`
- UI: `/app/client-portal/onboarding/`
