/**
 * Global Test Setup
 *
 * Runs before all tests to configure the test environment.
 */

import { afterAll, afterEach, beforeAll } from "vitest";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:PgHub2024SecureDB9kL@localhost:5432/practice_hub";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-auth";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "http://localhost:3000";

// Mock environment variables for external services
process.env.LEMVERIFY_API_KEY = "test-lemverify-api-key";
process.env.LEMVERIFY_ACCOUNT_ID = "test-account-id";
process.env.LEMVERIFY_WEBHOOK_SECRET = "test-webhook-secret";
process.env.RESEND_API_KEY = "test-resend-api-key";
process.env.RESEND_FROM_EMAIL = "test@example.com";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-gemini-api-key";
process.env.S3_ENDPOINT = "http://localhost:9000";
process.env.S3_ACCESS_KEY_ID = "minioadmin";
process.env.S3_SECRET_ACCESS_KEY = "minioadmin";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.S3_REGION = "us-east-1";
process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@test.com";
process.env.DOCUSEAL_API_KEY = "test-docuseal-api-key";
process.env.XERO_CLIENT_ID = "test-xero-client-id";
process.env.XERO_CLIENT_SECRET = "test-xero-client-secret";
process.env.XERO_REDIRECT_URI = "http://localhost:3000/api/xero/callback";

// Suppress console output during tests (uncomment to reduce noise)
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
// };

beforeAll(async () => {
  console.log("🧪 Test setup initialized");
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(async () => {
  console.log("✅ Test teardown complete");
});
