# Authentication System Overview

## Authentication Methods

Practice Hub supports two authentication methods:

### 1. Email/Password Authentication
- Traditional username/password authentication
- Passwords hashed with bcrypt (10 rounds)
- Email verification optional (disabled in development)
- Session-based authentication with 7-day expiration

### 2. Microsoft OAuth (Social Login)
- Sign in with Microsoft personal accounts
- Sign in with Microsoft work/school accounts
- Automatic account creation on first sign-in
- Profile information (name, email, photo) imported from Microsoft
- Secure OAuth 2.0 flow with PKCE

## Authentication Provider

**Better Auth** is the authentication framework used throughout the application.

### Why Better Auth?

- Modern, TypeScript-first authentication library
- Built-in support for social providers (Microsoft, Google, GitHub, etc.)
- Multi-tenant support with organizations plugin
- Secure by default (CSRF protection, PKCE, encrypted tokens)
- Database-agnostic with Drizzle ORM integration
- Session management with automatic refresh
- Extensible with plugins

### Better Auth Documentation
- Official Docs: https://www.better-auth.com/docs
- GitHub: https://github.com/better-auth/better-auth

## User Flow

### Email/Password Sign-Up Flow

1. User navigates to `/sign-up`
2. User fills in:
   - First Name
   - Last Name
   - Email
   - Password
   - Organization Name
3. Client calls `signUp.email()` → creates user in Better Auth
4. Client calls `/api/setup-tenant` → creates tenant and assigns user
5. User redirected to `/practice-hub` dashboard

### Email/Password Sign-In Flow

1. User navigates to `/sign-in`
2. User enters email and password
3. Client calls `signIn.email()` → validates credentials
4. Session created
5. User redirected to original destination or `/practice-hub`

### Microsoft OAuth Sign-In Flow

1. User navigates to `/sign-in` or `/sign-up`
2. User clicks "Continue with Microsoft" button
3. Redirected to Microsoft login page
4. User authenticates with Microsoft account
5. Microsoft redirects to `/api/auth/callback/microsoft`
6. Better Auth processes callback:
   - Creates or updates user account
   - Stores OAuth tokens
   - Creates session
7. User redirected to `/oauth-setup`
8. `/oauth-setup` page checks if user has tenant:
   - **If yes**: Redirect to `/practice-hub`
   - **If no**: Show organization setup form
9. User completes organization setup
10. Client calls `/api/oauth-setup` (POST) → creates tenant and assigns user
11. User redirected to `/practice-hub` dashboard

## Multi-Tenancy

### Architecture

Every user belongs to exactly one tenant (organization). Tenants are isolated from each other at the database level.

### Tenant Assignment

**Email/Password Users:**
- Tenant created during sign-up process
- First user becomes org admin
- Organization name provided in sign-up form

**Microsoft OAuth Users:**
- User account created by Better Auth automatically
- Tenant assignment handled by `/oauth-setup` flow
- Organization name collected after OAuth completes
- First user becomes org admin

### Auth Context

The `getAuthContext()` helper provides tenant-aware authentication:

```typescript
const authContext = await getAuthContext();
// Returns:
// {
//   userId: string,
//   tenantId: string,
//   organizationName: string,
//   role: string,
//   email: string,
//   firstName: string | null,
//   lastName: string | null
// }
```

All database queries should filter by `tenantId` to ensure data isolation.

## Session Management

