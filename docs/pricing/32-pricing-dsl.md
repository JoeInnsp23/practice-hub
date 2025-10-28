# Pricing DSL: Human-Readable Pricing Logic

**Date:** 2025-10-28
**Version:** 1.0 (Production-Ready Design)
**Purpose:** Lightweight domain-specific language for expressing pricing rules

---

## Executive Summary

This DSL (Domain-Specific Language) provides a **human-readable** way to express pricing logic that can be:
- Read and validated by non-technical stakeholders
- Converted to/from machine-readable JSON configs
- Used for documentation, testing, and communication
- Gradually adopted alongside existing JSON configuration

**When to Use DSL vs JSON:**
- **DSL:** Business rule documentation, stakeholder communication, pricing audits
- **JSON:** Runtime configuration, API contracts, automated testing

---

## Grammar Specification

### Core Syntax

```ebnf
PricingRule     ::= ServiceDef | ModifierDef | DiscountDef | SurchargeDef
ServiceDef      ::= "SERVICE" ServiceCode "{" ServiceBody "}"
ServiceBody     ::= (Property | PricingLogic)*
PricingLogic    ::= "PRICING" "{" PricingRule+ "}"
PricingRule     ::= ConditionRule | BandRule | TierRule | FixedRule
ConditionRule   ::= "IF" Condition "THEN" Action
BandRule        ::= "BAND" BandLabel "FROM" Number "TO" (Number | "∞") "PRICE" Price
TierRule        ::= "TIER" TierLabel "WHEN" Condition "RATE" Rate
FixedRule       ::= "FIXED" Price ("PER" Unit)?
ModifierDef     ::= "MODIFIER" ModifierName "MULTIPLIER" Number ("WHEN" Condition)?
DiscountDef     ::= "DISCOUNT" DiscountName "AMOUNT" (Percentage | Number) ("WHEN" Condition)?
SurchargeDef    ::= "SURCHARGE" SurchargeName "AMOUNT" Number ("WHEN" Condition)?
Condition       ::= Expression (("AND" | "OR") Expression)*
Expression      ::= Field Operator Value
Operator        ::= "=" | ">" | "<" | ">=" | "<=" | "IN" | "BETWEEN"
Action          ::= "APPLY" (Modifier | Discount | Surcharge | Price)
```

### Keywords

**Reserved Keywords:**
- `SERVICE`, `PRICING`, `BAND`, `TIER`, `FIXED`
- `IF`, `THEN`, `WHEN`, `APPLY`
- `FROM`, `TO`, `PRICE`, `RATE`, `PER`
- `MODIFIER`, `MULTIPLIER`, `DISCOUNT`, `SURCHARGE`, `AMOUNT`
- `AND`, `OR`, `IN`, `BETWEEN`

**Data Types:**
- `Number`: Integer or decimal (e.g., `100`, `1.5`, `0.95`)
- `Price`: Currency value in GBP (e.g., `£300`, `£1,500.50`)
- `Percentage`: Decimal with `%` suffix (e.g., `5%`, `10%`, `1.25%`)
- `String`: Quoted text (e.g., `"clean"`, `"monthly"`)
- `Boolean`: `true` | `false`

---

## Service Definition Examples

### Example 1: Fixed-Price Service

```dsl
SERVICE CONF_STATEMENT {
  name: "Confirmation Statement"
  category: "compliance"
  frequency: "annual"

  PRICING {
    FIXED £50
  }
}
```

**Equivalent JSON:**
```json
{
  "id": "CONF_STATEMENT",
  "name": "Confirmation Statement",
  "category": "compliance",
  "defaultFrequency": "annual",
  "baseRate": 50
}
```

---

### Example 2: Turnover Band Pricing

