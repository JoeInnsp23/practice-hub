# Companies House Integration

**Location**: `lib/companies-house/`
**Type**: Integration Library
**Status**: Active

## Overview

UK Companies House API integration for company lookup, officer search, and PSC (Persons with Significant Control) data.

## Files

- `client.ts` - Companies House API client
- `cache.ts` - Response caching layer
- `rate-limit.ts` - Rate limiting (600 req/5min)
- `mapper.ts` - Data transformation

## Environment Variables

- `COMPANIES_HOUSE_API_KEY` - API key
- `NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE` - Feature flag

## Documentation

See [Companies House Integration Guide](../../docs/guides/integrations/companies-house.md)
