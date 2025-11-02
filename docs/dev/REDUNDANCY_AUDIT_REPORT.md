# Redundancy Audit Report

**Generated**: 2025-11-02T22:21:37.375Z

## Summary

| Category | Count |
|----------|-------|
| Unused Files | 0 |
| Unused Exports | 153 |
| Unused Dependencies | 4 |
| **Total Savings** | **157 items** |

## Recommendations

- 📦 Remove 4 unused dependencies: `pnpm remove <dep>`
- 🧹 Clean up 153 unused exports (low priority, check false positives)
- ⚠️ **Always verify before deleting** - run tests after each removal

## Details

### Unused Dependencies

- `@trpc/next`
- `import-in-the-middle`
- `react-email`
- `require-in-the-middle`



### Unused Exports (Top 20)

- lib/auth-client.ts:6 - authClient (used in module)
- lib/client-portal-auth-client.ts:7 - clientPortalAuthClient (used in module)
- lib/console-capture.ts:117 - initConsoleCapture (used in module)
- lib/rate-limit.ts:69 - RateLimitConfig (used in module)
- lib/rate-limit.ts:74 - RateLimitResult (used in module)
- lib/sentry.ts:36 - captureMessage (used in module)
- lib/sentry.ts:96 - addBreadcrumb (used in module)
- __tests__/helpers/trpc.ts:22 - createMockAuthContext (used in module)
- __tests__/helpers/trpc.ts:39 - createMockAdminContext (used in module)
- __tests__/mocks/lemverify.ts:15 - mockVerificationResponse (used in module)
- __tests__/mocks/lemverify.ts:24 - mockVerificationStatusPassed (used in module)
- __tests__/mocks/lemverify.ts:63 - mockVerificationStatusFailed (used in module)
- __tests__/mocks/lemverify.ts:77 - mockVerificationStatusPEPMatch (used in module)
- __tests__/mocks/lemverify.ts:98 - MockLemVerifyClient (used in module)
- __tests__/mocks/lemverify.ts:144 - mockLemverifyClient (used in module)
- __tests__/mocks/resend.ts:11 - mockEmailResponse (used in module)
- __tests__/mocks/resend.ts:32 - mockSendKYCVerificationEmail (used in module)
- __tests__/mocks/s3.ts:16 - MockS3Client (used in module)
- .next/types/routes.d.ts:146 - PageRoutes (used in module)
- .next/types/routes.d.ts:146 - RedirectRoutes (used in module)


...and 30 more


## Actions

1. **Review unused dependencies**: Check if truly unused or used dynamically
2. **Review unused exports**: Remove if confirmed unused, or export for external use
3. **Manual verification required**: Always verify before deleting

## Next Steps

- [ ] Review depcheck report: `cat docs/dev/REDUNDANCY_AUDIT_REPORT.json | jq '.details.unusedDependencies'`
- [ ] Review ts-prune report: `cat docs/dev/REDUNDANCY_AUDIT_REPORT.json | jq '.details.unusedExports'`
- [ ] Create cleanup PR with tested removals