```dsl
SERVICE COMP_ACCOUNTS {
  name: "Annual Accounts & Corporation Tax"
  category: "compliance"
  frequency: "annual"
  drivers: ["turnover_band", "complexity_level", "industry"]

  PRICING {
    BAND "0-89k" FROM £0 TO £89,999 PRICE £600
    BAND "90k-149k" FROM £90,000 TO £149,999 PRICE £780
    BAND "150k-249k" FROM £150,000 TO £249,999 PRICE £900
    BAND "250k-499k" FROM £250,000 TO £499,999 PRICE £1,080
    BAND "500k-749k" FROM £500,000 TO £749,999 PRICE £1,365
    BAND "750k-999k" FROM £750,000 TO £999,999 PRICE £1,680
    BAND "1m+" FROM £1,000,000 TO ∞ PRICE £3,750

    IF complexity = "clean" THEN APPLY MODIFIER complexity_clean
    IF complexity = "average" THEN APPLY MODIFIER complexity_average
    IF complexity = "complex" THEN APPLY MODIFIER complexity_complex
    IF complexity = "disaster" THEN APPLY MODIFIER complexity_disaster

    IF industry IN ["financial_services", "legal", "healthcare"] THEN APPLY MODIFIER industry_regulated
    IF industry IN ["construction", "ecommerce", "property"] THEN APPLY MODIFIER industry_complex
    IF industry IN ["retail", "services"] THEN APPLY MODIFIER industry_standard
    IF industry IN ["consulting", "sole_trader_services"] THEN APPLY MODIFIER industry_simple
  }
}
```

**Equivalent JSON:** See `31-pricing-config.prototype.json` (turnover_band_rules)

---

### Example 3: Transaction-Based Pricing

```dsl
SERVICE BOOK_FULL {
  name: "Full Bookkeeping Service"
  category: "bookkeeping"
  frequency: "monthly"
  drivers: ["monthly_transactions", "bank_accounts", "complexity_level", "industry"]

  PRICING {
    BAND "Low" WHEN transactions BETWEEN 0 AND 100 {
      base: £100
      rate: £0.50 PER transaction
    }

    BAND "Medium" WHEN transactions BETWEEN 101 AND 300 {
      base: £150
      rate: £0.75 PER transaction
    }

    BAND "High" WHEN transactions BETWEEN 301 AND 500 {
      base: £250
      rate: £1.00 PER transaction
    }

    BAND "Very High" WHEN transactions >= 501 {
      base: £350
      rate: £1.25 PER transaction
    }

    IF complexity = "clean" THEN APPLY MODIFIER complexity_modelB_clean (0.98)
    IF complexity = "complex" THEN APPLY MODIFIER complexity_modelB_complex (1.08)
    IF complexity = "disaster" THEN APPLY MODIFIER complexity_modelB_disaster (1.2)

    IF industry = "complex" THEN APPLY MODIFIER industry_complex (1.15)
    IF industry = "regulated" THEN APPLY MODIFIER industry_regulated (1.3)
  }
}
```

---

### Example 4: Employee-Tiered Pricing (Payroll)

```dsl
SERVICE PAYROLL_STANDARD {
  name: "Standard Payroll Processing"
  category: "payroll"
  frequency: "monthly"
  drivers: ["employee_count", "payroll_frequency"]

  PRICING {
    TIER "Director Only" WHEN employees BETWEEN 0 AND 2 RATE £18
    TIER "Small Team" WHEN employees BETWEEN 3 AND 5 RATE £50
    TIER "Medium Team" WHEN employees BETWEEN 6 AND 10 RATE £70
    TIER "Large Team" WHEN employees BETWEEN 11 AND 15 RATE £90
    TIER "Very Large Team" WHEN employees BETWEEN 16 AND 20 RATE £110
    TIER "Enterprise" WHEN employees >= 21 {
      base: £130
      additional: £2 PER employee OVER 20
    }

    IF frequency = "weekly" THEN APPLY MODIFIER payroll_weekly (3.0)
    IF frequency = "fortnightly" THEN APPLY MODIFIER payroll_fortnightly (2.0)
    IF frequency = "4weekly" THEN APPLY MODIFIER payroll_4weekly (2.0)
    IF frequency = "monthly" THEN APPLY MODIFIER payroll_monthly (1.0)
  }
}
```

