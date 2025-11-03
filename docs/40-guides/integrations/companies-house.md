# Companies House API Integration

## Overview

The Companies House integration allows automatic lookup and population of UK company information during client creation. When creating a new client, users can enter a company registration number and retrieve verified company details including registered office address, directors, and persons with significant control (PSCs) directly from the official UK Companies House API.

This integration:
- Eliminates manual data entry errors
- Ensures company information is accurate and up-to-date
- Saves time during client onboarding
- Provides verified company structure information

## Setup Instructions

### 1. Register for API Key

1. Visit https://developer.company-information.service.gov.uk/
2. Create an account with Companies House Developer Hub
3. Navigate to "Manage Applications"
4. Click "Create New Application"
5. Provide application details (name, description)
6. Copy the generated API key

**Note:** The API key is free and has no cost per request.

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
COMPANIES_HOUSE_API_KEY="your-api-key-here"
NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"
```

**Important:**
- `COMPANIES_HOUSE_API_KEY` - Server-side only, never exposed to client
- `NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE` - Feature flag to enable/disable UI

### 3. Restart Development Server

```bash
pnpm dev
```

The Companies House lookup feature will now be available in the Client Creation Wizard.

## Using the Integration

### Client Creation Wizard

1. Navigate to **Client Hub → New Client**
2. Go to **"Registration Details"** step (Step 2)
3. Enter 8-digit Companies House number (e.g., "00000006" for BBC)
4. Click **"Lookup"** button
5. Company details auto-populate in the form

### What Data is Retrieved

The integration automatically populates the following fields:

**Company Information:**
- Company name (legal name)
- Company number (formatted)
- Incorporation date
- Company type (e.g., "Private Limited Company")
- Company status (active/inactive/dissolved)

**Registered Office Address:**
- Address line 1
- Address line 2
- City/Town
- County
- Postcode

**Company Officers:**
- Directors (name, role, appointment date)
- Company secretary (if applicable)
- Resignation dates (if applicable)

**Persons with Significant Control (PSCs):**
- Name
- Nationality
- Control nature (e.g., "ownership of shares", "voting rights")
- Date of notification

## Rate Limiting

**Limit:** 600 requests per 5 minutes (per API key)

**Handling:**
- Automatic rate limit tracking in database (`companies_house_rate_limit` table)
- When limit exceeded, cached data returned if available (see Caching section)
- Clear error message displayed: "Too many requests. Please try again in 5 minutes."
- Rate limit window resets every 5 minutes from first request

**Best Practices:**
- Avoid rapid-fire lookups (e.g., testing loops)
- Use cached data when available
- Wait 5 minutes before retrying after rate limit error

## Caching

**Cache Duration:** 24 hours

**Benefits:**
- Faster lookups (under 100ms for cached data vs. 1-2 seconds for API call)
- Reduces API calls and rate limit consumption
- Works when rate limited or offline
- Shared across all tenants (same company number)

**How it Works:**
1. First lookup: API call made, response cached for 24 hours
2. Subsequent lookups: Cached data returned instantly
3. After 24 hours: Cache expires, new API call made

**Cache Invalidation:**
Manual cache clearing available through database. Contact system administrator if urgent refresh needed (e.g., company details changed).

```sql
-- Clear specific company cache
DELETE FROM companies_house_cache WHERE company_number = '00000006';

-- Clear all expired cache
DELETE FROM companies_house_cache WHERE expires_at < NOW();
```

## Error Handling

| Error | User Message | What to Do |
|-------|-------------|------------|
| Company not found (404) | "Company not found. Please check the company number and try again." | Verify 8-digit number is correct. Try searching on [Companies House website](https://find-and-update.company-information.service.gov.uk/) |
| Rate limit exceeded (429) | "Too many requests. Please try again in 5 minutes." | Wait 5 minutes. Cached data will be used if available. |
| Network error | "Unable to connect to Companies House. Please check your internet connection." | Check internet connection. Verify Companies House API is not down. |
| API config error | "Companies House API configuration error. Contact support." | Check `COMPANIES_HOUSE_API_KEY` is set correctly. Verify API key is valid. |
| Invalid company number | "Please enter a valid 8-character company number" | Ensure company number is exactly 8 characters (pad with leading zeros if needed) |

**Error Recovery:**
- All errors are logged with Sentry (except rate limits)
- User-friendly messages displayed
- Form remains editable (manual entry still possible)
- Activity logs track failed lookups for debugging

## Testing

### Sandbox Testing

Test with known company numbers:

| Company Number | Company Name | Type | Use Case |
|---------------|--------------|------|----------|
| **00000006** | British Broadcasting Corporation | Public Corporation | Standard test case |
| **00000001** | General Electric Company | PLC | Large company with directors |
| **06500244** | Facebook UK Ltd | Private Limited | Tech company example |
| **01234567** | Example Ltd | Private Limited | Generic test |

### Manual Testing Steps

1. **Clear cache (optional):**
   ```sql
   DELETE FROM companies_house_cache WHERE company_number = '00000006';
   ```

2. **Enter test company number:**
   - Navigate to Client Hub → New Client
   - Go to Registration Details step
   - Enter "00000006"

3. **Click Lookup button**

4. **Verify all fields populate correctly:**
   - Company name: "British Broadcasting Corporation"
   - Company type: populated
   - Address fields: fully populated
   - Directors and PSCs: visible in form

5. **Check second lookup is fast (cached):**
   - Clear the form
   - Enter same company number
   - Click Lookup again
   - Should complete in under 100ms (instant)

### Automated Testing

Run integration tests:

```bash
# Run all client router tests (includes Companies House)
pnpm test app/server/routers/clients.test.ts

