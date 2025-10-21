# Xero Integration Setup Guide

## Overview

This guide walks you through setting up the Xero OAuth 2.0 integration for Practice Hub. Once configured, the system can automatically fetch transaction data from clients' Xero accounts.

## Prerequisites

- A Xero developer account
- Access to create Xero apps
- Practice Hub running with a publicly accessible URL (or ngrok for local development)

## Step 1: Create a Xero App

1. Go to [Xero Developer Portal](https://developer.xero.com/app/manage)
2. Click **"New app"**
3. Fill in the application details:
   - **App name**: Practice Hub Integration
   - **Company or application URL**: Your Practice Hub URL
   - **OAuth 2.0 redirect URI**:
     - Production: `https://yourdomain.com/api/xero/callback`
     - Development: `http://localhost:3000/api/xero/callback`
   - **Integration type**: Web app

4. Click **"Create app"**

## Step 2: Get OAuth Credentials

After creating the app:

1. You'll see your **Client ID** - copy this
2. Click **"Generate a secret"** to get your **Client Secret** - copy this immediately (it won't be shown again)

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Xero OAuth Configuration
XERO_CLIENT_ID="your_client_id_here"
XERO_CLIENT_SECRET="your_client_secret_here"
XERO_REDIRECT_URI="http://localhost:3000/api/xero/callback"

# For production, use:
# XERO_REDIRECT_URI="https://yourdomain.com/api/xero/callback"
```

**IMPORTANT**:
- Never commit these credentials to version control
- Add `.env.local` to `.gitignore` (already done)
- For production, use Coolify environment variables instead

## Step 4: Reset Database

The Xero integration adds a new `xero_connections` table to the database schema.

```bash
pnpm db:reset
```

This will:
- Drop and recreate all tables
- Add the new `xero_connections` table
- Re-seed the database

## Step 5: Test the Integration (Development)

### Option A: Using ngrok (Recommended for local testing)

If testing OAuth locally, you need a public URL:

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `pnpm dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update your Xero app's redirect URI to: `https://abc123.ngrok.io/api/xero/callback`
6. Update `XERO_REDIRECT_URI` in `.env.local` to the same URL
7. Restart your dev server

### Option B: Production Testing

Deploy to your production environment with the correct `XERO_REDIRECT_URI` environment variable set.

## Step 6: Connect a Client to Xero

1. Log in to Practice Hub
2. Go to **Client Hub** → **Clients**
3. Click on a client
4. Look for the **"Connect to Xero"** button
5. Click it - you'll be redirected to Xero
6. Log in to the client's Xero account
7. Authorize Practice Hub
8. You'll be redirected back to Practice Hub

## Step 7: Fetch Transaction Data

Once a client is connected:

1. Go to the **Proposal Calculator**
2. Select the connected client
3. Click **"Fetch from Xero"**
4. The system will:
   - Fetch bank transactions from the last 6 months
   - Calculate average monthly transactions
   - Store the data automatically

## How It Works

### OAuth Flow

```
User clicks "Connect to Xero"
  ↓
GET /api/xero/authorize?clientId=abc-123
  ↓
Redirects to Xero login
  ↓
User authorizes in Xero
  ↓
Xero redirects to /api/xero/callback
  ↓
Exchange code for access token
  ↓
Store tokens in xero_connections table
  ↓
Redirect back to client page
```

### Token Management

- Access tokens expire after 30 minutes
- The system automatically refreshes tokens using the refresh token
- Tokens are stored securely in the database
- Each client can have one active Xero connection

### Data Fetching

When you click "Fetch from Xero":

1. System retrieves the stored access token
2. Refreshes it if expired (automatically)
3. Fetches bank transactions from Xero API
4. Calculates average monthly transactions
5. Stores in `client_transaction_data` table
6. Used in pricing calculations

## Security Best Practices

1. **Never expose credentials**:
   - Don't commit `.env.local` to git
   - Use secure environment variables in production
   - Rotate secrets regularly

2. **Token storage**:
   - Tokens are encrypted in the database
   - Each client has isolated token storage
   - Tokens are refreshed automatically

3. **Scopes**:
   The integration requests these Xero scopes:
   - `accounting.transactions.read` - Read bank transactions
   - `accounting.contacts.read` - Read contact details
   - `accounting.settings.read` - Read organization settings
   - `offline_access` - Refresh tokens

## Troubleshooting

### Error: "Redirect URI mismatch"

**Solution**: Ensure the redirect URI in your Xero app matches exactly:
- Check trailing slashes
- Verify HTTP vs HTTPS
- Confirm the port number (if using localhost)

### Error: "No Xero connection found"

**Solution**: The client hasn't connected to Xero yet. Click "Connect to Xero" first.

### Error: "Token expired"

**Solution**: The system should auto-refresh. If it doesn't:
1. Disconnect and reconnect the client
2. Check your Xero app is still active
3. Verify credentials are correct

### Error: "Failed to fetch transactions"

**Solution**:
1. Check the client's Xero account has bank accounts connected
2. Verify the Xero organization has transaction data
3. Check the date range (last 6 months)

## API Endpoints

### Authorization
- **GET** `/api/xero/authorize?clientId=<uuid>`
- Initiates OAuth flow
- Requires authentication
- Redirects to Xero

### Callback
- **GET** `/api/xero/callback`
- Handles OAuth callback
- Exchanges code for token
- Stores credentials
- Redirects to client page

### Fetch Transactions (tRPC)
- **Mutation** `transactionData.fetchFromXero(clientId: string)`
- Fetches and processes transaction data
- Stores results in database
- Returns calculated monthly average

## Database Schema

### xero_connections Table

```sql
CREATE TABLE xero_connections (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- Xero organization details
  xero_tenant_id TEXT NOT NULL,  -- Xero's internal tenant ID
  xero_tenant_name TEXT,
  xero_organisation_id TEXT,

  -- Connection status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'connected',
  sync_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  connected_by TEXT REFERENCES users(id),

  UNIQUE(client_id)  -- One connection per client
);
```

## Production Deployment

### Coolify Environment Variables

Add these to your Coolify app configuration:

```bash
XERO_CLIENT_ID=your_production_client_id
XERO_CLIENT_SECRET=your_production_client_secret
XERO_REDIRECT_URI=https://yourdomain.com/api/xero/callback
```

### Xero App Settings

Update your Xero app with production redirect URI:
- Go to developer portal
- Edit your app
- Update OAuth 2.0 redirect URI to production URL
- Save changes

## Support

For issues:
- Check the browser console for errors
- Check server logs for API errors
- Verify Xero app credentials
- Test with a different Xero account

## Next Steps

After setup:
1. Test with a sandbox Xero account first
2. Connect real client accounts
3. Monitor token refresh behavior
4. Set up error notifications
5. Document client-facing instructions

---

**Implementation Status**: ✅ Complete

All code components are implemented:
- ✅ Database schema (`xero_connections` table)
- ✅ OAuth client library (`lib/xero/client.ts`)
- ✅ Authorization endpoint (`/api/xero/authorize`)
- ✅ Callback endpoint (`/api/xero/callback`)
- ✅ Transaction fetching (`transactionData.fetchFromXero`)
- ✅ Automatic token refresh
- ✅ Error handling
