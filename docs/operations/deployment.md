# Production Deployment Checklist

This checklist ensures Microsoft OAuth and all authentication features work correctly in production.

## Pre-Deployment Checklist

### 1. Azure Configuration ✅
- [x] Application registered in Microsoft Entra ID
- [x] Client ID obtained: `f9e3ca9e-0f80-4ffc-a216-951146248899`
- [x] Client Secret created and saved securely
- [x] Development redirect URI added: `http://localhost:3000/api/auth/callback/microsoft`
- [x] Production redirect URI added: `https://app.innspiredaccountancy.com/api/auth/callback/microsoft`
- [x] Secret expiration calendar reminder set (24 months)

### 2. Environment Variables ✅
**Authentication:**
- [x] `MICROSOFT_CLIENT_ID` added to local `.env.local`
- [x] `MICROSOFT_CLIENT_SECRET` added to local `.env.local`
- [ ] `MICROSOFT_CLIENT_ID` added to production environment
- [ ] `MICROSOFT_CLIENT_SECRET` added to production environment
- [ ] `BETTER_AUTH_URL` set to production domain (e.g., `https://app.innspiredaccountancy.com`)
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` set to production domain
- [ ] `BETTER_AUTH_SECRET` different from development (use `openssl rand -base64 32`)
- [ ] `DATABASE_URL` points to production database

**KYC/AML (LEM Verify):**
- [ ] `LEMVERIFY_API_KEY` configured with production API key
- [ ] `LEMVERIFY_ACCOUNT_ID` configured with production account ID
- [ ] `LEMVERIFY_API_URL` set to `https://api.lemverify.com/v1`
- [ ] `LEMVERIFY_WEBHOOK_SECRET` generated and saved from LEM Verify dashboard

**AI Document Extraction (Google Gemini):**
- [ ] `GOOGLE_AI_API_KEY` configured with production API key (Gemini 2.0 Flash)

**Object Storage (Hetzner S3):**
- [ ] `S3_ENDPOINT` set to Hetzner endpoint (e.g., `https://fsn1.your-objectstorage.com`)
- [ ] `S3_ACCESS_KEY_ID` configured with Hetzner access key
- [ ] `S3_SECRET_ACCESS_KEY` configured with Hetzner secret key
- [ ] `S3_BUCKET_NAME` set (e.g., `practice-hub-onboarding`)
- [ ] `S3_REGION` set to `eu-central`

**Email Service (Resend):**
- [ ] `RESEND_API_KEY` configured with production API key
- [ ] `RESEND_FROM_EMAIL` set (e.g., `noreply@innspiredaccountancy.com`)
- [ ] `RESEND_TEAM_EMAIL` set (e.g., `team@innspiredaccountancy.com`)

**Application URLs:**
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain

### 3. Code Changes ✅
- [x] Microsoft OAuth provider configured in `lib/auth.ts`
- [x] Sign-in page updated with Microsoft button
- [x] Sign-up page updated with Microsoft button
- [x] OAuth setup page created
- [x] OAuth setup API endpoint created
- [x] Environment variables added to `.env.example`
- [x] Documentation created and updated
- [x] All changes committed to git

### 4. Local Testing ✅
- [x] Build succeeds: `pnpm build`
- [x] Microsoft OAuth button appears on sign-in page
- [x] Microsoft OAuth button appears on sign-up page
- [x] OAuth flow completes successfully
- [x] Organization setup form works
- [x] User redirected to dashboard after setup
- [x] User can sign out and sign back in

### 5. Database ✅
- [x] Schema includes Better Auth tables (users, sessions, accounts)
- [x] Tenants table exists
- [x] Foreign key relationships correct
- [x] KYC/AML tables created (`kyc_verifications`, `onboarding_sessions`, `onboarding_responses`)
- [ ] Production database migrated
- [ ] Production database seeded with initial data (if needed)

### 6. Third-Party Service Configuration
**LEM Verify (KYC/AML):**
- [ ] Production account created at https://lemverify.com
- [ ] Production API key generated
- [ ] Webhook URL registered: `https://app.innspiredaccountancy.com/api/webhooks/lemverify`
- [ ] Webhook secret saved to `LEMVERIFY_WEBHOOK_SECRET`
- [ ] Test verification completed in production environment

