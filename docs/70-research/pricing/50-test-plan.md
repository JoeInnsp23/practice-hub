# Test Plan: Pricing Engine & Proposal Workflow

**Date:** 2025-10-28
**Version:** 1.0 (Production-Ready Design)
**Purpose:** Comprehensive testing blueprint for pricing engine

---

## Executive Summary

This test plan ensures **90%+ code coverage** and **production readiness** for the pricing engine. All tests must pass before rollout.

**Testing Pyramid:**
- **Unit Tests (70%):** Pricing calculations, auto-service config, utilities
- **Integration Tests (20%):** tRPC routers, database queries, multi-tenancy
- **E2E Tests (10%):** Complete workflows, user journeys

**Quality Gates:**
- ✅ All tests passing (0 failures)
- ✅ Coverage ≥80% overall, ≥90% for pricing logic
- ✅ No critical bugs in E2E tests
- ✅ Performance benchmarks met (<200ms p95 for pricing calculations)

---

## 1. Testing Strategy

### 1.1 Approach

**Test-Driven Development (TDD):**
- Write failing tests first
- Implement minimum code to pass
- Refactor for quality

**Continuous Integration:**
- All tests run on every commit
- Merge blocked if tests fail
- Coverage reports generated automatically

**Test Data Management:**
- Use fixtures for consistent test data
- Separate test database (`practice_hub_test`)
- Reset database before each test suite

### 1.2 Tools

- **Unit Testing:** Vitest (Jest-compatible, fast)
- **Integration Testing:** Vitest + tRPC test client
- **E2E Testing:** Playwright (browser automation)
- **Coverage:** Vitest coverage (c8)
- **Mocking:** vi.fn(), MSW (Mock Service Worker for HTTP)

### 1.3 Test Database

**Setup:**
```bash
# Create test database
createdb practice_hub_test

# Run migrations
DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" pnpm db:push

# Seed test data
DATABASE_URL="postgresql://postgres:password@localhost:5433/practice_hub_test" pnpm db:seed:test
```

**Reset Between Tests:**
```typescript
beforeEach(async () => {
  await db.delete(proposals);
  await db.delete(leads);
  // ... reset other tables
});
```

---

## 2. Unit Tests