---

### Example 5: Percentage-Based Pricing (R&D Tax Credits)

```dsl
SERVICE RD_TAX_CREDITS {
  name: "R&D Tax Credits"
  category: "tax_planning"
  frequency: "annual"
  drivers: ["savings_achieved"]

  PRICING {
    IF savings <= £55,000 THEN FIXED £2,750

    IF savings BETWEEN £55,001 AND £200,000 THEN {
      RATE 5% OF savings
    }

    IF savings > £200,000 THEN {
      base: £10,000
      additional: 2.5% OF (savings - £200,000)
      note: "5% up to £200k, then 2.5% on remainder"
    }
  }
}
```

---

### Example 6: Per-Unit Addon

```dsl
SERVICE ADDON_RENTAL {
  name: "Rental Property Income"
  category: "addon"
  frequency: "annual"
  drivers: ["property_count"]

  PRICING {
    FIXED £30 PER property
  }
}
```

---

## Modifier Definitions

### Complexity Modifiers

```dsl
MODIFIER complexity_clean {
  modelA: 0.95
  modelB: 0.98
  description: "Well-maintained books, Xero/QuickBooks"
}

MODIFIER complexity_average {
  modelA: 1.0
  modelB: 1.0
  description: "Standard complexity (baseline)"
}

MODIFIER complexity_complex {
  modelA: 1.15
  modelB: 1.08
  description: "Multiple income streams, Excel-based"
}

MODIFIER complexity_disaster {
  modelA: 1.4
  modelB: 1.2
  description: "Major cleanup required, no records"
}
```

**Rationale:** Model B multipliers are lower because transaction-based pricing already captures volume complexity.

---

### Industry Modifiers

```dsl
MODIFIER industry_simple MULTIPLIER 0.95 {
  industries: ["consulting", "sole_trader_services"]
  description: "Low transaction volume, simple operations"
}

MODIFIER industry_standard MULTIPLIER 1.0 {
  industries: ["retail", "services"]
  description: "Standard complexity (baseline)"
}

MODIFIER industry_complex MULTIPLIER 1.15 {
  industries: ["construction", "ecommerce", "property"]
  description: "Higher transaction volume, complexity"
}

MODIFIER industry_regulated MULTIPLIER 1.3 {
  industries: ["financial_services", "legal", "healthcare"]
  description: "Regulatory compliance requirements"
}
```

---

## Discount Definitions

### Volume Discount

```dsl
DISCOUNT volume_tier1 AMOUNT 5% {
  WHEN total_monthly_fees BETWEEN £500 AND £999
  description: "5% off for £500-£999/month"
}

DISCOUNT volume_tier2 AMOUNT 8% {
  WHEN total_monthly_fees >= £1,000
  description: "8% off for £1,000+/month"
}
```

---

### New Client Discount

```dsl
DISCOUNT new_client AMOUNT 10% {
  WHEN client_tenure < 12 months
  duration: "first 12 months"
  excludes: ["one_off"]
  description: "First year discount for new clients"
}
```

---

### Annual Payment Discount

```dsl
DISCOUNT annual_payment AMOUNT 10% {
  WHEN payment_frequency = "annual"
  applies_to: ["annual_services"]
  description: "Discount for annual prepayment"
}
```

---

## Surcharge Definitions

### Multi-Currency Surcharge

```dsl
SURCHARGE multi_currency AMOUNT £25 {
  WHEN uses_multiple_currencies = true
  applies_to: ["BOOK_BASIC", "BOOK_FULL"]
  frequency: "monthly"
  description: "Additional charge for multi-currency bookkeeping"
}
```

