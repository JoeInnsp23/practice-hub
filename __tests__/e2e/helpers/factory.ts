import { nanoid } from "nanoid";

/**
 * Test data factory for E2E tests
 * Generates unique test data with E2E-Test- prefix for easy cleanup
 */

export interface TestClientData {
  name: string;
  type: "individual" | "sole_trader" | "partnership" | "limited_company";
  email: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
}

/**
 * Create a unique test client with E2E-Test- prefix
 */
export function createTestClient(baseName?: string): TestClientData {
  const timestamp = Date.now();
  const uniqueId = nanoid(6);
  const name = baseName || "Test Client";

  return {
    name: `E2E-Test-${name}-${uniqueId}`,
    type: "limited_company",
    email: `e2e-test-client-${timestamp}@example.com`,
    contactFirstName: "E2E",
    contactLastName: `Contact-${uniqueId}`,
    contactEmail: `e2e-test-contact-${timestamp}@example.com`,
  };
}

/**
 * Create a unique test task with E2E-Test- prefix
 */
export function createTestTask() {
  const uniqueId = nanoid(6);

  return {
    title: `E2E-Test-Task-${uniqueId}`,
    description: `E2E test task created at ${new Date().toISOString()}`,
    priority: "medium" as const,
    status: "pending" as const,
  };
}

/**
 * Create a unique test invoice with E2E-Test- prefix
 */
export function createTestInvoice() {
  const uniqueId = nanoid(6);

  return {
    invoiceNumber: `E2E-TEST-INV-${uniqueId}`,
    description: `E2E test invoice ${uniqueId}`,
  };
}
