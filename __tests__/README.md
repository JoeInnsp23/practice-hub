# Testing Documentation

## Overview

Comprehensive programmatic testing for the KYC/AML onboarding system using **Vitest**.

## Test Statistics

- **Total Tests**: 58 passing
- **Test Files**: 5
- **Execution Time**: <3 seconds
- **Coverage Target**: 70%

## Test Structure

```
__tests__/
├── setup.ts                              # Global test configuration
├── mocks/                                # Service mocks
│   ├── lemverify.ts                     # LEM Verify API mock
│   ├── s3.ts                            # AWS S3 SDK mock
│   └── resend.ts                        # Resend email mock
└── README.md                            # This file

lib/
├── config.test.ts                        # Configuration (7 tests)
├── cache.test.ts                         # Caching with TTL (11 tests)
├── rate-limit.test.ts                    # Rate limiting (15 tests)
└── s3/upload.test.ts                     # S3 utilities (9 tests)

app/api/webhooks/lemverify/
└── route.test.ts                         # Webhook handler (16 tests)
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch

# Interactive UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Run Specific Tests

```bash
# Run specific file
pnpm test lib/cache.test.ts

# Run tests matching pattern
pnpm test --grep "rate limit"

# Run single test suite
pnpm test --grep "webhook"
```

## Test Coverage

### Unit Tests (42 tests)

**lib/config.test.ts** (7 tests)
- Environment variable loading
- Fallback to defaults
- Configuration values (SUPPORT_EMAIL, APP_NAME, APP_URL)

**lib/cache.test.ts** (11 tests)
- Store and retrieve values
- TTL expiration
- Manual cache invalidation
- Statistics tracking

**lib/rate-limit.test.ts** (15 tests)
- Allow/block requests based on limit
- Window expiration and reset
- Multiple identifier tracking
- IP extraction from headers
- Reset time formatting

**lib/s3/upload.test.ts** (9 tests)
- S3 key extraction from URLs
- MinIO, presigned, and Hetzner URLs
- Nested paths and special characters
- Error handling

### API Route Tests (16 tests)

**app/api/webhooks/lemverify/route.test.ts** (16 tests)
- Signature verification (HMAC-SHA256)
- Request validation (JSON, required fields)
- HTTP status codes (401, 400, 500, 200)
- Event processing (completed, AML alerts)
- Security (case-sensitive signatures, no info leakage)

## What's Tested

### ✅ Covered

- **Configuration**: Environment variables, defaults
- **Caching**: In-memory cache with TTL, invalidation
- **Rate Limiting**: Request throttling, IP tracking, window expiry
- **S3 Utilities**: URL parsing, key extraction
- **Webhook Security**: Signature verification, validation
- **Error Handling**: HTTP status codes, error messages

### ❌ Not Covered

- **Database Operations**: Tests avoid full database integration
- **External Services**: LEM Verify, Gemini AI, Resend are mocked
- **File Uploads**: FormData testing in Node.js is complex
- **tRPC Routers**: Requires auth context and database mocking
- **Integration Tests**: End-to-end flows with real database

## Service Mocks

### LEM Verify Mock (`__tests__/mocks/lemverify.ts`)

```typescript
import { mockLemverifyClient } from "@/__tests__/mocks/lemverify";

// Mock verification responses
mockLemverifyClient.requestVerification.mockResolvedValue({...});
mockLemverifyClient.getVerificationStatus.mockResolvedValue({...});
```

### S3 Mock (`__tests__/mocks/s3.ts`)

```typescript
import { mockUploadToS3, mockGetPresignedUrl } from "@/__tests__/mocks/s3";

mockUploadToS3.mockResolvedValue("http://localhost:9000/test-bucket/key");
mockGetPresignedUrl.mockResolvedValue("https://presigned-url?expires=3600");
```

### Resend Mock (`__tests__/mocks/resend.ts`)

```typescript
import { mockSendKYCVerificationEmail } from "@/__tests__/mocks/resend";

mockSendKYCVerificationEmail.mockResolvedValue();
```

## Environment Variables

Tests use mock environment variables configured in `__tests__/setup.ts`:

```typescript
process.env.NODE_ENV = "test";
process.env.LEMVERIFY_API_KEY = "test-lemverify-api-key";
process.env.LEMVERIFY_WEBHOOK_SECRET = "test-webhook-secret";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@test.com";
// ... more
```

## Writing New Tests

### Example: Unit Test

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("lib/my-module.ts", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
});
```

### Example: API Route Test

```typescript
import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("app/api/my-route/route.ts", () => {
  it("should validate request", async () => {
    const request = new Request("http://localhost/api/my-route", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
```

## Best Practices

1. **Keep tests isolated**: No database pollution between tests
2. **Use descriptive names**: Test names should explain what's being tested
3. **Test edge cases**: Invalid input, boundary conditions, errors
4. **Mock external services**: Never call real APIs in tests
5. **Fast execution**: All tests should run in <5 seconds
6. **Clear assertions**: One concept per test

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# .github/workflows/test.yml (example)
- name: Run tests
  run: pnpm test

- name: Check coverage
  run: pnpm test:coverage
```

## Troubleshooting

### Tests failing with database errors

**Expected behavior**: Tests don't mock the database, so database connection errors are normal for webhook/upload tests. They still validate request/response flow.

### FormData tests not working

**Known limitation**: Testing multipart/form-data in Node.js requires special tools. Use `supertest` or mock the request body directly.

### Coverage not generated

**Solution**:
```bash
# Install coverage provider
pnpm add -D @vitest/coverage-v8

# Run with coverage
pnpm test:coverage
```

## Future Improvements

- [ ] Add tRPC router tests (requires auth context mocking)
- [ ] Add integration tests with test database
- [ ] Add file upload tests (requires supertest)
- [ ] Increase coverage to >80%
- [ ] Add E2E tests with Playwright
- [ ] Add performance benchmarks

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Service Worker (MSW)](https://mswjs.io/)

## Support

For questions or issues with tests:
1. Check this documentation
2. Run `pnpm test:ui` for interactive debugging
3. Check test output for specific errors
4. Review similar tests for patterns
