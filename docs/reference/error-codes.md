# Error Codes Reference

**Last Updated**: 2025-10-10
**Version**: 1.0

This document provides a comprehensive reference of all error codes used in Practice Hub. Use these codes to identify, troubleshoot, and resolve issues.

---

## Table of Contents

1. [Error Code Format](#error-code-format)
2. [tRPC Error Codes](#trpc-error-codes)
3. [Authentication Errors (AUTH-xxx)](#authentication-errors-auth-xxx)
4. [Database Errors (DB-xxx)](#database-errors-db-xxx)
5. [Validation Errors (VAL-xxx)](#validation-errors-val-xxx)
6. [KYC/AML Errors (KYC-xxx)](#kycaml-errors-kyc-xxx)
7. [Proposal Errors (PROP-xxx)](#proposal-errors-prop-xxx)
8. [Integration Errors (INT-xxx)](#integration-errors-int-xxx)
9. [Business Logic Errors (BIZ-xxx)](#business-logic-errors-biz-xxx)
10. [System Errors (SYS-xxx)](#system-errors-sys-xxx)

---

## Error Code Format

### Structure

```
[CATEGORY]-[NUMBER]: [Description]
```

**Example**: `AUTH-001: Invalid credentials`

### Categories

| Prefix | Category | Description |
|--------|----------|-------------|
| `AUTH` | Authentication | Sign-in, sign-up, session errors |
| `DB` | Database | Database connection, query errors |
| `VAL` | Validation | Input validation errors |
| `KYC` | KYC/AML | Identity verification, AML screening |
| `PROP` | Proposals | Proposal creation, pricing errors |
| `INT` | Integration | Third-party API errors |
| `BIZ` | Business Logic | Domain-specific business rule violations |
| `SYS` | System | Infrastructure, configuration errors |

### HTTP Status Code Mapping

| HTTP Status | tRPC Code | Usage |
|-------------|-----------|-------|
| 400 | `BAD_REQUEST` | Invalid input, validation errors |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Authenticated but no permission |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Resource already exists, state conflict |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## tRPC Error Codes

### Standard tRPC Codes

tRPC uses these standard codes:

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "BAD_REQUEST",  // or UNAUTHORIZED, FORBIDDEN, etc.
  message: "User-friendly error message",
  cause: originalError,  // Original error for debugging
});
```

**Available codes**:
- `BAD_REQUEST` - Invalid input (400)
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - No permission (403)
- `NOT_FOUND` - Resource not found (404)
- `TIMEOUT` - Request timeout (408)
- `CONFLICT` - Resource conflict (409)
- `PRECONDITION_FAILED` - Precondition not met (412)
- `PAYLOAD_TOO_LARGE` - Request too large (413)
- `METHOD_NOT_SUPPORTED` - HTTP method not allowed (405)
- `TOO_MANY_REQUESTS` - Rate limited (429)
- `CLIENT_CLOSED_REQUEST` - Client closed connection (499)
- `INTERNAL_SERVER_ERROR` - Server error (500)

### Usage Example

```typescript
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/app/server/trpc";

export const clientsRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await db.select().from(clients)
        .where(eq(clients.id, input.id))
        .limit(1);

      if (!client[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Client with ID ${input.id} not found`,
        });
      }

      return client[0];
    }),
});
```

---

## Authentication Errors (AUTH-xxx)

### AUTH-001: Invalid Credentials

**Description**: Email or password incorrect

**HTTP Status**: 401 (UNAUTHORIZED)

**Cause**: User entered wrong email or password

**Solution**:
- Check email is correct
- Check password is correct
- Use "Forgot Password" if needed

**Code**:
```typescript
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Invalid email or password",
});
```

---

### AUTH-002: Account Not Found

**Description**: No account exists with this email

**HTTP Status**: 404 (NOT_FOUND)

**Cause**: User trying to sign in with email that doesn't exist

**Solution**:
- Check email spelling
- Sign up if new user

**Code**:
```typescript
throw new TRPCError({
  code: "NOT_FOUND",
  message: "No account found with this email",
});
```

---

### AUTH-003: Session Expired

**Description**: User session has expired

**HTTP Status**: 401 (UNAUTHORIZED)

**Cause**: Session TTL exceeded (7 days default)

**Solution**:
- Sign in again
- Enable "Remember Me" for longer sessions

**Code**:
```typescript
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Your session has expired. Please sign in again.",
});
```

---

### AUTH-004: Invalid Token

**Description**: Password reset or verification token invalid

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Token expired (1 hour) or already used

**Solution**:
- Request new password reset link
- Request new verification email

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid or expired token. Please request a new one.",
});
```

---

### AUTH-005: Account Locked

**Description**: Account locked due to too many failed sign-in attempts

**HTTP Status**: 403 (FORBIDDEN)

**Cause**: Security measure after 5 failed attempts

**Solution**:
- Wait 15 minutes for automatic unlock
- Contact admin to unlock manually

**Code**:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Account locked due to multiple failed sign-in attempts. Try again in 15 minutes.",
});
```

---

### AUTH-006: Email Already Exists

**Description**: Account with this email already exists

**HTTP Status**: 409 (CONFLICT)

**Cause**: User trying to sign up with existing email

**Solution**:
- Sign in instead of signing up
- Use "Forgot Password" if password unknown

**Code**:
```typescript
throw new TRPCError({
  code: "CONFLICT",
  message: "An account with this email already exists",
});
```

---

### AUTH-007: Insufficient Permissions

**Description**: User lacks required role for this action

**HTTP Status**: 403 (FORBIDDEN)

**Cause**: Non-admin user trying to access admin-only feature

**Solution**:
- Contact admin to request permission
- Sign in with correct account

**Code**:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "You do not have permission to perform this action",
});
```

---

## Database Errors (DB-xxx)

### DB-001: Connection Failed

**Description**: Cannot connect to database

**HTTP Status**: 500 (INTERNAL_SERVER_ERROR)

**Cause**: Database server down or unreachable

**Solution**:
- Check database is running: `docker ps`
- Check DATABASE_URL is correct
- Restart database: `docker compose restart db`

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Database connection failed. Please try again later.",
  cause: error,
});
```

---

### DB-002: Query Timeout

**Description**: Database query took too long

**HTTP Status**: 408 (TIMEOUT)

**Cause**: Query too complex or database overloaded

**Solution**:
- Add indexes to frequently queried columns
- Optimize query (use joins instead of multiple queries)
- Reduce data returned (pagination)

**Code**:
```typescript
throw new TRPCError({
  code: "TIMEOUT",
  message: "Request timed out. Please try again.",
});
```

---

### DB-003: Foreign Key Violation

**Description**: Referenced record doesn't exist

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Trying to create record with non-existent foreign key

**Solution**:
- Ensure referenced record exists first
- Check IDs are correct

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid reference: The specified entity does not exist",
});
```

---

### DB-004: Unique Constraint Violation

**Description**: Duplicate value for unique field

**HTTP Status**: 409 (CONFLICT)

**Cause**: Trying to insert duplicate unique value (e.g., email)

**Solution**:
- Use different value
- Update existing record instead

**Code**:
```typescript
throw new TRPCError({
  code: "CONFLICT",
  message: "A record with this value already exists",
});
```

---

### DB-005: Record Not Found

**Description**: No record found with given ID

**HTTP Status**: 404 (NOT_FOUND)

**Cause**: Record deleted or ID incorrect

**Solution**:
- Check ID is correct
- Verify record exists

**Code**:
```typescript
throw new TRPCError({
  code: "NOT_FOUND",
  message: `Record not found with ID: ${id}`,
});
```

---

## Validation Errors (VAL-xxx)

### VAL-001: Invalid Email Format

**Description**: Email format is invalid

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Email missing @ or domain

**Solution**:
- Check email format (must be `user@domain.com`)

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid email format",
});
```

---

### VAL-002: Password Too Short

**Description**: Password doesn't meet minimum length

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Password < 8 characters

**Solution**:
- Use password with at least 8 characters

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Password must be at least 8 characters long",
});
```

---

### VAL-003: Required Field Missing

**Description**: Required field not provided

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Form submitted without required field

**Solution**:
- Fill in all required fields (marked with *)

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: `Required field missing: ${fieldName}`,
});
```

---

### VAL-004: Invalid Date Format

**Description**: Date format is invalid

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Date not in ISO 8601 format

**Solution**:
- Use format: `YYYY-MM-DD` (e.g., 2025-10-10)

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid date format. Use YYYY-MM-DD.",
});
```

---

### VAL-005: Invalid UUID

**Description**: ID is not a valid UUID

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: ID doesn't match UUID format

**Solution**:
- Verify ID is correct UUID format

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid ID format",
});
```