### 2.1 Pricing Calculation (Model A)

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('calculateModelA', () => {

  test('calculates price for £0-£89k turnover band', () => {
    const input = {
      turnover: 50000,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.basePrice).toBe(600); // From turnover_band_rules
  });

  test('applies clean complexity multiplier (0.95)', () => {
    const input = {
      turnover: 50000,
      complexity: 'clean' as const,
      industry: 'standard',
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.finalPrice).toBe(600 * 0.95); // £570
  });

  test('applies disaster complexity multiplier (1.4)', () => {
    const input = {
      turnover: 50000,
      complexity: 'disaster' as const,
      industry: 'standard',
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.finalPrice).toBe(600 * 1.4); // £840
  });

  test('applies regulated industry multiplier (1.3)', () => {
    const input = {
      turnover: 50000,
      complexity: 'average' as const,
      industry: 'financial_services', // Maps to 'regulated'
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.finalPrice).toBe(600 * 1.0 * 1.3); // £780
  });

  test('combines complexity and industry multipliers', () => {
    const input = {
      turnover: 50000,
      complexity: 'complex' as const,
      industry: 'ecommerce', // Maps to 'complex'
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.finalPrice).toBe(600 * 1.15 * 1.15); // £793.50
  });

  test('handles £1m+ turnover band (open-ended)', () => {
    const input = {
      turnover: 2500000,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'COMP_ACCOUNTS', code: 'COMP_ACCOUNTS' }
    };
    const result = calculateModelA(input);
    expect(result.basePrice).toBe(3750); // £1m+ band
  });

  test('throws error if no pricing rule found', () => {
    const input = {
      turnover: 50000,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'UNKNOWN_SERVICE', code: 'UNKNOWN' }
    };
    expect(() => calculateModelA(input)).toThrow('No pricing rule found');
  });

});
```

**Coverage Target:** 100% (all branches)

---

### 2.2 Pricing Calculation (Model B)

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('calculateModelB', () => {

  test('calculates price for low transaction band (0-100)', () => {
    const input = {
      monthlyTransactions: 75,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'BOOK_FULL', code: 'BOOK_FULL' }
    };
    const result = calculateModelB(input);
    // Base £100 + (75 * £0.50) = £137.50
    expect(result.basePrice).toBe(137.50);
  });

  test('calculates price for high transaction band (301-500)', () => {
    const input = {
      monthlyTransactions: 400,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'BOOK_FULL', code: 'BOOK_FULL' }
    };
    const result = calculateModelB(input);
    // Base £250 + (150 * £1.00) = £400 (150 txn over 250 base)
    expect(result.basePrice).toBe(400);
  });

  test('applies lower complexity multiplier for Model B (clean: 0.98)', () => {
    const input = {
      monthlyTransactions: 50,
      complexity: 'clean' as const,
      industry: 'standard',
      service: { id: 'BOOK_FULL', code: 'BOOK_FULL' }
    };
    const result = calculateModelB(input);
    // (£100 + £25) * 0.98 = £122.50
    expect(result.finalPrice).toBeCloseTo(122.50, 2);
  });

  test('applies lower complexity multiplier for Model B (disaster: 1.2)', () => {
    const input = {
      monthlyTransactions: 50,
      complexity: 'disaster' as const,
      industry: 'standard',
      service: { id: 'BOOK_FULL', code: 'BOOK_FULL' }
    };
    const result = calculateModelB(input);
    // (£100 + £25) * 1.2 = £150
    expect(result.finalPrice).toBe(150);
  });

  test('fallback to Model A if service does not support Model B', () => {
    const input = {
      monthlyTransactions: 100,
      turnover: 50000,
      complexity: 'average' as const,
      industry: 'standard',
      service: { id: 'SATR_SINGLE', code: 'SATR_SINGLE' } // No Model B
    };
    const result = calculateModelB(input);
    expect(result.fallbackToModelA).toBe(true);
    expect(result.basePrice).toBe(180); // SATR_SINGLE fixed price
  });

});
```

**Coverage Target:** 100%

---

### 2.3 Model Comparison Logic

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('compareModels', () => {

  test('recommends Model A if Model B data unavailable', () => {
    const modelA = 600;
    const modelB = null;
    const result = compareModels(modelA, modelB);
    expect(result.recommendedModel).toBe('A');
    expect(result.reason).toContain('Model B data not available');
  });

  test('recommends Model A if difference < 10%', () => {
    const modelA = 600;
    const modelB = 620; // 3.3% difference
    const result = compareModels(modelA, modelB);
    expect(result.recommendedModel).toBe('A');
    expect(result.reason).toContain('within 10%');
  });

  test('recommends Model B if cheaper by >10%', () => {
    const modelA = 600;
    const modelB = 480; // 20% savings
    const result = compareModels(modelA, modelB);
    expect(result.recommendedModel).toBe('B');
    expect(result.savings).toBe(120);
    expect(result.savingsPercent).toBe(20);
  });

  test('recommends Model A if cheaper by >10%', () => {
    const modelA = 480;
    const modelB = 600; // 20% savings with Model A
    const result = compareModels(modelA, modelB);
    expect(result.recommendedModel).toBe('A');
    expect(result.savings).toBe(120);
    expect(result.savingsPercent).toBe(20);
  });

});
```

**Coverage Target:** 100%

---

### 2.4 Transaction Estimation

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('estimateTransactions', () => {

  test('estimates from £0-£89k turnover band', () => {
    const result = estimateTransactions({
      turnover: 50000,
      industry: 'standard',
      vatRegistered: false
    });
    expect(result).toBe(35); // Base for £0-£89k
  });

  test('applies ecommerce industry multiplier (2.0)', () => {
    const result = estimateTransactions({
      turnover: 150000,
      industry: 'ecommerce',
      vatRegistered: false
    });
    // Base £150k-£249k: 80 * 2.0 = 160
    expect(result).toBe(160);
  });

  test('applies VAT registered multiplier (1.2)', () => {
    const result = estimateTransactions({
      turnover: 150000,
      industry: 'standard',
      vatRegistered: true
    });
    // Base 80 * 1.0 (standard) * 1.2 (VAT) = 96
    expect(result).toBe(96);
  });

  test('combines industry and VAT multipliers', () => {
    const result = estimateTransactions({
      turnover: 150000,
      industry: 'ecommerce',
      vatRegistered: true
    });
    // Base 80 * 2.0 (ecommerce) * 1.2 (VAT) = 192
    expect(result).toBe(192);
  });

});
```

