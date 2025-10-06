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
- [x] `MICROSOFT_CLIENT_ID` added to local `.env.local`
- [x] `MICROSOFT_CLIENT_SECRET` added to local `.env.local`
- [ ] `MICROSOFT_CLIENT_ID` added to production environment
- [ ] `MICROSOFT_CLIENT_SECRET` added to production environment
- [ ] `BETTER_AUTH_URL` set to production domain
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` set to production domain
- [ ] `BETTER_AUTH_SECRET` different from development (use `openssl rand -base64 32`)
- [ ] `DATABASE_URL` points to production database

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
- [ ] Production database migrated
- [ ] Production database seeded with initial data (if needed)

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
   MICROSOFT_CLIENT_ID="f9e3ca9e-0f80-4ffc-a216-951146248899"
   MICROSOFT_CLIENT_SECRET="V2_8Q~Y14h5HYA2ag6C9dPEYzGO2qvqHLKFGwaKe"
   ```

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

### Step 6: Monitor and Verify

1. **Check Application Logs**
   - [ ] No authentication errors
   - [ ] No database connection errors
   - [ ] OAuth callbacks successful
   - [ ] Session creation successful

2. **Check Better Auth Logs**
   - [ ] No warnings about missing credentials
   - [ ] No CSRF errors
   - [ ] OAuth state validation passing

3. **Monitor Performance**
   - [ ] Sign-in response time < 2s
   - [ ] OAuth callback response time < 3s
   - [ ] Dashboard load time < 2s

4. **Test from Different Locations**
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

### Functionality Checks

- [ ] **OAuth Flow**: Microsoft OAuth works end-to-end
- [ ] **Email/Password**: Traditional authentication works
- [ ] **Session Management**: Sessions persist correctly
- [ ] **Sign Out**: Users can sign out successfully
- [ ] **Redirect**: Users redirected to correct page after auth
- [ ] **Multi-Tenant**: Data isolation between organizations verified
- [ ] **Role-Based Access**: Admin features only accessible by admins

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

### Alerts

Configure alerts for:
- [ ] Authentication failure rate > 10%
- [ ] OAuth callback errors > 5%
- [ ] Database connection failures
- [ ] API response time > 5s
- [ ] Error rate > 1%

### Logging

Ensure logs capture:
- [ ] Authentication attempts (success/failure)
- [ ] OAuth flow events
- [ ] Session creation/destruction
- [ ] Tenant assignment
- [ ] User role changes
- [ ] Error stack traces

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

**Last Updated**: 2025-10-06
**Status**: Ready for Production Deployment