---

### VAL-006: Value Out of Range

**Description**: Numeric value outside allowed range

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Number too large or too small

**Solution**:
- Enter value within allowed range

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: `Value must be between ${min} and ${max}`,
});
```

---

## KYC/AML Errors (KYC-xxx)

### KYC-001: Verification Pending

**Description**: Identity verification not yet completed

**HTTP Status**: 403 (FORBIDDEN)

**Cause**: Client hasn't completed KYC onboarding

**Solution**:
- Complete identity verification
- Submit required documents

**Code**:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Identity verification required. Please complete onboarding.",
});
```

---

### KYC-002: Verification Failed

**Description**: Identity verification failed

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Document rejected, poor photo quality, or data mismatch

**Solution**:
- Retake photos with better lighting
- Ensure document is valid and not expired
- Contact support if issue persists

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Identity verification failed. Please retry with clear photos.",
});
```

---

### KYC-003: Document Expired

**Description**: ID document has expired

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Document expiration date has passed

**Solution**:
- Submit current, valid ID document

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "ID document has expired. Please submit a valid document.",
});
```

---

### KYC-004: AML Match Found

**Description**: Client matched on AML screening

**HTTP Status**: 403 (FORBIDDEN)

**Cause**: Client appears on PEP, sanctions, or watchlist