**Coverage Target:** 100%

---

### 2.5 Payroll Pricing

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('calculatePayrollPrice', () => {

  test('calculates director-only pricing (0-2 employees)', () => {
    const result = calculatePayrollPrice(2, 'monthly');
    expect(result).toBe(18);
  });

  test('calculates small team pricing (3-5 employees)', () => {
    const result = calculatePayrollPrice(5, 'monthly');
    expect(result).toBe(50);
  });

  test('calculates enterprise pricing (21+ employees)', () => {
    const result = calculatePayrollPrice(25, 'monthly');
    // £130 base + (5 * £2) = £140
    expect(result).toBe(140);
  });

  test('applies weekly frequency multiplier (3x)', () => {
    const result = calculatePayrollPrice(5, 'weekly');
    // £50 base * 3 = £150
    expect(result).toBe(150);
  });

  test('applies fortnightly frequency multiplier (2x)', () => {
    const result = calculatePayrollPrice(5, 'fortnightly');
    // £50 base * 2 = £100
    expect(result).toBe(100);
  });

});
```

**Coverage Target:** 100%

---

### 2.6 Discounts & Surcharges

**File:** `app/server/routers/pricing.test.ts`

**Test Cases:**

```typescript
describe('applyDiscounts', () => {

  test('applies 5% volume discount for £500-£999/month', () => {
    const totalMonthly = 750;
    const discount = calculateVolumeDiscount(totalMonthly);
    expect(discount).toBe(0.05);
  });

  test('applies 8% volume discount for £1000+/month', () => {
    const totalMonthly = 1200;
    const discount = calculateVolumeDiscount(totalMonthly);
    expect(discount).toBe(0.08);
  });

  test('applies 10% new client discount', () => {
    const clientTenure = 6; // months
    const discount = calculateNewClientDiscount(clientTenure);
    expect(discount).toBe(0.10);
  });

  test('does not apply new client discount after 12 months', () => {
    const clientTenure = 13; // months
    const discount = calculateNewClientDiscount(clientTenure);
    expect(discount).toBe(0);
  });

});

describe('applySurcharges', () => {

  test('adds £25 multi-currency surcharge', () => {
    const basePrice = 300;
    const surcharge = applyMultiCurrencySurcharge(true, basePrice);
    expect(surcharge).toBe(25);
  });

  test('adds £90 multi-entity surcharge (3-5 entities)', () => {
    const entityCount = 4;
    const surcharge = applyMultiEntitySurcharge(entityCount);
    expect(surcharge).toBe(90);
  });

});
```

**Coverage Target:** 100%

---

### 2.7 Auto-Service Configuration (Phase 2)

**File:** `app/server/utils/auto-service-config.test.ts`

**Test Cases:**

```typescript
describe('autoMapLeadToServices', () => {

  test('adds Annual Accounts if interested in COMP_ACCOUNTS', async () => {
    const lead = {
      interestedServices: ['COMP_ACCOUNTS'],
      estimatedTurnover: 100000,
      industry: 'standard'
    };
    const services = await autoMapLeadToServices(lead);
    expect(services).toContainEqual(
      expect.objectContaining({ serviceId: 'COMP_ACCOUNTS' })
    );
  });

  test('adds Payroll if estimated employees > 0', async () => {
    const lead = {
      estimatedEmployees: 5,
      payrollFrequency: 'monthly'
    };
    const services = await autoMapLeadToServices(lead);
    expect(services).toContainEqual(
      expect.objectContaining({
        serviceId: 'PAYROLL_STANDARD',
        config: { employees: 5, frequency: 'monthly' }
      })
    );
  });

  test('adds Rental Properties addon if property count > 0', async () => {
    const lead = { propertyCount: 3 };
    const services = await autoMapLeadToServices(lead);
    expect(services).toContainEqual(
      expect.objectContaining({
        serviceId: 'ADDON_RENTAL',
        config: { properties: 3 }
      })
    );
  });

  test('adds VAT Returns if VAT registered', async () => {
    const lead = { vatRegistered: true };
    const services = await autoMapLeadToServices(lead);
    expect(services).toContainEqual(
      expect.objectContaining({ serviceId: 'VAT_RETURNS' })
    );
  });

  test('estimates bookkeeping level from transactions', async () => {
    const lead = {
      interestedServices: ['BOOK_BASIC'],
      monthlyTransactions: 250
    };
    const services = await autoMapLeadToServices(lead);
    expect(services).toContainEqual(
      expect.objectContaining({
        serviceId: 'BOOK_FULL', // >100 transactions
        config: expect.objectContaining({ transactions: 250 })
      })
    );
  });

});