**Google AI (Gemini 2.0 Flash):**
- [ ] Google Cloud project created
- [ ] Gemini API enabled
- [ ] Production API key generated
- [ ] Rate limits reviewed (60 requests/minute default)

**Hetzner Object Storage:**
- [ ] S3-compatible bucket created
- [ ] Access key and secret key generated
- [ ] CORS configuration set (if needed for direct uploads)
- [ ] Bucket lifecycle policies configured (optional)

**Resend Email:**
- [ ] Domain verified in Resend dashboard
- [ ] SPF/DKIM/DMARC DNS records configured
- [ ] Production API key generated
- [ ] Test email sent and received

---

## Deployment Steps

### Step 1: Configure Production Environment

**Hosting Platform**: (Vercel / AWS / Other)

1. **Add Environment Variables**

   Navigate to your hosting platform's environment variables section and add:

   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # Better Auth (IMPORTANT: Use different secret than dev!)
   BETTER_AUTH_SECRET="<generate-new-secret>"
   BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
   NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"

   # Microsoft OAuth
   MICROSOFT_CLIENT_ID="your-microsoft-client-id-from-azure"
   MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret-from-azure"
   ```

   ⚠️ **Get credentials from Azure Portal** - never use example values.

   **Generate new BETTER_AUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

2. **Verify SSL/HTTPS**
   - [ ] Production domain has valid SSL certificate
   - [ ] HTTPS enforced for all routes
   - [ ] Secure cookie flags enabled

### Step 2: Deploy Application

1. **Push to Git Repository**
   ```bash
   git push origin main
   ```

2. **Trigger Deployment**
   - Automatic: Wait for CI/CD pipeline
   - Manual: Deploy via hosting platform dashboard

3. **Monitor Build Logs**
   - [ ] Build completes successfully
   - [ ] No TypeScript errors
   - [ ] No environment variable warnings
   - [ ] Assets optimized and generated

### Step 3: Verify Database

1. **Check Database Connection**
   ```bash
   # Run a simple query to verify connection
   SELECT COUNT(*) FROM users;
   ```

2. **Verify Tables Exist**
   ```bash
   # Check if all Better Auth tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('users', 'session', 'account', 'verification', 'tenants');
   ```

3. **Check Indexes**
   ```bash
   # Ensure indexes are created for performance
   SELECT indexname FROM pg_indexes WHERE tablename = 'users';
   ```

### Step 4: Test Production OAuth Flow

1. **Test Microsoft OAuth Sign-In**
   - [ ] Navigate to `https://app.innspiredaccountancy.com/sign-in`
   - [ ] Click "Continue with Microsoft"
   - [ ] Redirected to Microsoft login page
   - [ ] Sign in with Microsoft account
   - [ ] Redirected back to application
   - [ ] Organization setup form appears (for new users)
   - [ ] Complete organization setup
   - [ ] Redirected to Practice Hub dashboard

2. **Test Microsoft OAuth Sign-Up**
   - [ ] Navigate to `https://app.innspiredaccountancy.com/sign-up`
   - [ ] Click "Continue with Microsoft"
   - [ ] Follow same flow as sign-in
   - [ ] Verify new account created

3. **Test Email/Password Authentication**
   - [ ] Sign up with email/password
   - [ ] Sign in with email/password
   - [ ] Sign out
   - [ ] Sign back in

4. **Test Edge Cases**
   - [ ] User signs in with Microsoft, then tries to sign up with same email
   - [ ] User signs up with email, then tries to link Microsoft account (if implemented)
   - [ ] User completes OAuth but abandons organization setup
   - [ ] User navigates directly to `/oauth-setup` without OAuth

### Step 5: Verify Multi-Tenancy

1. **Create Multiple Organizations**
   - [ ] Create first organization (Org A)
   - [ ] Create second organization (Org B)

2. **Test Data Isolation**
   - [ ] Sign in as Org A user
   - [ ] Create client in Client Hub
   - [ ] Sign out
   - [ ] Sign in as Org B user
   - [ ] Verify Org A's client is NOT visible
   - [ ] Create client in Client Hub
   - [ ] Verify only Org B's client is visible

3. **Test Database Queries**
   ```sql
   -- Verify tenants are separate
   SELECT id, name FROM tenants;

   -- Verify users are assigned to correct tenants
   SELECT email, tenant_id FROM users;

   -- Verify clients are scoped to tenants
   SELECT name, tenant_id FROM clients;
   ```