### Session Configuration

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day (update if older than this)
}
```

### Session Storage

- Sessions stored in PostgreSQL `session` table
- Session tokens stored as HTTP-only cookies
- Automatic session refresh when user is active
- Secure flag enabled in production

### Session Validation

Better Auth automatically validates sessions on every request:
- Token verified against database
- Expiration checked
- User account status verified
- IP and user agent logged (optional)

## Security Features

### CSRF Protection

Better Auth validates the `Origin` header on all requests:
- Requests from trusted origins allowed
- Requests from untrusted origins blocked
- Configurable via `trustedOrigins` array

### OAuth Security

**PKCE (Proof Key for Code Exchange):**
- Prevents authorization code interception attacks
- Code verifier generated client-side
- Code challenge sent to authorization server
- Automatically implemented by Better Auth

**State Parameter:**
- Random state value generated for each OAuth request
- Prevents CSRF attacks during OAuth flow
- Validated on callback
- Stored temporarily in database

### Password Security

- Bcrypt hashing with 10 rounds (cost factor)
- Passwords never stored in plain text
- Passwords never logged or exposed in API responses
- Minimum password length: 8 characters (configurable)

### Token Security

OAuth tokens encrypted at rest:
- Access tokens encrypted in database
- Refresh tokens encrypted in database
- ID tokens stored securely
- Automatic token refresh handled by Better Auth

## Middleware Protection

### Public Routes

These routes are accessible without authentication:
- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page

### Protected Routes

All other routes require authentication:
- Middleware checks session on every request
- Unauthenticated users redirected to `/sign-in`
- Original destination saved in `from` query parameter

### API Routes

- `/api/auth/*` - Better Auth endpoints (public)
- `/api/oauth-setup` - OAuth setup endpoint (requires session)
- `/api/setup-tenant` - Tenant setup endpoint (requires session)
- `/api/trpc/*` - tRPC endpoints (auth handled per-procedure)

## Role-Based Access Control

### User Roles

- **`org:admin`** - Organization administrator (full access)
- **`member`** - Regular user (limited access)

### Role Assignment

- First user in organization: `org:admin`
- Additional users: `member` (default)
- Admins can promote users to admin

### Role Checking

**Server-Side:**
```typescript
const authContext = await requireAdmin(); // Throws if not admin
```

**Client-Side:**
```typescript
const { data: session } = useSession();
if (authContext?.role === 'org:admin') {
  // Show admin features
}
```

## API Reference

### Server-Side Auth Helpers

**`getAuthContext()`**
- Returns auth context with tenant info
- Returns `null` if not authenticated
- Use for optional authentication checks

**`requireAuth()`**
- Returns auth context
- Throws error if not authenticated
- Use for protected routes

**`requireAdmin()`**
- Returns auth context
- Throws error if not authenticated or not admin
- Use for admin-only routes

**`auth.api.getSession()`**
- Returns Better Auth session
- No tenant context
- Use for basic session checks

### Client-Side Auth Hooks

**`useSession()`**
```typescript
const { data: session, isPending } = useSession();
```

**`signIn.email()`**
```typescript
await signIn.email({
  email: 'user@example.com',
  password: 'password',
  callbackURL: '/dashboard'
});
```

**`signIn.social()`**
```typescript
await signIn.social({
  provider: 'microsoft',
  callbackURL: '/oauth-setup'
});
```

**`signOut()`**
```typescript
await signOut();
```

**`signUp.email()`**
```typescript
await signUp.email({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe',
  callbackURL: '/dashboard'
});
```

## Environment Variables

### Required

```env
# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-secret-key"

# Better Auth URLs
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

### Optional (Microsoft OAuth)

```env
MICROSOFT_CLIENT_ID="your-microsoft-client-id-from-azure"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret-from-azure"
```

⚠️ **NEVER commit real credentials to git.** Get these from Azure Portal.

## Database Tables

### Core Auth Tables

**`users`**
- Primary user table
- Extended with tenant context
- Fields: id, email, name, tenantId, role, etc.

**`sessions`**
- Active user sessions
- Fields: id, userId, token, expiresAt, etc.

**`accounts`**
- OAuth account connections
- Fields: id, userId, providerId, accessToken, etc.

**`verifications`**
- Email verification tokens
- Password reset tokens
- Fields: id, identifier, value, expiresAt

**`tenants`**
- Organization/tenant management
- Fields: id, name, slug, createdAt, updatedAt

## Troubleshooting

### Common Issues

**"Unauthorized" error:**
- Check if session exists: `await auth.api.getSession()`
- Verify environment variables are loaded
- Check if user exists in database

**"User not found in organization":**
- Check if user has `tenantId` assigned
- Verify tenant exists in database
- Run OAuth setup flow if needed

**Microsoft OAuth not working:**
- Verify `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`
- Check redirect URI in Azure Portal
- Ensure environment variables are loaded (restart dev server)

### Debug Commands

**Check user session:**
```sql
SELECT * FROM session WHERE user_id = 'user-id';
```

**Check user tenant:**
```sql
SELECT id, email, tenant_id, role FROM users WHERE email = 'user@example.com';
```

**Check OAuth accounts:**
```sql
SELECT * FROM account WHERE user_id = 'user-id';
```

## Related Documentation

- [Microsoft OAuth Setup Guide](./MICROSOFT_OAUTH_SETUP.md)
- [Development Guidelines (CLAUDE.md)](../CLAUDE.md)
- [Better Auth Documentation](https://www.better-auth.com/docs)

## Security Best Practices

1. **Use different secrets for dev and production**
2. **Rotate OAuth secrets every 24 months**
3. **Enable HTTPS in production**
4. **Set secure cookie flags in production**
5. **Monitor failed login attempts**
6. **Implement rate limiting on auth endpoints**
7. **Keep Better Auth and dependencies updated**
8. **Audit user permissions regularly**
9. **Log authentication events**
10. **Use environment variables for all secrets**