describe('estimateComplexity', () => {

  test('returns clean for well-maintained books + Xero', () => {
    const lead = {
      booksCondition: 'clean',
      currentAccountingSoftware: 'xero',
      monthlyTransactions: 50,
      hasMultipleCurrencies: false,
      hasMultipleEntities: false
    };
    const result = estimateComplexity(lead);
    expect(result).toBe('clean');
  });

  test('returns disaster for no books + no software', () => {
    const lead = {
      booksCondition: 'disaster',
      currentAccountingSoftware: 'none',
      monthlyTransactions: 400,
      hasMultipleCurrencies: true,
      hasMultipleEntities: true
    };
    const result = estimateComplexity(lead);
    expect(result).toBe('disaster');
  });

  test('upgrades complexity by 1 level if multi-currency', () => {
    const lead = {
      booksCondition: 'clean',
      currentAccountingSoftware: 'xero',
      monthlyTransactions: 50,
      hasMultipleCurrencies: true, // Should bump to 'average'
      hasMultipleEntities: false
    };
    const result = estimateComplexity(lead);
    expect(result).toBe('average');
  });

});
```

**Coverage Target:** ≥90%

---

## 3. Integration Tests

### 3.1 tRPC Pricing Router

**File:** `app/server/routers/pricing.integration.test.ts`

**Test Cases:**

```typescript
describe('pricing.calculate', () => {

  test('calculates full pricing with all modifiers', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    const result = await caller.pricing.calculate({
      turnover: 150000,
      complexity: 'complex',
      industry: 'ecommerce',
      services: [
        { serviceId: 'COMP_ACCOUNTS', quantity: 1 },
        { serviceId: 'VAT_RETURNS', quantity: 1 },
        { serviceId: 'PAYROLL_STANDARD', quantity: 1, employees: 5 }
      ],
      discounts: [
        { type: 'volume', value: 0.05 }
      ]
    });

    expect(result.services).toHaveLength(3);
    expect(result.totals.subtotal).toBeGreaterThan(0);
    expect(result.totals.discount).toBeGreaterThan(0);
    expect(result.totals.total).toBeLessThan(result.totals.subtotal);
  });

  test('returns Model B price for high transaction volume', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    const result = await caller.pricing.calculate({
      turnover: 150000,
      complexity: 'average',
      industry: 'ecommerce',
      services: [
        {
          serviceId: 'BOOK_FULL',
          quantity: 1,
          monthlyTransactions: 400
        }
      ]
    });

    expect(result.services[0].priceB).toBeDefined();
    expect(result.recommendation.model).toBeDefined();
  });

});
```

**Coverage Target:** ≥85%

---

### 3.2 tRPC Proposals Router

**File:** `app/server/routers/proposals.integration.test.ts`

**Test Cases:**

```typescript
describe('proposals.createFromLead', () => {

  test('creates proposal from lead with manual service selection', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    // Create lead first
    const lead = await caller.leads.create({
      companyName: 'Test Company Ltd',
      email: 'test@example.com',
      estimatedTurnover: 100000,
      industry: 'retail'
    });

    // Create proposal from lead
    const proposal = await caller.proposals.createFromLead({
      leadId: lead.id,
      services: [
        { serviceId: 'COMP_ACCOUNTS', quantity: 1, frequency: 'annual' },
        { serviceId: 'VAT_RETURNS', quantity: 1, frequency: 'quarterly' }
      ],
      validUntil: addDays(new Date(), 30)
    });

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.status).toBe('draft');

    // Verify proposal services created
    const proposalData = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposal.proposalId),
      with: { proposalServices: true }
    });

    expect(proposalData.proposalServices).toHaveLength(2);
  });

  test('throws error if required fields missing', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    await expect(
      caller.proposals.createFromLead({
        leadId: 'non-existent-lead',
        services: []
      })
    ).rejects.toThrow();
  });

});