### Step 6: Test KYC/AML Onboarding Flow

1. **Test Document Upload and AI Extraction**
   - [ ] Navigate to `/client-portal/onboarding`
   - [ ] Upload identity document (passport, driver's license, or ID card)
   - [ ] Verify document uploaded to S3 successfully
   - [ ] Verify Gemini AI extraction runs
   - [ ] Check questionnaire pre-filled with extracted data
   - [ ] Verify AI confidence scores displayed

2. **Test Questionnaire Completion**
   - [ ] Complete all required questionnaire fields
   - [ ] Test field validation (email, phone, date formats)
   - [ ] Verify data saves to `onboarding_responses` table
   - [ ] Test progress tracking across page refreshes

3. **Test LEM Verify Integration**
   - [ ] Submit completed questionnaire
   - [ ] Verify `kyc_verifications` record created
   - [ ] Verify LEM Verify API called successfully
   - [ ] Verify verification URL generated
   - [ ] Complete verification on LEM Verify hosted page
   - [ ] Upload documents, selfie, and complete liveness check

4. **Test Webhook Processing**
   - [ ] Verify webhook received at `/api/webhooks/lemverify`
   - [ ] Verify HMAC signature validated correctly
   - [ ] Check `kyc_verifications` table updated with results
   - [ ] Verify auto-approval logic (outcome=pass + AML=clear)
   - [ ] Check `onboarding_sessions.status` updated
   - [ ] Verify activity log entries created

5. **Test Manual Review (if applicable)**
   - [ ] Create verification with AML alert
   - [ ] Verify appears in admin review queue (`/admin/kyc-review`)
   - [ ] Test approve action
   - [ ] Test reject action with reason
   - [ ] Verify email notifications sent

6. **Test Lead-to-Client Conversion**
   - [ ] Complete KYC approval flow
   - [ ] Verify lead converted to client
   - [ ] Verify client portal access granted
   - [ ] Check client can access dashboard

### Step 7: Monitor and Verify

1. **Check Application Logs**
   - [ ] No authentication errors
   - [ ] No database connection errors
   - [ ] OAuth callbacks successful
   - [ ] Session creation successful
   - [ ] No webhook signature validation failures
   - [ ] No S3 upload errors
   - [ ] No Gemini AI extraction errors

2. **Check Better Auth Logs**
   - [ ] No warnings about missing credentials
   - [ ] No CSRF errors
   - [ ] OAuth state validation passing

3. **Check Third-Party Service Logs**
   - [ ] LEM Verify: Webhook delivery successful
   - [ ] Gemini AI: No rate limit errors
   - [ ] Resend: Email delivery successful
   - [ ] Hetzner S3: No access denied errors

4. **Monitor Performance**
   - [ ] Sign-in response time < 2s
   - [ ] OAuth callback response time < 3s
   - [ ] Dashboard load time < 2s
   - [ ] Document upload < 5s
   - [ ] AI extraction < 10s
   - [ ] Questionnaire submission < 3s

5. **Test from Different Locations**
   - [ ] Test from different IP addresses
   - [ ] Test from different browsers (Chrome, Firefox, Safari, Edge)
   - [ ] Test from mobile devices
   - [ ] Test from different geographic locations (if applicable)

---

## Post-Deployment Verification

### Security Checks

- [ ] **HTTPS Enforced**: All HTTP requests redirect to HTTPS
- [ ] **Cookies Secure**: Session cookies have `Secure` flag
- [ ] **CSRF Protection**: State parameter validated on OAuth callback
- [ ] **SQL Injection**: Database queries use parameterized statements
- [ ] **XSS Protection**: User input sanitized
- [ ] **Secrets Not Exposed**: No secrets in client-side code or logs
- [ ] **Rate Limiting**: Authentication endpoints rate-limited (if applicable)
- [ ] **Webhook Signature Validation**: HMAC signatures verified on all webhooks
- [ ] **File Upload Security**: File types and sizes validated
- [ ] **S3 Access Control**: Bucket permissions correctly configured
- [ ] **PII Protection**: Sensitive data encrypted at rest and in transit

### Functionality Checks

**Authentication:**
- [ ] **OAuth Flow**: Microsoft OAuth works end-to-end
- [ ] **Email/Password**: Traditional authentication works
- [ ] **Session Management**: Sessions persist correctly
- [ ] **Sign Out**: Users can sign out successfully
- [ ] **Redirect**: Users redirected to correct page after auth
- [ ] **Multi-Tenant**: Data isolation between organizations verified
- [ ] **Role-Based Access**: Admin features only accessible by admins

**KYC/AML Onboarding:**
- [ ] **Document Upload**: Files upload to S3 successfully
- [ ] **AI Extraction**: Gemini AI extracts data from documents
- [ ] **Questionnaire**: All form fields work and validate correctly
- [ ] **LEM Verify Integration**: Verification requests created successfully
- [ ] **Webhook Processing**: Webhooks received and processed correctly
- [ ] **Auto-Approval**: Clients auto-approved when outcome=pass + AML=clear
- [ ] **Manual Review**: Admin can review, approve, and reject verifications
- [ ] **Lead Conversion**: Leads convert to clients after approval
- [ ] **Portal Access**: Approved clients can access client portal
- [ ] **Email Notifications**: Emails sent for status changes

### Performance Checks

- [ ] **Page Load Times**: Under acceptable thresholds
- [ ] **Database Queries**: No N+1 queries
- [ ] **Asset Loading**: Assets cached correctly
- [ ] **API Response Times**: Under acceptable thresholds

### User Experience Checks

- [ ] **Error Messages**: Clear and helpful error messages
- [ ] **Loading States**: Loading indicators show during async operations
- [ ] **Form Validation**: Forms validate input correctly
- [ ] **Mobile Responsive**: UI works on mobile devices
- [ ] **Dark Mode**: Dark mode works if enabled

---

## Rollback Plan

If issues occur after deployment:

### Option 1: Quick Fix
1. Identify issue from logs
2. Apply fix
3. Commit and redeploy
4. Verify fix

### Option 2: Rollback to Previous Version
1. Revert git commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Redeploy previous version
3. Verify application works
4. Fix issues in development
5. Redeploy when ready

### Option 3: Disable Microsoft OAuth
1. Remove `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` from production environment
2. Redeploy
3. Email/password auth will still work
4. Fix Microsoft OAuth issues
5. Re-enable when ready

---

## Monitoring Setup

### Application Monitoring

Set up monitoring for:
- [ ] Authentication success/failure rates
- [ ] OAuth callback errors
- [ ] Session creation failures
- [ ] Database connection errors
- [ ] API response times
- [ ] Error rates by endpoint
- [ ] Webhook delivery success rates (LEM Verify, DocuSeal)
- [ ] S3 upload success/failure rates
- [ ] Gemini AI extraction success rates
- [ ] KYC verification completion rates
- [ ] Email delivery success rates
- [ ] Rate limit hits by endpoint

### Alerts

Configure alerts for:
- [ ] Authentication failure rate > 10%
- [ ] OAuth callback errors > 5%
- [ ] Database connection failures
- [ ] API response time > 5s
- [ ] Error rate > 1%
- [ ] Webhook signature validation failures > 3%
- [ ] S3 upload failures > 2%
- [ ] Gemini AI extraction failures > 5%
- [ ] LEM Verify API errors > 2%
- [ ] Email delivery failures > 5%
- [ ] Unprocessed KYC verifications > 24 hours old

### Logging

Ensure logs capture:
- [ ] Authentication attempts (success/failure)
- [ ] OAuth flow events
- [ ] Session creation/destruction
- [ ] Tenant assignment
- [ ] User role changes
- [ ] Error stack traces
- [ ] Webhook payloads (sanitized, no PII)
- [ ] KYC verification status changes
- [ ] Document upload events
- [ ] AI extraction results (confidence scores)
- [ ] Admin approval/rejection actions
- [ ] Lead-to-client conversions
- [ ] Third-party API calls (rate limits, errors)

---

## Maintenance Schedule

### Weekly
- [ ] Review authentication error logs
- [ ] Check OAuth success rates
- [ ] Monitor database performance

### Monthly
- [ ] Review user growth
- [ ] Audit user permissions
- [ ] Check for inactive sessions
- [ ] Review security logs

### Quarterly
- [ ] Update dependencies
- [ ] Review Better Auth changelog
- [ ] Security audit
- [ ] Performance optimization

### Annually
- [ ] Rotate OAuth secrets (before 24-month expiration)
- [ ] Review and update documentation
- [ ] Security penetration testing
- [ ] Disaster recovery testing

---

## Success Criteria

Deployment is successful when:

- ✅ All tests pass in production
- ✅ Microsoft OAuth works end-to-end
- ✅ Email/password authentication works
- ✅ Multi-tenancy verified
- ✅ No errors in logs
- ✅ Performance meets requirements
- ✅ Security checks pass
- ✅ User experience is smooth
- ✅ Monitoring and alerts configured
- ✅ Documentation updated

---

## Support Contacts

- **Azure Support**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- **Better Auth Discord**: https://discord.gg/better-auth
- **Development Team**: [Your contact info]

---

## Documentation References

- [Microsoft OAuth Setup Guide](./MICROSOFT_OAUTH_SETUP.md)
- [Authentication Overview](./AUTHENTICATION_OVERVIEW.md)
- [Microsoft OAuth Summary](./MICROSOFT_OAUTH_SUMMARY.md)
- [Development Guidelines](../CLAUDE.md)
- [README](../README.md)

---

---

## Troubleshooting Common Issues

### KYC/AML Onboarding Issues

**Webhook Not Received:**
- Check LEM Verify dashboard → Webhooks → Delivery logs
- Verify webhook URL is correct and accessible from internet
- Check webhook secret matches `LEMVERIFY_WEBHOOK_SECRET`
- Look for signature validation errors in application logs
- Test with manual webhook using curl or Postman

**Document Upload Failures:**
- Verify S3 credentials are correct
- Check S3 bucket permissions and CORS configuration
- Ensure file size limits not exceeded (max 10MB)
- Check network connectivity to S3 endpoint
- Review application logs for S3 SDK errors

**AI Extraction Not Working:**
- Verify `GOOGLE_AI_API_KEY` is valid
- Check Gemini API rate limits (60 req/min default)
- Ensure uploaded document is clear and readable
- Review extraction logs for API errors
- Test with different document types

**Auto-Approval Not Triggered:**
- Verify webhook received and processed successfully
- Check verification `outcome` is "pass"
- Verify AML screening `status` is "clear"
- Review activity logs for approval logic execution
- Check database transaction completed successfully

**Email Notifications Not Sent:**
- Verify Resend API key is valid
- Check domain DNS records (SPF, DKIM, DMARC)
- Review Resend dashboard for delivery errors
- Ensure email template rendering works
- Check application logs for Resend API errors

### Database Issues

**Migration Failures:**
- Run `pnpm db:reset` to reset entire database
- Check database connection string
- Verify PostgreSQL version compatibility (14+)
- Review migration SQL for syntax errors
- Check database user has sufficient permissions

**Seed Data Issues:**
- Ensure all foreign key relationships are valid
- Check seed data matches current schema
- Run seed scripts one at a time to isolate issues
- Review database constraints and indexes

### Authentication Issues

**Microsoft OAuth Not Working:**
- Verify redirect URI matches exactly (trailing slash matters)
- Check client ID and secret are correct
- Review Azure app registration settings
- Test with different Microsoft accounts
- Check application logs for OAuth errors

**Session Not Persisting:**
- Verify `BETTER_AUTH_SECRET` is set
- Check session cookie is being set (browser DevTools)
- Ensure HTTPS is enabled in production
- Review Better Auth configuration
- Check database session table for records

---

## Quick Reference

### Essential URLs
- **Application**: https://app.innspiredaccountancy.com
- **LEM Verify Dashboard**: https://lemverify.com/dashboard
- **Resend Dashboard**: https://resend.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Azure Portal**: https://portal.azure.com
- **Hetzner Cloud**: https://console.hetzner.cloud

### Support Contacts
- **LEM Verify Support**: support@lemverify.com
- **Resend Support**: support@resend.com
- **Google Cloud Support**: https://cloud.google.com/support
- **Better Auth Discord**: https://discord.gg/better-auth

### Documentation Links
- [LEM Verify Integration Guide](./kyc/LEMVERIFY_INTEGRATION.md)
- [Microsoft OAuth Setup](./MICROSOFT_OAUTH_SETUP.md)
- [Authentication Overview](./AUTHENTICATION_OVERVIEW.md)
- [Testing Documentation](../__tests__/README.md)
- [Development Guidelines](../CLAUDE.md)

---

**Last Updated**: 2025-10-10
**Status**: Production Ready (includes KYC/AML onboarding)