---

### Multi-Entity Surcharge

```dsl
SURCHARGE multi_entity_2 AMOUNT £40 {
  WHEN entity_count = 2
  frequency: "monthly"
  description: "2 entities (inter-company eliminations)"
}

SURCHARGE multi_entity_3to5 AMOUNT £90 {
  WHEN entity_count BETWEEN 3 AND 5
  frequency: "monthly"
  description: "3-5 entities (group consolidation)"
}

SURCHARGE multi_entity_6plus AMOUNT £150 {
  WHEN entity_count >= 6
  frequency: "monthly"
  description: "6+ entities (complex group structures)"
}
```

---

## Conditional Logic Examples

### Auto-Service Configuration

```dsl
# Automatic service selection based on lead data

IF lead.interested_services CONTAINS "COMP_ACCOUNTS" THEN {
  ADD SERVICE COMP_ACCOUNTS {
    complexity: ESTIMATE_FROM lead.books_condition, lead.software
  }
}

IF lead.estimated_employees > 0 THEN {
  ADD SERVICE PAYROLL_STANDARD {
    employees: lead.estimated_employees
    frequency: lead.payroll_frequency OR "monthly"
  }
}

IF lead.property_count > 0 THEN {
  ADD SERVICE ADDON_RENTAL {
    properties: lead.property_count
  }
}

IF lead.vat_registered = true THEN {
  ADD SERVICE VAT_RETURNS
}

IF lead.cis_registered = true THEN {
  ADD SERVICE ADDON_CIS
}

IF lead.interested_services CONTAINS "BOOK_BASIC" OR "BOOK_FULL" THEN {
  ADD SERVICE ESTIMATE_BOOKKEEPING_LEVEL(lead) {
    complexity: ESTIMATE_FROM lead.books_condition
    transactions: lead.monthly_transactions OR ESTIMATE_FROM lead.turnover, lead.industry, lead.vat_registered
  }
}
```

---

### Model Comparison Logic

```dsl
# Dual-model recommendation engine

CALCULATE price_modelA USING turnover_band_pricing
CALCULATE price_modelB USING transaction_based_pricing

IF price_modelB IS NULL THEN {
  RECOMMEND modelA
  reason: "Model B data not available"
}

IF ABS(price_modelA - price_modelB) / MIN(price_modelA, price_modelB) < 10% THEN {
  RECOMMEND modelA
  reason: "Models within 10% - turnover-based is simpler"
  savings: 0
}

IF price_modelB < price_modelA THEN {
  RECOMMEND modelB
  reason: "Transaction-based pricing saves you money"
  savings: price_modelA - price_modelB
  savings_percent: ((price_modelA - price_modelB) / price_modelA) * 100
} ELSE {
  RECOMMEND modelA
  reason: "Turnover-based pricing saves you money"
  savings: price_modelB - price_modelA
  savings_percent: ((price_modelB - price_modelA) / price_modelB) * 100
}
```

---

### Complexity Estimation Logic

```dsl
# Auto-estimate complexity from lead data

ESTIMATE complexity {
  factors: [
    {
      field: "books_condition"
      weight: 0.5
      direct_map: true
    },
    {
      field: "current_software"
      weight: 0.2
      mapping: {
        "xero": "clean",
        "quickbooks": "average",
        "sage": "average",
        "excel": "complex",
        "none": "disaster"
      }
    },
    {
      field: "monthly_transactions"
      weight: 0.15
      bands: {
        "0-50": "clean",
        "51-150": "average",
        "151-300": "complex",
        "301+": "disaster"
      }
    },
    {
      field: "has_multiple_currencies"
      weight: 0.1
      effect: "+1 complexity level"
    },
    {
      field: "has_multiple_entities"
      weight: 0.05
      effect: "+1 complexity level"
    }
  ]

  output: "clean" | "average" | "complex" | "disaster"
}
```

---