# Run specific Companies House tests
pnpm test -t "lookupCompaniesHouse"
```

## Production Deployment

### Checklist

- [ ] Register production API key at Companies House Developer Hub
- [ ] Add `COMPANIES_HOUSE_API_KEY` to production environment (Coolify/Hetzner)
- [ ] Set `NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"` in production
- [ ] Verify database tables exist (`companies_house_cache`, `companies_house_rate_limit`)
- [ ] Test with real company numbers (not just test data)
- [ ] Monitor rate limit usage (should not exceed 600 per 5 min)
- [ ] Set up cache invalidation procedure (document for ops team)
- [ ] Configure Sentry alerts for repeated API errors
- [ ] Test error handling (simulate rate limit, network errors)

### Monitoring

**Metrics to Track:**

1. **API Usage:**
   - Track requests per 5-minute window
   - Alert if approaching 600 request limit
   - Monitor in `companies_house_rate_limit` table

2. **Cache Hit Rate:**
   - Should be 80%+ in production
   - Low hit rate indicates frequent new company lookups (expected) or cache issues
   - Query: `SELECT COUNT(*) FROM companies_house_cache WHERE created_at > NOW() - INTERVAL '24 hours'`

3. **Error Rate:**
   - Monitor Sentry for repeated errors
   - Alert on API configuration errors (invalid key)
   - Track rate limit errors (may need higher tier)

4. **Performance:**
   - First lookup: Should be under 2 seconds
   - Cached lookup: Should be under 100ms
   - Alert if median lookup time exceeds 3 seconds

**Database Queries:**

