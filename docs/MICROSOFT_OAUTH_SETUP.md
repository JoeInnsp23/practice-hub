# Microsoft OAuth Integration Guide

This guide provides complete instructions for setting up Microsoft OAuth authentication with Better Auth in Practice Hub.

## Overview

Microsoft OAuth allows users to sign in using their Microsoft accounts (both personal and work/school accounts). This integration uses Better Auth's social provider functionality.

## Architecture

### Authentication Flow

1. User clicks "Continue with Microsoft" button
2. Redirected to Microsoft login page
3. User authenticates with Microsoft
4. Microsoft redirects back to `/api/auth/callback/microsoft`
5. Better Auth creates/updates user account
6. User redirected to `/oauth-setup` to check tenant status
7. If no tenant exists, user completes organization setup
8. User redirected to Practice Hub dashboard

### Multi-Tenancy Integration

Microsoft OAuth users are automatically created by Better Auth, but they need to be assigned to a tenant. The flow handles this through:

- **`/api/oauth-setup` (GET)**: Checks if user has a tenant assigned
- **`/api/oauth-setup` (POST)**: Creates tenant and assigns user
- **`/oauth-setup` page**: UI for organization setup for OAuth users

## Prerequisites

- Azure account with access to Microsoft Entra ID (formerly Azure Active Directory)
- Account must have "Application Developer" role or equivalent permissions

## Step 1: Register Application in Microsoft Entra ID

### 1.1 Access Microsoft Entra Admin Center

1. Go to https://entra.microsoft.com
2. Sign in with your Azure account
3. Navigate to **Identity** → **App registrations**

### 1.2 Create New Registration

1. Click **+ New registration**
2. Fill in the registration form:

**Name:**
```
Practice Hub
```

**Supported account types:**
Select **"Accounts in this organizational directory only (Single tenant)"**

- Use this for internal business applications
- For multi-tenant SaaS, choose "Accounts in any organizational directory"
- For personal + work accounts, choose the third option

**Redirect URI (Optional):**
- Platform: **Web**
- URL: `http://localhost:3000/api/auth/callback/microsoft`

3. Click **Register**

### 1.3 Copy Application (Client) ID

After registration, you'll be on the **Overview** page:

1. Locate **Application (client) ID**
2. Copy the UUID (e.g., `f9e3ca9e-0f80-4ffc-a216-951146248899`)
3. Save this as your `MICROSOFT_CLIENT_ID`

## Step 2: Create Client Secret

### 2.1 Navigate to Certificates & Secrets

1. In the left sidebar, click **"Certificates & secrets"**
2. Click the **"Client secrets"** tab
3. Click **"+ New client secret"**

### 2.2 Configure Secret

1. **Description**: `Practice Hub Production Secret`
2. **Expires**: Select **24 months (730 days)**
   - Set a calendar reminder to rotate before expiration
3. Click **Add**

### 2.3 Copy Secret Value

⚠️ **CRITICAL**: The secret value is only shown once!

1. A new row appears with your secret
2. Copy the **Value** column (e.g., `V2_8Q~Y14h5HYA2ag6C9dPEYzGO2qvqHLKFGwaKe`)
3. Save this as your `MICROSOFT_CLIENT_SECRET`
4. Do NOT copy the "Secret ID" - you need the "Value"

## Step 3: Configure Redirect URIs

### 3.1 Add Production Redirect URI

1. In the left sidebar, click **"Authentication"**
2. Under **"Platform configurations"** → **"Web"**, you should see localhost URI
3. Click **"+ Add URI"**
4. Enter your production URL:
   ```
   https://app.innspiredaccountancy.com/api/auth/callback/microsoft
   ```
5. Click **Save** at the bottom

### 3.2 Verify Both URIs

You should now have both redirect URIs configured:
- ✅ `http://localhost:3000/api/auth/callback/microsoft` (Development)
- ✅ `https://app.innspiredaccountancy.com/api/auth/callback/microsoft` (Production)

## Step 4: Configure Environment Variables

### 4.1 Update `.env.local` (Development)

Add these lines to your `.env.local` file:

```env
# Microsoft OAuth
MICROSOFT_CLIENT_ID="f9e3ca9e-0f80-4ffc-a216-951146248899"
MICROSOFT_CLIENT_SECRET="V2_8Q~Y14h5HYA2ag6C9dPEYzGO2qvqHLKFGwaKe"
```

Replace the values with your actual credentials from Azure.

### 4.2 Update Production Environment Variables