## Transaction Estimation Logic

```dsl
# Estimate monthly transactions when no data available

ESTIMATE transactions FROM turnover, industry, vat_registered {
  # Base estimates from turnover band
  base_estimates: {
    "0-89k": 35,
    "90k-149k": 55,
    "150k-249k": 80,
    "250k-499k": 120,
    "500k-749k": 180,
    "750k-999k": 250,
    "1m+": 350
  }

  # Industry multipliers
  industry_multipliers: {
    "retail": 1.5,
    "ecommerce": 2.0,
    "construction": 0.7,
    "consulting": 0.5,
    "default": 1.0
  }

  # VAT registration increases transaction count
  IF vat_registered = true THEN APPLY MULTIPLIER 1.2

  RETURN ROUND(base_estimate * industry_multiplier * vat_multiplier)
}
```

---

## Complete Pricing Workflow (DSL)

```dsl
# End-to-end pricing calculation

PRICING_WORKFLOW {

  # Step 1: Map inputs to drivers
  STEP map_inputs {
    input: lead OR proposal
    transform: USING 22-mappings.json
    output: pricing_drivers_object
  }

  # Step 2: Select services
  STEP select_services {
    IF feature_flags.auto_service_config = true THEN {
      APPLY auto_service_configuration_rules
    } ELSE {
      USE manual_service_selection
    }
    output: array_of_service_ids_with_config
  }

  # Step 3: Calculate base prices
  STEP calculate_base {
    FOR EACH service IN selected_services {
      IF service.models CONTAINS "A" THEN {
        price_modelA = LOOKUP turnover_band
        APPLY complexity_multiplier_modelA
        APPLY industry_multiplier
      }

      IF service.models CONTAINS "B" THEN {
        price_modelB = (base + transactions * rate)
        APPLY complexity_multiplier_modelB
        APPLY industry_multiplier
      }
    }
    output: base_prices_for_each_model
  }

  # Step 4: Apply modifiers
  STEP apply_modifiers {
    FOR EACH service {
      IF service.modifiers CONTAINS "complexity" THEN APPLY complexity_modifier
      IF service.modifiers CONTAINS "industry" THEN APPLY industry_modifier
      IF service.modifiers CONTAINS "payroll_frequency" THEN APPLY frequency_modifier
      IF time_sensitive = true THEN APPLY rush_fee (optional)
    }
    output: modified_prices
  }

  # Step 5: Add surcharges
  STEP add_surcharges {
    IF uses_multiple_currencies = true THEN ADD surcharge_multi_currency
    IF entity_count > 1 THEN ADD surcharge_multi_entity
    output: prices_with_surcharges
  }

  # Step 6: Apply discounts
  STEP apply_discounts {
    IF total_monthly_fees >= £500 THEN APPLY discount_volume
    IF client_tenure < 12 months THEN APPLY discount_new_client
    IF payment_frequency = "annual" THEN APPLY discount_annual_payment
    IF custom_discount EXISTS THEN APPLY custom_discount
    output: discounted_prices
  }

  # Step 7: Round prices
  STEP round_prices {
    IF feature_flags.rounding_to_nearest_5 = true THEN {
      ROUND_TO_NEAREST 5
    }
    output: final_rounded_prices
  }

  # Step 8: Compare models
  STEP compare_models {
    APPLY model_comparison_logic
    output: recommended_model, justification, savings
  }

  # Step 9: Enforce minimum
  STEP enforce_minimum {
    IF feature_flags.minimum_engagement = true THEN {
      IF total_monthly < £60 AND NOT one_off_service THEN {
        SET total_monthly = £60
      }
    }
    output: final_price_with_minimum
  }

  # Step 10: Generate line items
  STEP generate_line_items {
    FOR EACH service {
      CREATE line_item {
        service_id: service.id
        service_name: service.name
        quantity: service.quantity OR 1
        unit: service.unit OR "service"
        rate: service.final_rate
        subtotal: quantity * rate
        frequency: service.frequency
      }
    }
    output: array_of_quote_line_items
  }
}
```