**Solution**:
- Manual admin review required
- Provide additional documentation if requested

**Code**:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "AML screening requires manual review. You will be notified of the outcome.",
});
```

---

### KYC-005: Re-verification Required

**Description**: Client must complete verification again

**HTTP Status**: 403 (FORBIDDEN)

**Cause**: Previous verification rejected or expired

**Solution**:
- Click re-verification link in email
- Complete verification process again

**Code**:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Re-verification required. Check your email for instructions.",
});
```

---

### KYC-006: Webhook Signature Invalid

**Description**: LEM Verify webhook signature verification failed

**HTTP Status**: 401 (UNAUTHORIZED)

**Cause**: Webhook not from LEM Verify or signature mismatch

**Solution**:
- Check LEMVERIFY_WEBHOOK_SECRET is correct
- Verify webhook origin

**Code**:
```typescript
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Invalid webhook signature",
});
```

---

## Proposal Errors (PROP-xxx)

### PROP-001: Invalid Service Selection

**Description**: No services selected for proposal

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: User didn't select any services

**Solution**:
- Select at least one service

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Please select at least one service for the proposal",
});
```

---

### PROP-002: Pricing Rule Not Found

**Description**: No pricing rule matches input

**HTTP Status**: 404 (NOT_FOUND)

**Cause**: Turnover/transaction value outside configured bands

**Solution**:
- Contact admin to add pricing rule for this range

**Code**:
```typescript
throw new TRPCError({
  code: "NOT_FOUND",
  message: "No pricing rule found for the specified turnover/transactions",
});
```

---

### PROP-003: Invalid Complexity Level

**Description**: Complexity level not recognized

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Invalid complexity value

**Solution**:
- Use: clean, average, complex, or disaster

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid complexity level",
});
```

---

### PROP-004: PDF Generation Failed

**Description**: Proposal PDF could not be generated

**HTTP Status**: 500 (INTERNAL_SERVER_ERROR)

**Cause**: PDF library error or S3 upload failed

**Solution**:
- Retry PDF generation
- Contact support if issue persists

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Failed to generate PDF. Please try again.",
  cause: error,
});
```

---

## Integration Errors (INT-xxx)

### INT-001: LEM Verify API Error

**Description**: LEM Verify API request failed

**HTTP Status**: 502 (BAD_GATEWAY)

**Cause**: LEM Verify service unavailable or API error

**Solution**:
- Retry request
- Check LEM Verify status page

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Identity verification service temporarily unavailable. Please try again.",
  cause: error,
});
```

---

### INT-002: Gemini API Error

**Description**: Google Gemini API request failed

**HTTP Status**: 502 (BAD_GATEWAY)

**Cause**: Gemini service error or quota exceeded

**Solution**:
- Check GOOGLE_GEMINI_API_KEY
- Verify quota not exceeded

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "AI document extraction failed. Please try again.",
  cause: error,
});
```

---

### INT-003: Resend API Error

**Description**: Email sending failed

**HTTP Status**: 502 (BAD_GATEWAY)

**Cause**: Resend service error or invalid API key

**Solution**:
- Check RESEND_API_KEY
- Verify sender email is verified

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Failed to send email. Please contact support.",
  cause: error,
});
```