For production deployment, add the same environment variables to your hosting platform:

**Vercel:**
```bash
vercel env add MICROSOFT_CLIENT_ID
vercel env add MICROSOFT_CLIENT_SECRET
```

**Other platforms:** Add via their dashboard or deployment configuration.

## Step 5: Test the Integration

### 5.1 Local Testing

1. Restart your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/sign-in`

3. Click the **"Continue with Microsoft"** button

4. You should be redirected to Microsoft's login page

5. Sign in with your Microsoft account

6. Complete the organization setup form:
   - First Name (auto-filled from Microsoft profile)
   - Last Name (auto-filled from Microsoft profile)
   - Organization Name (enter your organization)

7. You should be redirected to the Practice Hub dashboard

8. Verify user was created in database:
   ```bash
   PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -i practice-hub-db psql -U postgres -d practice_hub -c "SELECT id, email, name, tenant_id FROM users WHERE email = 'your-microsoft-email@domain.com';"
   ```

### 5.2 Production Testing

1. Deploy your application with the environment variables
2. Navigate to `https://app.innspiredaccountancy.com/sign-in`
3. Follow the same testing steps as local testing
4. Verify the OAuth flow works end-to-end

## Configuration Details

### Better Auth Configuration

Located in `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ... other config
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: "common", // Allows personal + work/school accounts
      authority: "https://login.microsoftonline.com",
      prompt: "select_account", // Forces account selection every time
    },
  },
});
```

### Tenant Configuration Options

**`tenantId: "common"`** (Current setting)
- Allows both personal and work/school Microsoft accounts
- Most flexible option

**`tenantId: "organizations"`**
- Only allows work/school accounts
- Blocks personal Microsoft accounts

**`tenantId: "<your-tenant-id>"`**
- Only allows users from a specific Azure AD tenant
- Most restrictive option

### Callback URLs

**Development:**
```
http://localhost:3000/api/auth/callback/microsoft
```

**Production:**
```
https://app.innspiredaccountancy.com/api/auth/callback/microsoft
```

**Format:**
```
{BASE_URL}/api/auth/callback/microsoft
```

If you change the `basePath` in Better Auth configuration, update accordingly.

## Database Schema

### Better Auth Tables

Microsoft OAuth uses these Better Auth tables:

**`users` table:**
- `id`: User UUID (generated by Better Auth)
- `email`: Email from Microsoft profile
- `name`: Full name from Microsoft profile
- `emailVerified`: Set to `true` (Microsoft verifies emails)
- `image`: Profile picture URL from Microsoft (if available)
- `tenantId`: Assigned during OAuth setup flow

**`accounts` table:**
- `id`: Account UUID
- `accountId`: Microsoft user ID
- `providerId`: Set to `"microsoft"`
- `userId`: References `users.id`
- `accessToken`: OAuth access token
- `refreshToken`: OAuth refresh token (if available)
- `idToken`: OpenID Connect ID token
- `accessTokenExpiresAt`: Token expiration timestamp
- `scope`: Granted OAuth scopes

**`sessions` table:**
- Standard Better Auth session management
- Same as email/password authentication

## Security Considerations

### PKCE (Proof Key for Code Exchange)

Better Auth automatically implements PKCE for Microsoft OAuth:
- Generates code verifier and challenge
- Protects against authorization code interception attacks
- No additional configuration required

### State Parameter

Better Auth uses the state parameter to prevent CSRF attacks:
- Random state value generated for each OAuth request
- Stored in database during OAuth flow
- Validated on callback
- Automatically cleaned up after use

### Token Storage

OAuth tokens are stored securely:
- Access tokens encrypted at rest in database
- Refresh tokens encrypted at rest in database
- Tokens automatically refreshed by Better Auth when expired
- No tokens stored in client-side localStorage or cookies

### Account Linking

If a user signs up with email/password, then later signs in with Microsoft using the same email:
- Better Auth can link the accounts automatically
- Requires `emailVerified: true` on both accounts
- Controlled by `account.accountLinking` configuration
- Currently disabled by default in this application

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause:** The redirect URI in your request doesn't match Azure configuration

**Solution:**
1. Check Azure Portal → Authentication → Redirect URIs
2. Ensure exact match (including protocol, port, path)
3. Common mistake: `http` vs `https` mismatch

### Error: "Invalid client secret"

**Cause:** Client secret is incorrect or expired