---

## DSL vs JSON Comparison

### When to Use DSL

**✅ Use DSL for:**
- Business stakeholder communication
- Pricing policy documentation
- Audit trails and change logs
- Training and onboarding materials
- Pricing rule validation by non-technical staff

**Example Use Case:** Present pricing logic to accountancy practice partners for approval

---

### When to Use JSON

**✅ Use JSON for:**
- Runtime configuration
- API contracts and integrations
- Automated testing fixtures
- Version control and diffing
- Machine parsing and validation

**Example Use Case:** Deploy pricing config to production `/config/pricing/` directory

---

### Hybrid Approach (Recommended)

**Strategy:**
1. Document pricing rules in DSL for human readability
2. Convert DSL to JSON for runtime execution
3. Version control both formats (DSL = source of truth)
4. Use tooling to validate DSL ↔ JSON consistency

**Tooling Ideas:**
```bash
# Convert DSL to JSON
pnpm pricing dsl-to-json --input 32-pricing-dsl.md --output 31-pricing-config.json

# Validate consistency
pnpm pricing validate --dsl 32-pricing-dsl.md --json 31-pricing-config.json

# Generate documentation from DSL
pnpm pricing docs --input 32-pricing-dsl.md --output pricing-rules.html
```

---

## Implementation Roadmap

### Phase 1: Documentation (Current)
- ✅ Create DSL specification (this document)
- ✅ Document all existing pricing rules in DSL format
- Document service alignment in DSL

### Phase 2: Validation (Future)
- Build DSL parser (lexer + parser)
- Implement DSL → JSON converter
- Create validation tooling

### Phase 3: Runtime (Future - Optional)
- Evaluate DSL interpreter vs pre-compilation
- Performance benchmarks (DSL interpretation vs JSON lookup)
- Decision: Compile to JSON (recommended) vs runtime interpretation

---

## Grammar Extensions (Future)

### Conditional Dependencies

```dsl
SERVICE MGMT_MONTHLY {
  REQUIRES BOOK_FULL

  IF BOOK_FULL NOT IN selected_services THEN {
    WARN "Management accounts require full bookkeeping"
    SUGGEST ADD BOOK_FULL
  }
}
```

---

### Time-Based Rules

```dsl
MODIFIER year_end_premium MULTIPLIER 1.1 {
  ACTIVE WHEN current_date BETWEEN "2025-01-01" AND "2025-03-31"
  applies_to: ["COMP_ACCOUNTS", "SATR_SINGLE", "SATR_MULTI"]
  description: "10% premium during peak season"
}
```

---

### Client Segmentation

```dsl
SEGMENT high_value_clients {
  WHEN total_monthly_fees > £500
  OR client_tenure > 24 months
  OR client_type = "enterprise"

  APPLY DISCOUNT loyalty_discount 5%
  PRIORITY support_tier "premium"
}
```

---

## Best Practices

1. **Keep DSL Simple:** Resist feature creep - complex logic belongs in code
2. **Version Control:** Track DSL changes with clear commit messages
3. **Validate Early:** Parse DSL on file save, not at runtime
4. **Use Comments:** DSL should be self-documenting, but add context where needed
5. **Test Coverage:** Every DSL rule should have corresponding test cases
6. **Stakeholder Review:** Non-technical staff should be able to read and validate rules

---

## References

- **Config Prototype:** `31-pricing-config.prototype.json`
- **Service Alignment:** `15-service-alignment-matrix.md`
- **Pricing Model:** `30-pricing-model.md`
- **Field Mappings:** `22-mappings.json`
- **Pricing Router:** `app/server/routers/pricing.ts`
- **Schema:** `lib/db/schema.ts`

---

**End of Pricing DSL Specification**