```sql
-- Check rate limit status
SELECT * FROM companies_house_rate_limit ORDER BY window_start DESC LIMIT 1;

-- Check cache size and hit rate
SELECT
  COUNT(*) as total_cached,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cache,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_cache
FROM companies_house_cache;

-- Recent lookups
SELECT * FROM companies_house_cache
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Lookup button not visible

**Symptoms:** "Lookup" button missing from Registration Details step

**Causes:**
- Feature flag not set or set to "false"
- Environment variable not loaded

**Solutions:**
1. Check `.env.local` contains: `NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE="true"`
2. Restart dev server: `pnpm dev`
3. Verify in browser console: `console.log(process.env.NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE)`
4. Ensure no typos in environment variable name

### "Configuration error" message

**Symptoms:** Error message: "Companies House API configuration error. Contact support."

**Causes:**
- `COMPANIES_HOUSE_API_KEY` not set
- API key invalid or expired
- API key has wrong permissions

**Solutions:**
1. Verify `.env.local` contains: `COMPANIES_HOUSE_API_KEY="your-key"`
2. Check API key is valid at Companies House Developer Hub
3. Regenerate API key if expired
4. Restart dev server after changing env vars
5. Test API key with curl:
   ```bash
   curl -u "YOUR_API_KEY:" https://api.company-information.service.gov.uk/company/00000006
   ```

### Slow lookups

**Symptoms:** Lookups take 5+ seconds or timeout

**Expected Performance:**
- First lookup: 1-2 seconds (API call)
- Cached lookup: Under 100ms (instant)

**Causes:**
- Network connection slow
- Companies House API experiencing issues
- Cache not working (always hitting API)

**Solutions:**
1. Check internet connection speed
2. Verify Companies House API status: https://status.company-information.service.gov.uk/
3. Check cache is working:
   ```sql
   SELECT * FROM companies_house_cache WHERE company_number = '00000006';
   ```
4. If cache empty, check database connection
5. Monitor network tab in browser DevTools

### Cache not working

**Symptoms:** Every lookup takes 1-2 seconds (never instant)

**Causes:**
- Database tables missing or not created
- Cache TTL expired (24 hours)
- Cache not being written (database error)

**Solutions:**
1. Verify database tables exist:
   ```bash
   pnpm db:reset
   ```
2. Check cache table has entries:
   ```sql
   SELECT COUNT(*) FROM companies_house_cache;
   ```
3. Test cache write:
   - Perform lookup
   - Check database: `SELECT * FROM companies_house_cache ORDER BY created_at DESC LIMIT 1;`
4. Check for database errors in server logs

### Rate limit errors persist

**Symptoms:** "Too many requests" error even after waiting 5+ minutes

**Causes:**
- Rate limit window not reset
- Multiple users sharing same API key
- Testing script making rapid requests

**Solutions:**
1. Check current rate limit status:
   ```sql
   SELECT * FROM companies_house_rate_limit ORDER BY window_start DESC LIMIT 1;
   ```
2. If `request_count >= 600`, wait until `window_start + 5 minutes`
3. Clear rate limit manually (emergency only):
   ```sql
   DELETE FROM companies_house_rate_limit;
   ```
4. Identify high-volume users/tenants in activity logs
5. Consider implementing per-tenant rate limiting if needed

## Technical Details

### Database Tables

**companies_house_cache:**
```sql
CREATE TABLE companies_house_cache (
  id TEXT PRIMARY KEY,
  company_number TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,  -- Full API response
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL  -- created_at + 24 hours
);
```

**companies_house_rate_limit:**
```sql
CREATE TABLE companies_house_rate_limit (
  id TEXT PRIMARY KEY,
  window_start TIMESTAMP NOT NULL,  -- Start of 5-minute window
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Implementation Files

- **API client:** `lib/companies-house/client.ts`
  - HTTP client with authentication
  - Base URL: `https://api.company-information.service.gov.uk`
  - Basic auth using API key as username

- **Caching:** `lib/companies-house/cache.ts`
  - Get/set cache operations
  - 24-hour TTL
  - JSONB storage for full API response

- **Rate limiting:** `lib/companies-house/rate-limit.ts`
  - Track requests per 5-minute window
  - Check if limit exceeded
  - Atomic increment operations

- **tRPC procedure:** `app/server/routers/clients.ts`
  - Procedure: `clients.lookupCompaniesHouse`
  - Input validation: 8-character company number
  - Response transformation for frontend

- **UI component:** `app/client-hub/clients/new/_components/registration-details-step.tsx`
  - Lookup button and loading state
  - Auto-populate form fields
  - Error handling and display

### Multi-tenant Considerations

**Cache is global (not per-tenant):**
- Same company number returns same cached data for all tenants
- Reduces API calls and improves performance
- No data leakage (company info is public)

**Rate limit is global:**
- All tenants share 600 requests per 5 minutes
- High-volume tenant can impact others
- Consider per-tenant rate limiting if needed

**Activity logs track tenant:**
- Each lookup logged with `userId`, `tenantId`, `clientId`
- Audit trail for compliance
- Identify high-volume users/tenants

### API Response Structure

Example response for company 00000006 (BBC):

```json
{
  "company_name": "British Broadcasting Corporation",
  "company_number": "00000006",
  "type": "royal-charter",
  "company_status": "active",
  "date_of_creation": "1927-01-01",
  "registered_office_address": {
    "address_line_1": "Broadcasting House",
    "locality": "Portland Place",
    "postal_code": "W1A 1AA"
  },
  "officers": {
    "items": [
      {
        "name": "DAVIE, Timothy",
        "officer_role": "director",
        "appointed_on": "2020-09-01"
      }
    ]
  },
  "persons_with_significant_control": {
    "items": [
      {
        "name": "His Majesty's Government",
        "natures_of_control": ["ownership-of-shares-75-to-100-percent"]
      }
    ]
  }
}
```

### Security Considerations

1. **API Key Protection:**
   - Never expose `COMPANIES_HOUSE_API_KEY` to client
   - Server-side only (tRPC procedure)
   - Rotate key if compromised

2. **Input Validation:**
   - Zod schema validates company number (8 chars, alphanumeric)
   - Prevents injection attacks

3. **Rate Limiting:**
   - Protects against abuse
   - Global limit shared across tenants

4. **Error Handling:**
   - No sensitive data in error messages
   - All errors logged with Sentry
   - Activity logs track all lookups

5. **Data Privacy:**
   - Companies House data is public (no GDPR concerns)
   - Cache does not contain client-specific data
   - Activity logs track user actions (audit trail)

## Further Reading

- [Companies House Developer Hub](https://developer.company-information.service.gov.uk/)
- [Companies House API Reference](https://developer-specs.company-information.service.gov.uk/)
- [Companies House Status Page](https://status.company-information.service.gov.uk/)
- [Find and Update Company Information](https://find-and-update.company-information.service.gov.uk/)