**Solution:**
1. Verify `MICROSOFT_CLIENT_SECRET` in `.env.local`
2. Check for extra spaces or quotes
3. If expired, create new secret in Azure Portal
4. Update environment variables

### Error: "User not found in organization"

**Cause:** User created by Better Auth but not assigned to tenant

**Solution:**
1. This should be handled automatically by `/oauth-setup` flow
2. Check if `/oauth-setup` page is being called after OAuth callback
3. Verify tenant assignment in database:
   ```sql
   SELECT id, email, tenant_id FROM users WHERE email = 'user@example.com';
   ```

### Warning: "Social provider microsoft is missing clientId or clientSecret"

**Cause:** Environment variables not loaded

**Solution:**
1. Ensure `.env.local` exists in project root
2. Restart dev server after adding environment variables
3. Verify environment variables are not commented out
4. Check for typos in variable names

### OAuth Setup Page Not Showing

**Cause:** Callback URL not set to `/oauth-setup`

**Solution:**
1. Check `sign-in/page.tsx` and `sign-up/page.tsx`
2. Verify `callbackURL: "/oauth-setup"` in `signIn.social()` calls

### Users Not Redirected to Dashboard

**Cause:** Tenant setup not completing

**Solution:**
1. Check browser console for errors
2. Verify `/api/oauth-setup` POST endpoint is working
3. Check database for tenant creation
4. Ensure user's `tenantId` is updated

## API Endpoints

### GET /api/oauth-setup

**Purpose:** Check if current user needs organization setup

**Authentication:** Required (Better Auth session)

**Response:**
```json
{
  "hasTenant": false,
  "needsSetup": true
}
```

### POST /api/oauth-setup

**Purpose:** Create organization and assign tenant to OAuth user

**Authentication:** Required (Better Auth session)

**Request Body:**
```json
{
  "organizationName": "My Practice",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "tenantId": "uuid-of-tenant",
  "hasTenant": true
}
```

## UI Components

### Sign-In Page

Located in `app/(auth)/sign-in/page.tsx`

**Microsoft Button:**
- Uses official Microsoft branding colors
- SVG icon with Microsoft logo
- Positioned above email/password form
- Separated by "Or continue with email" divider

### Sign-Up Page

Located in `app/(auth)/sign-up/page.tsx`

**Microsoft Button:**
- Identical styling to sign-in page
- Separated by "Or create account with email" divider
- Same OAuth flow as sign-in

### OAuth Setup Page

Located in `app/(auth)/oauth-setup/page.tsx`

**Features:**
- Auto-fills name from Microsoft profile
- Prompts for organization name
- Creates tenant and assigns user
- Redirects to Practice Hub on completion

## Maintenance

### Secret Rotation

Microsoft client secrets expire after 24 months:

1. **Before expiration:**
   - Create new client secret in Azure Portal
   - Add new secret to production environment variables
   - Deploy application
   - Remove old secret from Azure Portal

2. **Update calendar reminder:**
   - Set reminder 1 month before expiration
   - Document secret creation date

### Monitoring

Monitor these metrics:
- OAuth success/failure rates
- Tenant assignment success rates
- User creation patterns
- Token refresh failures

### Logs

Check application logs for:
- `[Better Auth]: Social provider microsoft...` warnings
- `Auth: Failed to get auth context` errors
- OAuth callback errors
- Tenant assignment failures

## Production Checklist

Before deploying to production:

- [ ] Client ID added to production environment variables
- [ ] Client secret added to production environment variables
- [ ] Production redirect URI added to Azure Portal
- [ ] Environment variables verified in hosting platform
- [ ] OAuth flow tested on production domain
- [ ] Tenant assignment tested end-to-end
- [ ] Error handling tested (invalid credentials, network failures)
- [ ] Secret rotation reminder set (24 months)
- [ ] Monitoring and logging configured
- [ ] Backup authentication method available (email/password)

## Support Resources

- **Better Auth Documentation:** https://www.better-auth.com/docs
- **Microsoft Identity Platform:** https://learn.microsoft.com/en-us/entra/identity-platform/
- **Azure Portal:** https://portal.azure.com
- **Microsoft Entra Admin Center:** https://entra.microsoft.com

## Changelog

### 2025-10-06
- ✅ Initial Microsoft OAuth integration
- ✅ Added OAuth setup flow for tenant assignment
- ✅ Configured for both development and production environments
- ✅ Tested with Client ID: `f9e3ca9e-0f80-4ffc-a216-951146248899`
- ✅ Production domain: `https://app.innspiredaccountancy.com`