describe('proposals.update', () => {

  test('creates version snapshot before updating', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    // Create proposal
    const proposal = await caller.proposals.createFromLead({...});

    // Update proposal
    await caller.proposals.update({
      proposalId: proposal.proposalId,
      services: [
        { serviceId: 'COMP_ACCOUNTS', quantity: 1, frequency: 'annual' },
        { serviceId: 'SATR_SINGLE', quantity: 1, frequency: 'annual' } // Added
      ]
    });

    // Verify version created
    const versions = await db.query.proposalVersions.findMany({
      where: eq(proposalVersions.proposalId, proposal.proposalId)
    });

    expect(versions).toHaveLength(1);
    expect(versions[0].versionNumber).toBe(1);
  });

});

describe('proposals.sendForSignature', () => {

  test('sends proposal via DocuSeal', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    // Mock DocuSeal API
    const mockDocuSeal = vi.fn().mockResolvedValue({
      id: 'docuseal_submission_123',
      status: 'pending'
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: mockDocuSeal
    });

    // Create proposal
    const proposal = await caller.proposals.createFromLead({...});

    // Send for signature
    const result = await caller.proposals.sendForSignature({
      proposalId: proposal.proposalId
    });

    expect(result.success).toBe(true);
    expect(result.submissionId).toBe('docuseal_submission_123');

    // Verify proposal status updated
    const proposalData = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposal.proposalId)
    });

    expect(proposalData.status).toBe('sent');
    expect(proposalData.docusealSubmissionId).toBe('docuseal_submission_123');
    expect(proposalData.sentAt).toBeDefined();
  });

  test('throws error if proposal already sent', async () => {
    const caller = createCaller({ authContext: testAuthContext });

    const proposal = await caller.proposals.createFromLead({...});
    await caller.proposals.sendForSignature({ proposalId: proposal.proposalId });

    // Try to send again
    await expect(
      caller.proposals.sendForSignature({ proposalId: proposal.proposalId })
    ).rejects.toThrow('already been sent');
  });

});
```

**Coverage Target:** ≥85%

---

### 3.3 Multi-Tenancy Isolation

**File:** `app/server/routers/multi-tenancy.integration.test.ts`

**Test Cases:**

```typescript
describe('Multi-Tenancy Isolation', () => {

  test('tenant A cannot access tenant B pricing rules', async () => {
    const tenantA = createTestTenant({ name: 'Tenant A' });
    const tenantB = createTestTenant({ name: 'Tenant B' });

    const callerA = createCaller({ authContext: { tenantId: tenantA.id } });
    const callerB = createCaller({ authContext: { tenantId: tenantB.id } });

    // Create pricing rule for tenant A
    await db.insert(pricingRules).values({
      tenantId: tenantA.id,
      serviceId: 'COMP_ACCOUNTS',
      ruleType: 'turnover_band',
      price: 999 // Custom price for tenant A
    });

    // Tenant B should not see tenant A's custom rule
    const resultB = await callerB.pricing.calculate({
      turnover: 100000,
      complexity: 'average',
      industry: 'standard',
      services: [{ serviceId: 'COMP_ACCOUNTS', quantity: 1 }]
    });

    expect(resultB.services[0].priceA).not.toBe(999);
  });

  test('tenant A cannot access tenant B proposals', async () => {
    const tenantA = createTestTenant({ name: 'Tenant A' });
    const tenantB = createTestTenant({ name: 'Tenant B' });

    const callerA = createCaller({ authContext: { tenantId: tenantA.id } });
    const callerB = createCaller({ authContext: { tenantId: tenantB.id } });

    // Create proposal for tenant B
    const proposalB = await callerB.proposals.createFromLead({...});

    // Tenant A tries to access tenant B's proposal
    await expect(
      callerA.proposals.getById({ proposalId: proposalB.proposalId })
    ).rejects.toThrow('Proposal not found');
  });

});
```

**Coverage Target:** 100% (critical security requirement)

---

## 4. E2E Tests (Playwright)

### 4.1 Lead to Client Workflow

**File:** `e2e/pricing-workflow.spec.ts`

**Test Scenario:**

```typescript
test('complete lead-to-client workflow', async ({ page }) => {

  // 1. Login as staff
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'staff@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/practice-hub');

  // 2. Create new lead
  await page.click('a[href="/practice-hub/leads"]');
  await page.click('button:has-text("New Lead")');
  await page.fill('input[name="companyName"]', 'E2E Test Company Ltd');
  await page.fill('input[name="email"]', 'e2e@test.com');
  await page.fill('input[name="phone"]', '01234567890');
  await page.fill('input[name="estimatedTurnover"]', '150000');
  await page.selectOption('select[name="industry"]', 'retail');
  await page.fill('input[name="estimatedEmployees"]', '5');
  await page.click('button:has-text("Save Lead")');

  // 3. Create proposal from lead
  await page.click('button:has-text("Create Proposal")');
  await page.waitForSelector('h1:has-text("New Proposal")');

  // Select services
  await page.check('input[value="COMP_ACCOUNTS"]');
  await page.check('input[value="VAT_RETURNS"]');
  await page.check('input[value="PAYROLL_STANDARD"]');

  // Configure payroll
  await page.fill('input[name="payroll_employees"]', '5');
  await page.selectOption('select[name="payroll_frequency"]', 'monthly');

  // Save proposal
  await page.click('button:has-text("Save Proposal")');
  await expect(page).toHaveURL(/\/proposals\/.+/);

  // 4. Verify pricing displayed
  const totalElement = await page.locator('[data-testid="proposal-total"]');
  await expect(totalElement).toBeVisible();
  const total = await totalElement.textContent();
  expect(total).toMatch(/£[\d,]+/);

  // 5. Send for signature
  await page.click('button:has-text("Send for Signature")');
  await expect(page.locator('.toast:has-text("Proposal sent")')).toBeVisible();

  // 6. Mock: Client signs proposal (webhook callback)
  await mockDocuSealWebhook({
    event_type: 'submission.completed',
    data: {
      id: 'docuseal_submission_123',
      completed_at: new Date().toISOString()
    }
  });

  // 7. Verify proposal status updated
  await page.reload();
  await expect(page.locator('[data-testid="proposal-status"]')).toHaveText('Signed');

  // 8. Convert to client
  await page.click('button:has-text("Convert to Client")');
  await expect(page).toHaveURL(/\/clients\/.+/);
  await expect(page.locator('h1')).toContainText('E2E Test Company Ltd');

  // 9. Verify client services created
  await page.click('a[href*="/services"]');
  await expect(page.locator('tr:has-text("Annual Accounts")')).toBeVisible();
  await expect(page.locator('tr:has-text("VAT Returns")')).toBeVisible();
  await expect(page.locator('tr:has-text("Payroll")')).toBeVisible();

});
```

**Coverage:** End-to-end happy path

---

### 4.2 Auto-Service Configuration (Phase 2)

**File:** `e2e/auto-config-workflow.spec.ts`

**Test Scenario:**

```typescript
test('auto-configure proposal from lead data', async ({ page }) => {

  // 1. Login
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'staff@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Create lead with complete data
  await page.goto('/practice-hub/leads/new');
  await page.fill('input[name="companyName"]', 'Auto-Config Test Ltd');
  await page.fill('input[name="estimatedTurnover"]', '200000');
  await page.fill('input[name="estimatedEmployees"]', '8');
  await page.fill('input[name="monthlyTransactions"]', '350');
  await page.check('input[name="vatRegistered"]');
  await page.fill('input[name="propertyCount"]', '2');
  await page.selectOption('select[name="booksCondition"]', 'average');
  await page.click('button:has-text("Save Lead")');

  // 3. Create proposal (auto-config)
  await page.click('button:has-text("Create Proposal (Auto)")');
  await page.waitForSelector('h1:has-text("New Proposal")');

  // 4. Verify services auto-selected
  await expect(page.locator('input[value="COMP_ACCOUNTS"]:checked')).toBeVisible();
  await expect(page.locator('input[value="VAT_RETURNS"]:checked')).toBeVisible();
  await expect(page.locator('input[value="PAYROLL_STANDARD"]:checked')).toBeVisible();
  await expect(page.locator('input[value="ADDON_RENTAL"]:checked')).toBeVisible();

  // 5. Verify payroll configured
  const employeesInput = page.locator('input[name="payroll_employees"]');
  await expect(employeesInput).toHaveValue('8');

  // 6. Verify rental properties configured
  const propertiesInput = page.locator('input[name="rental_properties"]');
  await expect(propertiesInput).toHaveValue('2');

  // 7. Verify pricing calculated
  const totalElement = page.locator('[data-testid="proposal-total"]');
  await expect(totalElement).toBeVisible();

});
```

**Coverage:** Auto-service configuration feature

---

### 4.3 Pricing Preview (Phase 3)

**File:** `e2e/pricing-preview.spec.ts`

**Test Scenario:**

```typescript
test('pricing preview updates in real-time', async ({ page }) => {

  // 1. Visit lead capture form
  await page.goto('/leads/new');

  // 2. Fill turnover
  await page.fill('input[name="estimatedTurnover"]', '100000');

  // 3. Verify pricing preview appears
  const previewElement = page.locator('[data-testid="pricing-preview"]');
  await expect(previewElement).toBeVisible();
  await expect(previewElement).toContainText('Estimated monthly cost');

  // 4. Select services
  await page.check('label:has-text("Annual Accounts")');
  await page.check('label:has-text("VAT Returns")');

  // 5. Verify pricing updates
  await expect(previewElement).toContainText('£'); // Has price
  const initialPrice = await previewElement.textContent();

  // 6. Add more services
  await page.check('label:has-text("Payroll")');
  await page.fill('input[name="estimatedEmployees"]', '10');

  // 7. Verify pricing increased
  await page.waitForTimeout(500); // Debounce
  const updatedPrice = await previewElement.textContent();
  expect(updatedPrice).not.toBe(initialPrice);

  // 8. Submit form
  await page.fill('input[name="companyName"]', 'Pricing Preview Test Ltd');
  await page.fill('input[name="email"]', 'preview@test.com');
  await page.click('button:has-text("Get Accurate Quote")');

  // 9. Verify lead created with pricing estimate
  await expect(page).toHaveURL(/\/leads\/.+/);
  await expect(page.locator('[data-testid="estimated-price"]')).toBeVisible();

});
```

**Coverage:** Pricing preview feature

---

## 5. Test Data Fixtures

### 5.1 Test Tenants

**File:** `tests/fixtures/tenants.ts`

```typescript
export const testTenants = {
  acme: {
    id: 'tenant_acme',
    name: 'Acme Accountancy Ltd',
    slug: 'acme',
    status: 'active'
  },
  beta: {
    id: 'tenant_beta',
    name: 'Beta Accounting',
    slug: 'beta',
    status: 'active'
  }
};
```

---

### 5.2 Test Leads

**File:** `tests/fixtures/leads.ts`

```typescript
export const testLeads = {
  soloDirector: {
    companyName: 'Solo Ltd',
    email: 'director@solo.com',
    estimatedTurnover: 45000,
    estimatedEmployees: 0,
    industry: 'consulting',
    interestedServices: ['COMP_ACCOUNTS', 'SATR_SINGLE']
  },
  smallTeam: {
    companyName: 'Small Team Ltd',
    email: 'admin@smallteam.com',
    estimatedTurnover: 250000,
    estimatedEmployees: 5,
    monthlyTransactions: 120,
    vatRegistered: true,
    industry: 'retail',
    interestedServices: ['COMP_ACCOUNTS', 'VAT_RETURNS', 'PAYROLL_STANDARD', 'BOOK_BASIC']
  },
  ecommerce: {
    companyName: 'Ecommerce Ltd',
    email: 'admin@ecommerce.com',
    estimatedTurnover: 500000,
    estimatedEmployees: 10,
    monthlyTransactions: 800,
    vatRegistered: true,
    industry: 'ecommerce',
    booksCondition: 'complex',
    hasMultipleCurrencies: true,
    interestedServices: ['COMP_ACCOUNTS', 'VAT_RETURNS', 'PAYROLL_STANDARD', 'BOOK_FULL', 'MGMT_MONTHLY']
  }
};
```

---

### 5.3 Test Services

**File:** `tests/fixtures/services.ts`

```typescript
export const testServices = [
  {
    id: 'COMP_ACCOUNTS',
    code: 'COMP_ACCOUNTS',
    name: 'Annual Accounts & Corporation Tax',
    category: 'compliance'
  },
  {
    id: 'VAT_RETURNS',
    code: 'VAT_RETURNS',
    name: 'VAT Returns (Quarterly)',
    category: 'vat'
  },
  {
    id: 'PAYROLL_STANDARD',
    code: 'PAYROLL_STANDARD',
    name: 'Standard Payroll Processing',
    category: 'payroll'
  }
  // ... all 18 services
];
```

---

## 6. Coverage Targets

### 6.1 Overall Coverage

- **Target:** ≥80% line coverage, ≥75% branch coverage
- **Critical Code:** ≥90% coverage for pricing logic, auto-service config

### 6.2 Per-Module Targets

| Module | Line Coverage | Branch Coverage |
|--------|---------------|-----------------|
| `pricing.ts` (router) | ≥90% | ≥85% |
| `proposals.ts` (router) | ≥85% | ≥80% |
| `auto-service-config.ts` | ≥90% | ≥85% |
| `estimate-complexity.ts` | ≥90% | ≥85% |
| Webhooks (`docuseal/route.ts`) | ≥80% | ≥75% |

### 6.3 Coverage Reports

**Generate Reports:**
```bash
pnpm test:coverage
```

**View HTML Report:**
```bash
open coverage/index.html
```

**CI Integration:** Coverage reports uploaded to Codecov or similar service

---

## 7. Quality Gates

### 7.1 Pre-Merge Gates

- ✅ All tests passing (0 failures)
- ✅ Coverage ≥80% overall
- ✅ No critical bugs in E2E tests
- ✅ Linter passing (Biome)
- ✅ Type check passing (TypeScript)

### 7.2 Pre-Deployment Gates

- ✅ All quality gates passed
- ✅ E2E tests passing on staging environment
- ✅ Performance benchmarks met (<200ms p95 for pricing calculations)
- ✅ Security scan passed (no high/critical vulnerabilities)

---

## 8. Regression Test Suite

### 8.1 Critical Path Tests

**Must Run Before Every Release:**

1. **Pricing Calculation Accuracy**
   - All turnover bands calculate correctly
   - All complexity/industry multipliers apply correctly
   - Model comparison logic works

2. **Proposal Workflow**
   - Create proposal from lead
   - Update proposal (versioning)
   - Send for signature
   - Convert to client

3. **Multi-Tenancy Isolation**
   - Tenant A cannot access tenant B data
   - All queries scoped to correct tenant

4. **DocuSeal Integration**
   - Webhook signature verification
   - Proposal status updates on webhook events

### 8.2 Performance Benchmarks

**Run Before Every Release:**

```typescript
test('pricing calculation performance', async () => {
  const start = performance.now();

  for (let i = 0; i < 100; i++) {
    await calculatePricing({
      turnover: 150000,
      complexity: 'average',
      industry: 'standard',
      services: [
        { serviceId: 'COMP_ACCOUNTS', quantity: 1 },
        { serviceId: 'VAT_RETURNS', quantity: 1 },
        { serviceId: 'PAYROLL_STANDARD', quantity: 1, employees: 5 }
      ]
    });
  }

  const end = performance.now();
  const avgTime = (end - start) / 100;

  expect(avgTime).toBeLessThan(200); // <200ms average
});
```

---

## References

- **Pricing Model:** `30-pricing-model.md`
- **Quote Workflow:** `40-quote-workflow.md`
- **Service Alignment:** `15-service-alignment-matrix.md`
- **Readiness Checklist:** `45-readiness-checklist.md`
- **Rollout Plan:** `70-rollout-plan.md`

---

**End of Test Plan**