---

### INT-004: S3 Upload Failed

**Description**: File upload to S3 failed

**HTTP Status**: 500 (INTERNAL_SERVER_ERROR)

**Cause**: S3 connection error or invalid credentials

**Solution**:
- Check S3 credentials
- Verify bucket exists
- Check network connection

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "File upload failed. Please try again.",
  cause: error,
});
```

---

### INT-005: Companies House API Error

**Description**: Companies House API request failed

**HTTP Status**: 502 (BAD_GATEWAY)

**Cause**: Service unavailable or invalid company number

**Solution**:
- Verify company number is correct
- Check Companies House API status

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Company not found. Please check company number.",
});
```

---

### INT-006: Rate Limit Exceeded

**Description**: Too many requests to external API

**HTTP Status**: 429 (TOO_MANY_REQUESTS)

**Cause**: API rate limit exceeded

**Solution**:
- Wait before retrying
- Contact support to increase limit

**Code**:
```typescript
throw new TRPCError({
  code: "TOO_MANY_REQUESTS",
  message: "Rate limit exceeded. Please try again in a few minutes.",
});
```

---

## Business Logic Errors (BIZ-xxx)

### BIZ-001: Client Already Active

**Description**: Cannot convert lead - client already exists

**HTTP Status**: 409 (CONFLICT)

**Cause**: Lead being converted but client record already exists

**Solution**:
- Check if client already exists
- Update existing client instead

**Code**:
```typescript
throw new TRPCError({
  code: "CONFLICT",
  message: "Client already exists with this information",
});
```

---

### BIZ-002: Invoice Already Paid

**Description**: Cannot modify paid invoice

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Trying to edit/delete fully paid invoice

**Solution**:
- Cancel and create new invoice if changes needed

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Cannot modify paid invoices",
});
```

---

### BIZ-003: Task Already Completed

**Description**: Cannot modify completed task

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Trying to edit task marked as completed

**Solution**:
- Reopen task first, then edit

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Cannot modify completed tasks. Reopen task first.",
});
```

---

### BIZ-004: Insufficient Time Entries

**Description**: Not enough unbilled time for invoice

**HTTP Status**: 400 (BAD_REQUEST)

**Cause**: Trying to create invoice with no unbilled time entries

**Solution**:
- Add time entries first
- Mark existing time as billable

**Code**:
```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "No unbilled time entries available for this client",
});
```

---

## System Errors (SYS-xxx)

### SYS-001: Configuration Error

**Description**: System configuration invalid

**HTTP Status**: 500 (INTERNAL_SERVER_ERROR)

**Cause**: Missing or invalid environment variables

**Solution**:
- Check `.env.local` exists
- Verify all required variables set
- Restart dev server

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "System configuration error. Please contact support.",
});
```

---

### SYS-002: Service Unavailable

**Description**: System temporarily unavailable

**HTTP Status**: 503 (SERVICE_UNAVAILABLE)

**Cause**: Maintenance or system overload

**Solution**:
- Wait and retry
- Check status page

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Service temporarily unavailable. Please try again later.",
});
```

---

### SYS-003: Feature Not Implemented

**Description**: Feature not yet implemented

**HTTP Status**: 501 (NOT_IMPLEMENTED)

**Cause**: Trying to use feature still in development

**Solution**:
- Wait for feature release
- Use alternative method

**Code**:
```typescript
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "This feature is not yet available",
});
```

---

## Error Handling Best Practices

### User-Facing Messages

**Do**:
- ✅ Be specific: "Client with ID abc-123 not found"
- ✅ Provide solution: "Please sign in again"
- ✅ Be polite: "We couldn't process your request"

**Don't**:
- ❌ Expose stack traces to users
- ❌ Use technical jargon: "Constraint violation on FK"
- ❌ Be vague: "An error occurred"

### Logging Errors

**Always log errors** for debugging:

```typescript
try {
  // Operation
} catch (error) {
  // Log full error server-side
  console.error("Error creating client:", {
    error,
    userId: ctx.authContext.userId,
    tenantId: ctx.authContext.tenantId,
    input,
  });

  // Throw user-friendly error
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to create client. Please try again.",
    cause: error,
  });
}
```

### Error Recovery

**Implement retries** for transient errors:

```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## Questions?

If you encounter an error code not documented here:
1. Check application logs
2. Search this document
3. Ask in `#practice-hub-dev` Slack
4. Update this document with the new error code

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
