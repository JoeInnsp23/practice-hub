# Known Issues

**Last Updated:** 2025-10-24
**Maintainer:** Development Team

This document tracks known issues, cosmetic warnings, and technical limitations in Practice Hub.

---

## 🟡 Microsoft OAuth Warning in Tests (Cosmetic)

**Symptom:**
```
[Better Auth]: Social provider microsoft is missing clientId or clientSecret
```

**Status:** ⚠️ **FALSE POSITIVE** - Credentials ARE present in environment

**Root Cause:** Better Auth validates environment variables at module load time during test execution, possibly in a different context where env vars aren't available.

**Impact:**
- ✅ **NONE** - Tests pass successfully
- ✅ OAuth functional in development and production
- ⚠️ Cosmetic warning in test output

**Verification:**
- ✅ Credentials present in `.env.local:10-11`:
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
- ✅ Microsoft OAuth sign-in works in all environments
- ✅ No functional impact on application

**Resolution:** Not needed - this is a test environment artifact only.

**Related Files:**
- `lib/auth.ts:51-57` - Microsoft OAuth configuration
- `.env.local:10-11` - OAuth credentials

---

## 📝 Service Import: Hardcoded pricingModel (Limitation)

**Issue:** Service CSV imports always set `pricingModel: "turnover"`

**Status:** 📋 **KNOWN LIMITATION** - Documented behavior

**Details:**
- Not exposed in CSV import schema
- Users must update via UI after import if different pricing model needed
- Affects: `/api/import/services` endpoint

**Root Cause:**
- Complexity of exposing pricing model selection in CSV format
- Business logic validation requirements
- Intentional simplification for bulk import

**Workaround:**
1. Import services via CSV
2. Navigate to Admin → Services
3. Edit individual services to change pricing model

**Future Enhancement:**
- Consider adding `pricing_model` column to CSV schema in Epic 6
- Requires validation logic for model-specific fields

**Related Files:**
- `app/api/import/services/route.ts:159` - Hardcoded value
- `lib/validators/csv-import.ts:179-198` - Service import schema

**Documentation:**
- `/docs/stories/epic-5/story-1-service-import-templates.md` - Import functionality
- `/docs/api/import-services.md` - API reference (if exists)

---

## 🟡 Sentry Turbopack Warnings (Cosmetic)

**Symptom:**
```
Package import-in-the-middle can't be external
The request import-in-the-middle matches serverExternalPackages (or the default list).
The request could not be resolved by Node.js from the project directory.
...
Package require-in-the-middle can't be external
The request require-in-the-middle matches serverExternalPackages (or the default list).
...
```

**Status:** ⚠️ **COSMETIC WARNING** - Build succeeds, zero functional impact

**Root Cause:**
- Turbopack cannot resolve Sentry's OpenTelemetry instrumentation dependencies (`import-in-the-middle` and `require-in-the-middle`) as external packages
- These are transitive dependencies of `@sentry/nextjs` via `@opentelemetry/instrumentation`
- Known upstream issue with Next.js 15 + Turbopack + Sentry integration

**Impact:**
- ✅ **NONE** - Sentry error tracking fully functional in all environments
- ✅ Build completes successfully (warnings do not block compilation)
- ⚠️ Cosmetic noise in build output (~15-30 warning lines)

**Verification:**
- ✅ Sentry error tracking works in development and production
- ✅ Build exits with success code (0)
- ✅ No runtime errors or broken functionality

**Upstream Status:**
- GitHub Issue [#15070](https://github.com/getsentry/sentry-javascript/issues/15070): "Figure out a way to silence the import/require-in-the-middle warnings for Turbopack" - **Closed as "not planned"** by Sentry team
- GitHub Issue [#15456](https://github.com/getsentry/sentry-javascript/issues/15456): "Next 15 upgrade causes external warning with require-in-the-middle" - **Closed as "completed"** (marked as duplicate)
- Sentry v9+ changed instrumentation mode but warnings persist with Turbopack

**Resolution:** Not needed - this is a known limitation of Turbopack's strict external package resolution with OpenTelemetry instrumentation. Safe to ignore.

**Alternative Workarounds (Not Recommended):**
1. **pnpm hoisting** (Sentry docs suggest): Add to `.npmrc`:
   ```ini
   public-hoist-pattern[]=*import-in-the-middle*
   public-hoist-pattern[]=*require-in-the-middle*
   ```
   ⚠️ May cause other dependency issues; no guarantee it silences warnings

2. **Install as direct dependencies**: `pnpm add import-in-the-middle require-in-the-middle`
   ⚠️ Doesn't resolve underlying functionality; just masks warnings

**Recommendation:** Ignore warnings - no action required.

**Related Files:**
- `sentry.client.config.ts` - Sentry client configuration
- `sentry.server.config.ts` - Sentry server configuration
- `sentry.edge.config.ts` - Sentry edge runtime configuration

---

## Change Log

| Date | Issue | Action | By |
|------|-------|--------|-----|
| 2025-10-24 | Sentry Turbopack warnings | Documented as cosmetic warning | Dev Team |
| 2025-10-24 | Microsoft OAuth warning | Documented as false positive | Dev Team |
| 2025-10-24 | pricingModel limitation | Documented as known limitation | Dev Team |

---

**Questions or New Issues?**
- Report new issues via GitHub Issues
- Update this document when resolving known issues
- Include: symptom, impact, workaround, and related files
