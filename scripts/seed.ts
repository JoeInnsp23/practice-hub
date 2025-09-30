// Environment variables are loaded via tsx -r dotenv/config in package.json
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  activityLogs,
  clientContacts,
  clientDirectors,
  clientPSCs,
  clientServices,
  clients,
  compliance,
  documents,
  invoiceItems,
  invoices,
  leads,
  onboardingSessions,
  onboardingTasks,
  portalCategories,
  portalLinks,
  pricingRules,
  serviceComponents,
  services,
  tasks,
  taskWorkflowInstances,
  tenants,
  timeEntries,
  users,
  workflowStages,
  workflows,
} from "../lib/db/schema";

// Set a consistent seed for reproducible data
faker.seed(12345);

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");

  // Delete in reverse order of dependencies
  await db.delete(activityLogs);
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(timeEntries);
  await db.delete(taskWorkflowInstances);
  await db.delete(workflowStages);
  await db.delete(workflows);
  await db.delete(documents);
  await db.delete(compliance);
  await db.delete(clientServices);
  await db.delete(tasks);
  await db.delete(onboardingTasks);
  await db.delete(onboardingSessions);
  await db.delete(clientPSCs);
  await db.delete(clientDirectors);
  await db.delete(clientContacts);
  await db.delete(clients);
  await db.delete(leads);
  await db.delete(pricingRules);
  await db.delete(serviceComponents);
  await db.delete(services);

  // Clear portal data
  await db.delete(portalLinks);
  await db.delete(portalCategories);

  await db.delete(users);
  await db.delete(tenants);

  console.log("✅ Database cleared");
}

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  // 1. Create Tenant
  console.log("Creating tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Demo Accounting Firm",
      slug: "demo-firm",
    })
    .returning();

  // 2. Create Users (team members)
  console.log("Creating users...");
  const userList = [
    {
      clerkId: "user_316Q56M4cs8UNbHyh7YaAJADGKs", // Real Clerk user ID for joe@pageivy.com
      email: "joe@pageivy.com",
      firstName: "Joe",
      lastName: "User",
      role: "admin",
      hourlyRate: "150",
    },
    {
      clerkId: "user_demo_accountant1",
      email: "sarah.johnson@demo.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "accountant",
      hourlyRate: "120",
    },
    {
      clerkId: "user_demo_accountant2",
      email: "mike.chen@demo.com",
      firstName: "Mike",
      lastName: "Chen",
      role: "accountant",
      hourlyRate: "110",
    },
    {
      clerkId: "user_demo_member",
      email: "emily.davis@demo.com",
      firstName: "Emily",
      lastName: "Davis",
      role: "member",
      hourlyRate: "85",
    },
  ];

  const createdUsers = await db
    .insert(users)
    .values(
      userList.map((user) => ({
        ...user,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  const [adminUser, _sarah, _mike, _emily] = createdUsers;

  // 2.5. Create Portal Categories and Links
  console.log("Creating portal categories and links...");

  // Create Portal Categories
  const [practiceHubCategory] = await db
    .insert(portalCategories)
    .values({
      tenantId: tenant.id,
      name: "Practice Hub",
      description: "Internal practice management modules",
      iconName: "LayoutGrid",
      colorHex: "#ff8609",
      sortOrder: 1,
      isActive: true,
      createdById: adminUser.id,
    })
    .returning();

  const [externalToolsCategory] = await db
    .insert(portalCategories)
    .values({
      tenantId: tenant.id,
      name: "External Tools",
      description: "Government and regulatory services",
      iconName: "ExternalLink",
      colorHex: "#3b82f6",
      sortOrder: 2,
      isActive: true,
      createdById: adminUser.id,
    })
    .returning();

  const [practiceResourcesCategory] = await db
    .insert(portalCategories)
    .values({
      tenantId: tenant.id,
      name: "Practice Resources",
      description: "Professional bodies and resources",
      iconName: "BookOpen",
      colorHex: "#8b5cf6",
      sortOrder: 3,
      isActive: true,
      createdById: adminUser.id,
    })
    .returning();

  // Create Practice Hub internal module links
  const practiceHubLinks = [
    {
      title: "Client Hub",
      description: "Manage clients, contacts, and relationships",
      url: "/client-hub",
      iconName: "Users",
      sortOrder: 1,
    },
    {
      title: "Proposal Hub",
      description: "Create and manage client proposals",
      url: "/proposal-hub",
      iconName: "FileText",
      sortOrder: 2,
    },
    {
      title: "Social Hub",
      description: "Practice social features (coming soon)",
      url: "/social-hub",
      iconName: "Share2",
      sortOrder: 3,
    },
    {
      title: "Bookkeeping Hub",
      description: "Bookkeeping and reconciliation (coming soon)",
      url: "/bookkeeping",
      iconName: "Calculator",
      sortOrder: 4,
    },
    {
      title: "Accounts Hub",
      description: "Annual accounts preparation (coming soon)",
      url: "/accounts-hub",
      iconName: "Building",
      sortOrder: 5,
    },
    {
      title: "Payroll Hub",
      description: "Payroll processing and RTI (coming soon)",
      url: "/payroll",
      iconName: "DollarSign",
      sortOrder: 6,
    },
    {
      title: "Employee Portal",
      description: "Employee self-service portal (coming soon)",
      url: "/employee-portal",
      iconName: "Briefcase",
      sortOrder: 7,
    },
    {
      title: "Client Portal",
      description: "Client self-service portal",
      url: "/client-portal",
      iconName: "UserCircle",
      sortOrder: 8,
    },
    {
      title: "Admin Panel",
      description: "System administration and configuration",
      url: "/admin",
      iconName: "Settings",
      sortOrder: 9,
    },
  ];

  await db.insert(portalLinks).values(
    practiceHubLinks.map((link) => ({
      tenantId: tenant.id,
      categoryId: practiceHubCategory.id,
      title: link.title,
      description: link.description,
      url: link.url,
      isInternal: true,
      iconName: link.iconName,
      sortOrder: link.sortOrder,
      isActive: true,
      createdById: adminUser.id,
    })),
  );

  // Create External Tools links (UK-specific)
  const externalToolsLinks = [
    {
      title: "HMRC Online Services",
      description: "Access HMRC tax services and submissions",
      url: "https://www.tax.service.gov.uk/account",
      iconName: "ExternalLink",
      sortOrder: 1,
    },
    {
      title: "Companies House",
      description: "Search company information and file documents",
      url: "https://www.gov.uk/government/organisations/companies-house",
      iconName: "Building2",
      sortOrder: 2,
    },
    {
      title: "WebFiling Service",
      description: "Companies House online filing service",
      url: "https://ewf.companieshouse.gov.uk/",
      iconName: "Upload",
      sortOrder: 3,
    },
    {
      title: "VAT Online",
      description: "Submit VAT returns and view account",
      url: "https://www.tax.service.gov.uk/vat-through-software/overview",
      iconName: "FileCheck",
      sortOrder: 4,
    },
    {
      title: "PAYE for Employers",
      description: "PAYE online services and RTI submissions",
      url: "https://www.gov.uk/paye-online",
      iconName: "Users2",
      sortOrder: 5,
    },
    {
      title: "Self Assessment",
      description: "Self Assessment online services",
      url: "https://www.gov.uk/log-in-file-self-assessment-tax-return",
      iconName: "Receipt",
      sortOrder: 6,
    },
    {
      title: "Making Tax Digital",
      description: "MTD for Income Tax and VAT",
      url: "https://www.gov.uk/guidance/use-software-to-send-income-tax-updates",
      iconName: "CloudUpload",
      sortOrder: 7,
    },
  ];

  await db.insert(portalLinks).values(
    externalToolsLinks.map((link) => ({
      tenantId: tenant.id,
      categoryId: externalToolsCategory.id,
      title: link.title,
      description: link.description,
      url: link.url,
      isInternal: false,
      iconName: link.iconName,
      sortOrder: link.sortOrder,
      isActive: true,
      createdById: adminUser.id,
    })),
  );

  // Create Practice Resources links
  const practiceResourcesLinks = [
    {
      title: "ICAEW",
      description: "Institute of Chartered Accountants in England and Wales",
      url: "https://www.icaew.com/",
      iconName: "GraduationCap",
      sortOrder: 1,
    },
    {
      title: "ACCA",
      description: "Association of Chartered Certified Accountants",
      url: "https://www.accaglobal.com/",
      iconName: "Award",
      sortOrder: 2,
    },
    {
      title: "AAT",
      description: "Association of Accounting Technicians",
      url: "https://www.aat.org.uk/",
      iconName: "BookmarkCheck",
      sortOrder: 3,
    },
    {
      title: "GOV.UK",
      description: "Official UK government website",
      url: "https://www.gov.uk/",
      iconName: "Home",
      sortOrder: 4,
    },
  ];

  await db.insert(portalLinks).values(
    practiceResourcesLinks.map((link) => ({
      tenantId: tenant.id,
      categoryId: practiceResourcesCategory.id,
      title: link.title,
      description: link.description,
      url: link.url,
      isInternal: false,
      iconName: link.iconName,
      sortOrder: link.sortOrder,
      isActive: true,
      createdById: adminUser.id,
    })),
  );

  console.log(
    `✓ Created ${practiceHubLinks.length + externalToolsLinks.length + practiceResourcesLinks.length} portal links across 3 categories`,
  );

  // 3. Create Service Components (modular pricing)
  console.log("Creating service components...");
  const serviceComponentsList = [
    // COMPLIANCE SERVICES
    {
      code: "COMP_ACCOUNTS",
      name: "Annual Accounts & Corporation Tax",
      category: "compliance" as const,
      description:
        "Year-end accounts preparation and Corporation Tax return filing",
      pricingModel: "both" as const, // Supports both turnover and transaction-based
      basePrice: "30", // Base for Model B
      price: "49", // Base for Model A (£0-89k)
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["compliance", "accounts", "corporation-tax"],
    },
    {
      code: "COMP_CONFIRMATION",
      name: "Confirmation Statement",
      category: "compliance" as const,
      description: "Annual Companies House confirmation statement filing",
      pricingModel: "fixed" as const,
      basePrice: "5",
      price: "5",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["compliance", "companies-house"],
    },
    {
      code: "COMP_SATR",
      name: "Self-Assessment Tax Returns",
      category: "compliance" as const,
      description: "Personal tax return for directors/shareholders",
      pricingModel: "fixed" as const,
      basePrice: "16.67",
      price: "16.67",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["compliance", "self-assessment", "personal-tax"],
    },

    // VAT SERVICES
    {
      code: "VAT_STANDARD",
      name: "Quarterly VAT Returns",
      category: "vat" as const,
      description: "Preparation and filing of quarterly VAT returns to HMRC",
      pricingModel: "both" as const,
      basePrice: "20", // Min for Model B
      price: "25", // Base for Model A (£85k-149k)
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["vat", "returns", "mtd"],
    },

    // BOOKKEEPING SERVICES
    {
      code: "BOOK_BASIC",
      name: "Basic Bookkeeping (Cash Coding)",
      category: "bookkeeping" as const,
      description: "Transaction categorization and basic reconciliation in Xero",
      pricingModel: "both" as const,
      basePrice: "40", // Min for Model B (0-25 transactions)
      price: "80", // Base for Model A (£0-89k)
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["bookkeeping", "basic", "xero"],
    },
    {
      code: "BOOK_FULL",
      name: "Full Bookkeeping (Comprehensive)",
      category: "bookkeeping" as const,
      description:
        "Complete bookkeeping service with proactive financial management",
      pricingModel: "both" as const,
      basePrice: "120", // Min for Model B (0-25 clean)
      price: "180", // Base for Model A (£0-89k average)
      priceType: "fixed" as const,
      supportsComplexity: true, // Supports complexity multipliers
      tags: ["bookkeeping", "full-service", "xero"],
    },

    // PAYROLL SERVICES
    {
      code: "PAYROLL_STANDARD",
      name: "Standard Payroll Processing",
      category: "payroll" as const,
      description: "Full payroll processing including RTI submissions to HMRC",
      pricingModel: "fixed" as const,
      basePrice: "18", // Director only monthly
      price: "18",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["payroll", "rti", "paye"],
    },
    {
      code: "PAYROLL_PENSION",
      name: "Auto-Enrolment Pension Administration",
      category: "payroll" as const,
      description: "Pension scheme administration and compliance",
      pricingModel: "fixed" as const,
      basePrice: "2", // Per employee per month
      price: "2",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["payroll", "pension", "auto-enrolment"],
    },

    // MANAGEMENT REPORTING
    {
      code: "MGMT_MONTHLY",
      name: "Monthly Management Accounts",
      category: "management" as const,
      description: "Comprehensive management reporting package",
      pricingModel: "turnover" as const,
      basePrice: "150",
      price: "150",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["management-accounts", "reporting", "kpi"],
    },
    {
      code: "MGMT_QUARTERLY",
      name: "Quarterly Management Accounts",
      category: "management" as const,
      description: "Quarterly management reporting package",
      pricingModel: "turnover" as const,
      basePrice: "75", // 50% of monthly
      price: "75",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["management-accounts", "reporting"],
    },

    // COMPANY SECRETARIAL
    {
      code: "SEC_BASIC",
      name: "Basic Company Secretarial",
      category: "secretarial" as const,
      description: "Annual return, share changes, basic filings",
      pricingModel: "fixed" as const,
      basePrice: "15",
      price: "15",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["secretarial", "companies-house"],
    },
    {
      code: "SEC_FULL",
      name: "Full Company Secretarial",
      category: "secretarial" as const,
      description:
        "Minutes, resolutions, register maintenance, all filings",
      pricingModel: "fixed" as const,
      basePrice: "35",
      price: "35",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["secretarial", "minutes", "resolutions"],
    },
    {
      code: "SEC_COMPLEX",
      name: "Complex Company Secretarial",
      category: "secretarial" as const,
      description:
        "Group structures, multiple entities, complex changes",
      pricingModel: "fixed" as const,
      basePrice: "60",
      price: "60",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["secretarial", "complex", "group-structures"],
    },

    // TAX PLANNING & ADVISORY
    {
      code: "TAX_ANNUAL",
      name: "Annual Tax Planning Review",
      category: "tax_planning" as const,
      description: "Annual tax planning review and optimization",
      pricingModel: "fixed" as const,
      basePrice: "50",
      price: "50",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["tax-planning", "advisory"],
    },
    {
      code: "TAX_QUARTERLY",
      name: "Quarterly Tax Planning",
      category: "tax_planning" as const,
      description: "Quarterly tax planning and optimization",
      pricingModel: "fixed" as const,
      basePrice: "100",
      price: "100",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["tax-planning", "advisory", "quarterly"],
    },
    {
      code: "TAX_RD",
      name: "R&D Tax Claims",
      category: "tax_planning" as const,
      description: "Research & Development tax claim preparation",
      pricingModel: "fixed" as const,
      basePrice: "1500", // Minimum
      price: "1500",
      priceType: "percentage" as const,
      supportsComplexity: false,
      tags: ["tax-planning", "rd-claims"],
      metadata: { percentage: 18 }, // 18% of claim value
    },

    // SPECIALIST ADD-ONS
    {
      code: "ADDON_CIS",
      name: "CIS Returns",
      category: "addon" as const,
      description: "Construction Industry Scheme returns",
      pricingModel: "fixed" as const,
      basePrice: "40",
      price: "40",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "cis", "construction"],
    },
    {
      code: "ADDON_RENTAL",
      name: "Additional Rental Properties",
      category: "addon" as const,
      description: "Per additional rental property on SATR (beyond 2)",
      pricingModel: "fixed" as const,
      basePrice: "4",
      price: "4",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "rental", "property"],
    },
    {
      code: "ADDON_VAT_REG",
      name: "VAT Registration",
      category: "addon" as const,
      description: "VAT registration service",
      pricingModel: "fixed" as const,
      basePrice: "5", // Monthly admin
      price: "5",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "vat", "registration"],
      metadata: { oneOffSetupFee: 75 },
    },
    {
      code: "ADDON_PAYE_REG",
      name: "PAYE Registration",
      category: "addon" as const,
      description: "PAYE registration service",
      pricingModel: "fixed" as const,
      basePrice: "5", // Monthly admin
      price: "5",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "paye", "registration"],
      metadata: { oneOffSetupFee: 75 },
    },
    {
      code: "ADDON_MTD_SETUP",
      name: "Making Tax Digital Setup",
      category: "addon" as const,
      description: "MTD setup and training",
      pricingModel: "fixed" as const,
      basePrice: "200",
      price: "200",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "mtd", "setup"],
    },
    {
      code: "ADDON_XERO_SETUP",
      name: "Xero Setup & Training",
      category: "addon" as const,
      description: "Xero setup and training (3 hours)",
      pricingModel: "fixed" as const,
      basePrice: "300",
      price: "300",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "xero", "setup", "training"],
    },
    {
      code: "ADDON_MODULR_WEEKLY",
      name: "Modulr - Weekly",
      category: "addon" as const,
      description: "Modulr payment processing - weekly",
      pricingModel: "fixed" as const,
      basePrice: "60",
      price: "60",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "modulr", "payments"],
    },
    {
      code: "ADDON_MODULR_BIWEEKLY",
      name: "Modulr - Bi-Weekly",
      category: "addon" as const,
      description: "Modulr payment processing - bi-weekly",
      pricingModel: "fixed" as const,
      basePrice: "30",
      price: "30",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "modulr", "payments"],
    },
    {
      code: "ADDON_MODULR_MONTHLY",
      name: "Modulr - Monthly",
      category: "addon" as const,
      description: "Modulr payment processing - monthly",
      pricingModel: "fixed" as const,
      basePrice: "10",
      price: "10",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "modulr", "payments"],
    },
    {
      code: "ADDON_VAT_REVIEW",
      name: "VAT Return Review",
      category: "addon" as const,
      description: "VAT return review service",
      pricingModel: "fixed" as const,
      basePrice: "60",
      price: "60",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "vat", "review"],
    },
    {
      code: "ADDON_VAT_1614_REG",
      name: "VAT 1614 Registration",
      category: "addon" as const,
      description: "VAT 1614 (flat rate scheme) registration",
      pricingModel: "fixed" as const,
      basePrice: "5",
      price: "5",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "vat", "registration", "flat-rate"],
    },
    {
      code: "ADDON_SATR_REG",
      name: "SATR Registration",
      category: "addon" as const,
      description: "Self-assessment tax return registration",
      pricingModel: "fixed" as const,
      basePrice: "5",
      price: "5",
      priceType: "fixed" as const,
      supportsComplexity: false,
      tags: ["addon", "satr", "registration"],
    },
  ];

  const createdServiceComponents = await db
    .insert(serviceComponents)
    .values(
      serviceComponentsList.map((component) => ({
        ...component,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  console.log(`✓ Created ${createdServiceComponents.length} service components`);

  // 4. Create Pricing Rules
  console.log("Creating pricing rules...");

  // Helper to find component by code
  const getComponent = (code: string) =>
    createdServiceComponents.find((c) => c.code === code)!;

  // Turnover bands for Model A pricing
  const turnoverBands = [
    { min: 0, max: 89999, label: "£0-89k" },
    { min: 90000, max: 149999, label: "£90k-149k" },
    { min: 150000, max: 249999, label: "£150k-249k" },
    { min: 250000, max: 499999, label: "£250k-499k" },
    { min: 500000, max: 749999, label: "£500k-749k" },
    { min: 750000, max: 999999, label: "£750k-999k" },
    { min: 1000000, max: 999999999, label: "£1M+" },
  ];

  const pricingRulesList: any[] = [];

  // COMP_ACCOUNTS - Turnover-based pricing
  const accountsPrices = [49, 59, 79, 99, 119, 139, 159];
  turnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      componentId: getComponent("COMP_ACCOUNTS").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: accountsPrices[index].toString(),
    });
  });

  // COMP_ACCOUNTS - Transaction-based pricing (Model B)
  // Base £30 + £0.15 per transaction
  pricingRulesList.push({
    componentId: getComponent("COMP_ACCOUNTS").id,
    ruleType: "per_unit" as const,
    price: "0.15",
    metadata: { basePrice: 30, description: "Per transaction" },
  });

  // VAT_STANDARD - Turnover-based pricing
  const vatPrices = [25, 35, 45, 55];
  const vatTurnoverBands = [
    { min: 85000, max: 149999 },
    { min: 150000, max: 249999 },
    { min: 250000, max: 499999 },
    { min: 500000, max: 999999999 },
  ];
  vatTurnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      componentId: getComponent("VAT_STANDARD").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: vatPrices[index].toString(),
    });
  });

  // VAT_STANDARD - Transaction-based pricing (Model B)
  // £0.10 per transaction (minimum £20)
  pricingRulesList.push({
    componentId: getComponent("VAT_STANDARD").id,
    ruleType: "per_unit" as const,
    price: "0.10",
    metadata: { minimumPrice: 20, description: "Per transaction" },
  });

  // BOOK_BASIC - Turnover-based pricing
  const bookBasicPrices = [80, 100, 130, 160, 200];
  const bookBasicTurnoverBands = [
    { min: 0, max: 89999 },
    { min: 90000, max: 149999 },
    { min: 150000, max: 249999 },
    { min: 250000, max: 499999 },
    { min: 500000, max: 999999999 },
  ];
  bookBasicTurnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      componentId: getComponent("BOOK_BASIC").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: bookBasicPrices[index].toString(),
    });
  });

  // BOOK_BASIC - Transaction-based pricing bands (Model B)
  const bookBasicTransactionBands = [
    { min: 0, max: 25, price: 40 },
    { min: 26, max: 50, price: 60 },
    { min: 51, max: 75, price: 80 },
    { min: 76, max: 100, price: 100 },
    { min: 101, max: 150, price: 130 },
    { min: 151, max: 200, price: 160 },
    { min: 201, max: 300, price: 200 },
    { min: 301, max: 400, price: 250 },
    { min: 401, max: 500, price: 300 },
  ];
  bookBasicTransactionBands.forEach((band) => {
    pricingRulesList.push({
      componentId: getComponent("BOOK_BASIC").id,
      ruleType: "transaction_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: band.price.toString(),
    });
  });

  // BOOK_BASIC - High volume transaction pricing (500+)
  pricingRulesList.push({
    componentId: getComponent("BOOK_BASIC").id,
    ruleType: "per_unit" as const,
    minValue: "501",
    price: "0.60",
    metadata: { description: "Per transaction over 500" },
  });

  // BOOK_FULL - Turnover-based pricing with complexity levels
  const bookFullPrices = {
    clean: [150, 200, 250, 320, 400, 480, 560],
    average: [180, 240, 300, 380, 480, 580, 680],
    complex: [220, 290, 360, 460, 580, 700, 820],
    disaster: [280, 370, 460, 590, 740, 900, 1050],
  };

  Object.entries(bookFullPrices).forEach(([complexity, prices]) => {
    turnoverBands.forEach((band, index) => {
      pricingRulesList.push({
        componentId: getComponent("BOOK_FULL").id,
        ruleType: "turnover_band" as const,
        minValue: band.min.toString(),
        maxValue: band.max.toString(),
        price: prices[index].toString(),
        complexityLevel: complexity,
      });
    });
  });

  // BOOK_FULL - Transaction-based pricing with complexity (Model B)
  const bookFullTransactionBands = {
    clean: [
      { min: 0, max: 25, price: 120 },
      { min: 26, max: 50, price: 180 },
      { min: 51, max: 75, price: 240 },
      { min: 76, max: 100, price: 300 },
      { min: 101, max: 150, price: 380 },
      { min: 151, max: 200, price: 460 },
      { min: 201, max: 300, price: 580 },
      { min: 301, max: 400, price: 700 },
      { min: 401, max: 500, price: 820 },
    ],
    average: [
      { min: 0, max: 25, price: 140 },
      { min: 26, max: 50, price: 210 },
      { min: 51, max: 75, price: 280 },
      { min: 76, max: 100, price: 350 },
      { min: 101, max: 150, price: 440 },
      { min: 151, max: 200, price: 530 },
      { min: 201, max: 300, price: 670 },
      { min: 301, max: 400, price: 810 },
      { min: 401, max: 500, price: 950 },
    ],
    complex: [
      { min: 0, max: 25, price: 170 },
      { min: 26, max: 50, price: 250 },
      { min: 51, max: 75, price: 340 },
      { min: 76, max: 100, price: 420 },
      { min: 101, max: 150, price: 530 },
      { min: 151, max: 200, price: 640 },
      { min: 201, max: 300, price: 810 },
      { min: 301, max: 400, price: 980 },
      { min: 401, max: 500, price: 1150 },
    ],
    disaster: [
      { min: 0, max: 25, price: 210 },
      { min: 26, max: 50, price: 310 },
      { min: 51, max: 75, price: 420 },
      { min: 76, max: 100, price: 520 },
      { min: 101, max: 150, price: 660 },
      { min: 151, max: 200, price: 800 },
      { min: 201, max: 300, price: 1010 },
      { min: 301, max: 400, price: 1220 },
      { min: 401, max: 500, price: 1430 },
    ],
  };

  Object.entries(bookFullTransactionBands).forEach(([complexity, bands]) => {
    bands.forEach((band) => {
      pricingRulesList.push({
        componentId: getComponent("BOOK_FULL").id,
        ruleType: "transaction_band" as const,
        minValue: band.min.toString(),
        maxValue: band.max.toString(),
        price: band.price.toString(),
        complexityLevel: complexity,
      });
    });
  });

  // BOOK_FULL - High volume transaction pricing (500+) with complexity
  const bookFullHighVolumeRates = {
    clean: 1.5,
    average: 1.75,
    complex: 2.1,
    disaster: 2.6,
  };
  Object.entries(bookFullHighVolumeRates).forEach(([complexity, rate]) => {
    pricingRulesList.push({
      componentId: getComponent("BOOK_FULL").id,
      ruleType: "per_unit" as const,
      minValue: "501",
      price: rate.toString(),
      complexityLevel: complexity,
      metadata: { description: `Per transaction over 500 (${complexity})` },
    });
  });

  // MGMT_MONTHLY - Turnover-based pricing
  const mgmtMonthlyPrices = [150, 200, 250, 350, 450];
  const mgmtMonthlyTurnoverBands = [
    { min: 0, max: 249999 },
    { min: 250000, max: 499999 },
    { min: 500000, max: 999999 },
    { min: 1000000, max: 1999999 },
    { min: 2000000, max: 999999999 },
  ];
  mgmtMonthlyTurnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      componentId: getComponent("MGMT_MONTHLY").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: mgmtMonthlyPrices[index].toString(),
    });
  });

  // Insert all pricing rules
  const createdPricingRules = await db
    .insert(pricingRules)
    .values(
      pricingRulesList.map((rule) => ({
        ...rule,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  console.log(`✓ Created ${createdPricingRules.length} pricing rules`);

  // 5. Create Clients
  console.log("Creating clients...");
  const clientList = [];
  const _clientTypes = [
    "individual",
    "company",
    "trust",
    "partnership",
  ] as const;
  const clientStatuses = [
    "onboarding",
    "onboarding",
    "active",
    "prospect",
    "inactive",
  ] as const;

  for (let i = 0; i < 25; i++) {
    const isCompany = faker.datatype.boolean();
    clientList.push({
      clientCode: `CLI-${String(i + 1).padStart(4, "0")}`,
      name: isCompany ? faker.company.name() : faker.person.fullName(),
      type: isCompany
        ? faker.helpers.arrayElement(["company", "partnership"] as const)
        : faker.helpers.arrayElement(["individual", "trust"] as const),
      status: faker.helpers.arrayElement(clientStatuses),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      website: isCompany ? faker.internet.url() : null,
      vatNumber: isCompany ? `GB${faker.string.numeric(9)}` : null,
      registrationNumber: isCompany
        ? faker.string.alphanumeric(8).toUpperCase()
        : null,
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      postalCode: faker.location.zipCode("??# #??"),
      country: "United Kingdom",
      accountManagerId: faker.helpers.arrayElement(createdUsers).id,
      incorporationDate: isCompany
        ? faker.date.past({ years: 10 }).toISOString()
        : null,
      yearEnd: isCompany
        ? faker.date.future({ years: 1 }).toISOString().slice(5, 10)
        : null,
      healthScore: faker.number.int({ min: 30, max: 100 }),
      notes: faker.lorem.sentence(),
    });
  }

  const createdClients = await db
    .insert(clients)
    .values(
      clientList.map((client) => ({
        ...client,
        tenantId: tenant.id,
        createdBy: adminUser.id,
      })),
    )
    .returning();

  // 5. Create Client Contacts
  console.log("Creating client contacts...");
  for (const client of createdClients) {
    // Create 1-3 contacts per client
    const contactCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < contactCount; i++) {
      const hasMiddleName = faker.datatype.boolean({ probability: 0.3 });
      const jobTitle = faker.person.jobTitle();
      await db.insert(clientContacts).values({
        tenantId: tenant.id,
        clientId: client.id,
        isPrimary: i === 0,
        firstName: faker.person.firstName(),
        middleName: hasMiddleName ? faker.person.middleName() : null,
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        mobile: faker.phone.number(),
        jobTitle,
        position: jobTitle,
        department: faker.commerce.department(),
        addressLine1: faker.location.streetAddress(),
        addressLine2: faker.datatype.boolean({ probability: 0.3 })
          ? faker.location.secondaryAddress()
          : null,
        city: faker.location.city(),
        region: faker.location.state(),
        postalCode: faker.location.zipCode("??# #??"),
        country: "United Kingdom",
        isActive: true,
      });
    }
  }

  // 5.5. Create Directors for Company Clients
  console.log("Creating client directors...");
  const companyClients = createdClients.filter(
    (c) => c.type === "company" || c.type === "partnership",
  );
  for (const client of companyClients) {
    // Create 1-4 directors per company
    const directorCount = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < directorCount; i++) {
      const isActive = faker.datatype.boolean({ probability: 0.9 });
      const appointedDate = faker.date.past({ years: 10 });
      await db.insert(clientDirectors).values({
        tenantId: tenant.id,
        clientId: client.id,
        name: faker.person.fullName(),
        officerRole: faker.helpers.arrayElement([
          "director",
          "secretary",
          "member",
        ]),
        appointedOn: appointedDate.toISOString().split("T")[0],
        resignedOn: isActive
          ? null
          : faker.date
              .between({ from: appointedDate, to: new Date() })
              .toISOString()
              .split("T")[0],
        isActive,
        nationality: faker.helpers.arrayElement([
          "British",
          "Irish",
          "American",
          "Canadian",
          "Australian",
        ]),
        occupation: faker.person.jobType(),
        dateOfBirth: `${faker.date.birthdate({ min: 25, max: 75, mode: "age" }).toISOString().slice(0, 7)}`,
        address: faker.location.streetAddress(true),
      });
    }
  }

  // 5.6. Create PSCs for Company Clients
  console.log("Creating client PSCs...");
  for (const client of companyClients) {
    // Create 1-3 PSCs per company
    const pscCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < pscCount; i++) {
      const isActive = faker.datatype.boolean({ probability: 0.95 });
      const notifiedDate = faker.date.past({ years: 8 });
      await db.insert(clientPSCs).values({
        tenantId: tenant.id,
        clientId: client.id,
        name: faker.person.fullName(),
        kind: faker.helpers.arrayElement([
          "individual-person-with-significant-control",
          "corporate-entity-person-with-significant-control",
        ]),
        notifiedOn: notifiedDate.toISOString().split("T")[0],
        ceasedOn: isActive
          ? null
          : faker.date
              .between({ from: notifiedDate, to: new Date() })
              .toISOString()
              .split("T")[0],
        isActive,
        nationality: faker.helpers.arrayElement([
          "British",
          "Irish",
          "American",
          "Canadian",
          "Australian",
        ]),
        dateOfBirth: `${faker.date.birthdate({ min: 25, max: 75, mode: "age" }).toISOString().slice(0, 7)}`,
        naturesOfControl: faker.helpers.arrayElements(
          [
            "ownership-of-shares-75-to-100-percent",
            "ownership-of-shares-50-to-75-percent",
            "ownership-of-shares-25-to-50-percent",
            "voting-rights-75-to-100-percent",
            "voting-rights-50-to-75-percent",
            "voting-rights-25-to-50-percent",
            "right-to-appoint-and-remove-directors",
            "significant-influence-or-control",
          ],
          { min: 1, max: 3 },
        ),
        address: faker.location.streetAddress(true),
      });
    }
  }

  // 6. Assign Service Components to Clients
  console.log("Assigning service components to clients...");
  for (const client of createdClients) {
    // Each client gets 1-4 service components
    const serviceCount = faker.number.int({ min: 1, max: 4 });
    const selectedComponents = faker.helpers.arrayElements(
      createdServiceComponents,
      serviceCount,
    );

    for (const component of selectedComponents) {
      await db.insert(clientServices).values({
        tenantId: tenant.id,
        clientId: client.id,
        serviceComponentId: component.id,
        customRate: faker.datatype.boolean()
          ? String(
              Number(component.price) *
                faker.number.float({ min: 0.8, max: 1.2 }),
            )
          : null,
        startDate: faker.date.past({ years: 2 }).toISOString(),
        isActive: true,
      });
    }
  }

  // 6. Create Leads
  console.log("Creating leads...");
  const leadStatuses = [
    "new",
    "contacted",
    "qualified",
    "proposal_sent",
    "negotiating",
  ] as const;
  const leadSources = [
    "Website Enquiry",
    "Referral",
    "Cold Call",
    "LinkedIn",
    "Networking Event",
    "Google Search",
  ];
  const industries = [
    "Technology",
    "Retail",
    "Healthcare",
    "Manufacturing",
    "Professional Services",
    "Hospitality",
    "Construction",
    "E-commerce",
  ];

  const leadsList = [];
  for (let i = 0; i < 15; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const companyName = faker.company.name();
    const industry = faker.helpers.arrayElement(industries);
    const status = faker.helpers.arrayElement(leadStatuses);
    const turnover = faker.number.int({ min: 50000, max: 5000000 });

    const [lead] = await db
      .insert(leads)
      .values({
        tenantId: tenant.id,
        firstName,
        lastName,
        email: faker.internet.email({
          firstName,
          lastName,
          provider: companyName.toLowerCase().replace(/\s+/g, "") + ".com",
        }),
        phone: faker.phone.number(),
        mobile: faker.phone.number(),
        companyName,
        position: faker.person.jobTitle(),
        website: `https://www.${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
        status,
        source: faker.helpers.arrayElement(leadSources),
        industry,
        estimatedTurnover: turnover.toString(),
        estimatedEmployees: faker.number.int({ min: 1, max: 200 }),
        qualificationScore: faker.number.int({ min: 1, max: 10 }),
        interestedServices: faker.helpers.arrayElements(
          ["COMP_ACCOUNTS", "BOOK_BASIC", "VAT_STANDARD", "PAYROLL", "TAX_PLANNING"],
          { min: 1, max: 3 },
        ),
        notes: `Lead from ${faker.helpers.arrayElement(leadSources)}. ${
          status === "qualified"
            ? "High potential client, ready for proposal."
            : status === "contacted"
              ? "Initial contact made, awaiting follow-up."
              : status === "proposal_sent"
                ? "Proposal sent, awaiting response."
                : status === "negotiating"
                  ? "In active negotiations on pricing and services."
                  : "New lead, needs initial assessment."
        }`,
        lastContactedAt:
          status !== "new" ? faker.date.recent({ days: 30 }) : undefined,
        nextFollowUpAt: ["new", "contacted", "qualified"].includes(status)
          ? faker.date.soon({ days: 14 })
          : undefined,
        assignedToId: faker.helpers.arrayElement([
          ...createdUsers.map((u) => u.id),
        ]),
        createdBy: createdUsers[0].id,
      })
      .returning();

    leadsList.push(lead);
  }

  console.log(`✅ Created ${leadsList.length} leads`);

  // 7. Create Onboarding Sessions (for 5 recent clients)
  console.log("Creating onboarding sessions...");

  const ONBOARDING_TEMPLATE_TASKS = [
    {
      sequence: 10,
      taskName: "Ensure Client is Setup in Bright Manager",
      description:
        "Check client is in Bright Manager with appropriate client information, services and pricing filled in",
      required: true,
      days: 0,
      progressWeight: 5,
    },
    {
      sequence: 20,
      taskName: "Request client ID documents",
      description: "Request passport/driving license and proof of address",
      required: true,
      days: 0,
      progressWeight: 5,
    },
    {
      sequence: 25,
      taskName: "Receive and Save client ID documents",
      description: "Save client ID documents to client AML folder on OneDrive",
      required: true,
      days: 2,
      progressWeight: 5,
    },
    {
      sequence: 30,
      taskName: "Complete AML ID check",
      description:
        "Verify identity documents and complete AML compliance check",
      required: true,
      days: 4,
      progressWeight: 6,
    },
    {
      sequence: 40,
      taskName: "Perform client risk assessment and grading",
      description:
        "Assess client risk factors and determine risk level (Low/Medium/High), also a assign client a grade based off current communication quality",
      required: true,
      days: 4,
      progressWeight: 6,
    },
    {
      sequence: 50,
      taskName: "Send Letter of Engagement",
      description:
        "Send LoE detailing scope of work, from Bright Manager and ensure it is signed",
      required: true,
      days: 4,
      progressWeight: 8,
    },
    {
      sequence: 51,
      taskName: "Assign Client Manager",
      description:
        "Discuss internally to decide which person will take on the new client",
      required: true,
      days: 4,
      progressWeight: 5,
    },
    {
      sequence: 55,
      taskName: "Confirm Signing of LoE",
      description:
        "Confirm the signing of Letter of Engagement before proceeding",
      required: true,
      days: 7,
      progressWeight: 5,
    },
    {
      sequence: 60,
      taskName: "Request previous accountant clearance",
      description: "Contact previous accountant for professional clearance",
      required: false,
      days: 7,
      progressWeight: 5,
    },
    {
      sequence: 70,
      taskName: "Request and confirm relevant UTRs",
      description: "Ask client for all applicable UTRs, or register if needed",
      required: true,
      days: 7,
      progressWeight: 5,
    },
    {
      sequence: 80,
      taskName: "Request Agent Authorisation Codes",
      description: "Obtain codes for HMRC agent services",
      required: true,
      days: 7,
      progressWeight: 5,
    },
    {
      sequence: 90,
      taskName: "Setup GoCardless Direct Debit",
      description: "Setup client on GoCardless and send DD mandate",
      required: true,
      days: 7,
      progressWeight: 10,
    },
    {
      sequence: 95,
      taskName: "Confirm information received",
      description:
        "Confirm all outstanding information received before proceeding (Professional Clearance, UTRs, Authorisation codes etc)",
      required: true,
      days: 10,
      progressWeight: 5,
    },
    {
      sequence: 100,
      taskName: "Register for necessary taxes",
      description:
        "Register for applicable taxes (VAT, PAYE, etc.) Check with client manager for which period the taxes should fall under",
      required: false,
      days: 10,
      progressWeight: 5,
    },
    {
      sequence: 110,
      taskName: "Register for additional HMRC services",
      description:
        "Register for additional services such as Income Tax record, MTD for IT, CIS etc",
      required: true,
      days: 10,
      progressWeight: 5,
    },
    {
      sequence: 120,
      taskName: "Set up tasks for recurring services",
      description: "Create recurring tasks for ongoing services",
      required: true,
      days: 10,
      progressWeight: 5,
    },
    {
      sequence: 130,
      taskName: "Change client status to Active",
      description: "Update client status when onboarding is complete",
      required: true,
      days: 10,
      progressWeight: 10,
    },
  ];

  // Create sessions for 5 recent clients
  const recentClients = createdClients.slice(-5);
  for (const client of recentClients) {
    const startDate = new Date(client.createdAt);
    const targetCompletion = new Date(
      startDate.getTime() + 14 * 24 * 60 * 60 * 1000,
    );

    const sessionStatus = faker.helpers.arrayElement([
      "not_started",
      "in_progress",
      "in_progress",
      "completed",
    ]);

    const [session] = await db
      .insert(onboardingSessions)
      .values({
        tenantId: tenant.id,
        clientId: client.id,
        startDate,
        targetCompletionDate: targetCompletion,
        assignedToId: client.accountManagerId,
        priority: faker.helpers.arrayElement(["low", "medium", "high"]),
        status: sessionStatus,
        progress:
          sessionStatus === "completed"
            ? 100
            : faker.number.int({ min: 0, max: 60 }),
        actualCompletionDate:
          sessionStatus === "completed" ? targetCompletion : null,
      })
      .returning();

    // Update client status based on onboarding status
    await db
      .update(clients)
      .set({
        status: sessionStatus === "completed" ? "active" : "onboarding",
      })
      .where(eq(clients.id, client.id));

    // Create all 17 tasks for this session
    const tasksToInsert = ONBOARDING_TEMPLATE_TASKS.map((template) => {
      const dueDate = new Date(
        startDate.getTime() + template.days * 24 * 60 * 60 * 1000,
      );
      // Randomly mark some tasks as done
      const done = faker.datatype.boolean({ probability: 0.3 });

      return {
        tenantId: tenant.id,
        sessionId: session.id,
        taskName: template.taskName,
        description: template.description,
        required: template.required,
        sequence: template.sequence,
        days: template.days,
        progressWeight: template.progressWeight,
        assignedToId: client.accountManagerId,
        dueDate,
        done,
        completionDate: done
          ? faker.date.recent({ days: Math.max(1, template.days) })
          : null,
        notes: done ? faker.lorem.sentence() : null,
      };
    });

    await db.insert(onboardingTasks).values(tasksToInsert);
  }

  console.log(`✅ Created ${recentClients.length} onboarding sessions with tasks`);

  // 8. Create Tasks
  console.log("Creating tasks...");
  const taskStatuses = [
    "pending",
    "in_progress",
    "completed",
    "cancelled",
  ] as const;
  const taskPriorities = ["low", "medium", "high", "urgent"] as const;
  const taskTypes = [
    "Tax Return",
    "VAT Return",
    "Bookkeeping",
    "Payroll",
    "Annual Accounts",
    "Client Meeting",
    "Document Review",
    "Compliance Check",
  ];

  const createdTasks = [];
  for (let i = 0; i < 75; i++) {
    const status = faker.helpers.arrayElement(taskStatuses);
    const dueDate = faker.date.between({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });

    // Select the client first to ensure title matches assigned client
    const assignedClient = faker.helpers.arrayElement(createdClients);

    const task = await db
      .insert(tasks)
      .values({
        tenantId: tenant.id,
        title: `${faker.helpers.arrayElement(taskTypes)} - ${assignedClient.name}`,
        description: faker.lorem.paragraph(),
        status,
        priority: faker.helpers.arrayElement(taskPriorities),
        clientId: assignedClient.id,
        assignedToId: faker.helpers.arrayElement(createdUsers).id,
        reviewerId: faker.datatype.boolean()
          ? faker.helpers.arrayElement(createdUsers).id
          : null,
        createdById: faker.helpers.arrayElement(createdUsers).id,
        dueDate,
        targetDate: faker.date.soon({ days: 3, refDate: dueDate }),
        completedAt:
          status === "completed" ? faker.date.recent({ days: 7 }) : null,
        estimatedHours: String(faker.number.int({ min: 1, max: 20 })),
        actualHours:
          status === "completed"
            ? String(faker.number.int({ min: 1, max: 25 }))
            : null,
        progress:
          status === "completed" ? 100 : faker.number.int({ min: 0, max: 80 }),
        taskType: faker.helpers.arrayElement(taskTypes),
        category: faker.helpers.arrayElement([
          "Client Work",
          "Admin",
          "Development",
          "Support",
        ]),
        tags: faker.helpers.arrayElements(
          ["urgent", "client-request", "monthly", "quarterly", "annual"],
          { min: 0, max: 3 },
        ),
      })
      .returning();

    createdTasks.push(task[0]);
  }

  // 8. Create Time Entries
  console.log("Creating time entries...");
  const workTypes = [
    "work",
    "admin",
    "meeting",
    "training",
    "research",
  ] as const;
  const timeEntryStatuses = [
    "draft",
    "submitted",
    "approved",
    "rejected",
  ] as const;

  for (let days = 90; days >= 0; days--) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const dateStr = date.toISOString().split("T")[0];

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Each user logs 2-5 entries per day
    for (const user of createdUsers) {
      const entryCount = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < entryCount; i++) {
        const client = faker.helpers.arrayElement(createdClients);
        const relatedTasks = createdTasks.filter(
          (t) => t.clientId === client.id,
        );
        const task =
          relatedTasks.length > 0
            ? faker.helpers.arrayElement(relatedTasks)
            : null;
        const hours = faker.number.float({
          min: 0.5,
          max: 4,
          multipleOf: 0.25,
        });
        const rate = Number(user.hourlyRate || 100);

        await db.insert(timeEntries).values({
          tenantId: tenant.id,
          userId: user.id,
          clientId: client.id,
          taskId: task?.id || null,
          serviceComponentId: faker.helpers.arrayElement(createdServiceComponents)
            .id,
          date: dateStr,
          hours: String(hours),
          workType: faker.helpers.arrayElement(workTypes),
          billable: faker.datatype.boolean({ probability: 0.8 }),
          billed: faker.datatype.boolean({ probability: 0.3 }),
          rate: String(rate),
          amount: String(hours * rate),
          description: faker.lorem.sentence(),
          status:
            days > 7
              ? "approved"
              : faker.helpers.arrayElement(timeEntryStatuses),
          approvedById: days > 7 ? adminUser.id : null,
          approvedAt: days > 7 ? date : null,
        });
      }
    }
  }

  // 9. Create Invoices
  console.log("Creating invoices...");
  const invoiceStatuses = ["draft", "sent", "paid", "overdue"] as const;

  for (let i = 0; i < 30; i++) {
    const client = faker.helpers.arrayElement(createdClients);
    const status = faker.helpers.arrayElement(invoiceStatuses);
    const issueDate = faker.date.recent({ days: 60 });
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const subtotal = faker.number.float({
      min: 500,
      max: 10000,
      multipleOf: 0.01,
    });
    const taxRate = 20; // UK VAT
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const [invoice] = await db
      .insert(invoices)
      .values({
        tenantId: tenant.id,
        invoiceNumber: `INV-${String(i + 1).padStart(5, "0")}`,
        clientId: client.id,
        issueDate: issueDate.toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        paidDate:
          status === "paid"
            ? faker.date
                .between({ from: issueDate, to: new Date() })
                .toISOString()
                .split("T")[0]
            : null,
        subtotal: String(subtotal),
        taxRate: String(taxRate),
        taxAmount: String(taxAmount),
        discount: "0",
        total: String(total),
        amountPaid: status === "paid" ? String(total) : "0",
        status,
        currency: "GBP",
        notes: faker.lorem.sentence(),
        terms: "Payment due within 30 days",
        createdById: adminUser.id,
      })
      .returning();

    // Create invoice items
    const itemCount = faker.number.int({ min: 1, max: 5 });
    let remainingAmount = subtotal;

    for (let j = 0; j < itemCount; j++) {
      const isLastItem = j === itemCount - 1;
      const itemAmount = isLastItem
        ? remainingAmount
        : faker.number.float({
            min: 100,
            max: remainingAmount / 2,
            multipleOf: 0.01,
          });

      const quantity = faker.number.int({ min: 1, max: 10 });
      const rate = itemAmount / quantity;

      await db.insert(invoiceItems).values({
        invoiceId: invoice.id,
        description: faker.commerce.productDescription(),
        quantity: String(quantity),
        rate: String(rate),
        amount: String(itemAmount),
        serviceComponentId: faker.helpers.arrayElement(createdServiceComponents)
          .id,
        sortOrder: j,
      });

      remainingAmount -= itemAmount;
    }
  }

  // 10. Create Compliance Items
  console.log("Creating compliance items...");
  const complianceTypes = [
    "VAT Return",
    "Corporation Tax Return",
    "Annual Accounts",
    "PAYE Submission",
    "Confirmation Statement",
    "Self Assessment",
  ];
  const complianceStatuses = [
    "pending",
    "in_progress",
    "completed",
    "overdue",
  ] as const;

  for (const client of createdClients
    .filter((c) => c.type === "company")
    .slice(0, 15)) {
    for (const type of faker.helpers.arrayElements(complianceTypes, {
      min: 2,
      max: 4,
    })) {
      const dueDate = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      });

      const isOverdue =
        dueDate < new Date() && faker.datatype.boolean({ probability: 0.2 });

      await db.insert(compliance).values({
        tenantId: tenant.id,
        title: `${type} - ${client.name}`,
        type,
        description: faker.lorem.sentence(),
        clientId: client.id,
        assignedToId: faker.helpers.arrayElement(createdUsers).id,
        dueDate,
        completedDate: faker.datatype.boolean({ probability: 0.3 })
          ? faker.date.recent({ days: 30 })
          : null,
        reminderDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: isOverdue
          ? "overdue"
          : faker.helpers.arrayElement(complianceStatuses),
        priority: isOverdue
          ? "urgent"
          : faker.helpers.arrayElement(["low", "medium", "high"] as const),
        createdById: adminUser.id,
      });
    }
  }

  // 11. Create Workflows
  console.log("Creating workflows...");
  const workflowTemplates = [
    {
      name: "Annual Tax Return Process",
      description: "Standard workflow for completing annual tax returns",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 14,
      serviceCode: "TAX-PREP",
      stages: [
        {
          name: "Gather Documents",
          estimatedHours: 2,
          checklist: [
            "Bank statements",
            "Receipts",
            "P60s",
            "P45s if applicable",
            "P11D benefits forms",
          ],
        },
        {
          name: "Data Entry",
          estimatedHours: 4,
          checklist: [
            "Enter employment income",
            "Enter self-employment income",
            "Enter expenses",
            "Enter deductions",
            "Enter pension contributions",
          ],
        },
        {
          name: "Review & Calculations",
          estimatedHours: 3,
          checklist: [
            "Review all entries",
            "Calculate tax liability",
            "Apply tax reliefs",
            "Check for errors",
            "Optimize deductions",
          ],
        },
        {
          name: "Client Approval",
          estimatedHours: 1,
          requiresApproval: true,
          checklist: [
            "Prepare summary",
            "Send to client",
            "Get written approval",
          ],
        },
        {
          name: "Submit to HMRC",
          estimatedHours: 1,
          checklist: [
            "Final review",
            "Submit online",
            "Get confirmation",
            "Save reference",
            "Update records",
          ],
        },
      ],
    },
    {
      name: "VAT Return Process",
      description: "Quarterly VAT return preparation and submission",
      type: "task_template",
      trigger: "schedule",
      estimatedDays: 5,
      serviceCode: "VAT-RET",
      stages: [
        {
          name: "Gather Invoices",
          estimatedHours: 2,
          checklist: [
            "Collect sales invoices",
            "Collect purchase invoices",
            "Download bank statements",
            "Gather receipts",
          ],
        },
        {
          name: "Calculate VAT",
          estimatedHours: 3,
          checklist: [
            "Calculate output VAT",
            "Calculate input VAT",
            "Apply VAT schemes",
            "Check partial exemption",
          ],
        },
        {
          name: "Review Transactions",
          estimatedHours: 2,
          checklist: [
            "Review all entries",
            "Check VAT rates",
            "Verify calculations",
            "Reconcile with accounts",
          ],
        },
        {
          name: "Submit to HMRC",
          estimatedHours: 1,
          checklist: [
            "Complete VAT return",
            "Submit online",
            "Get confirmation",
            "Schedule payment",
            "File documents",
          ],
        },
      ],
    },
    {
      name: "Annual Accounts Preparation",
      description: "Complete annual accounts preparation and filing",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 21,
      serviceCode: "AUDIT",
      stages: [
        {
          name: "Trial Balance",
          estimatedHours: 4,
          checklist: [
            "Prepare trial balance",
            "Review GL accounts",
            "Clear suspense accounts",
            "Review reconciliations",
          ],
        },
        {
          name: "Draft Accounts",
          estimatedHours: 6,
          checklist: [
            "Prepare P&L",
            "Prepare balance sheet",
            "Calculate tax provision",
            "Draft notes to accounts",
            "Prepare directors report",
          ],
        },
        {
          name: "Review & Adjustments",
          estimatedHours: 4,
          checklist: [
            "Review draft accounts",
            "Post adjusting entries",
            "Update tax computation",
            "Review compliance",
            "Internal quality check",
          ],
        },
        {
          name: "Director Approval",
          estimatedHours: 2,
          requiresApproval: true,
          checklist: [
            "Present to directors",
            "Explain key changes",
            "Get board approval",
            "Obtain signatures",
          ],
        },
        {
          name: "File Accounts",
          estimatedHours: 2,
          checklist: [
            "File with Companies House",
            "Submit to HMRC",
            "Send to shareholders",
            "Update statutory books",
            "Archive documents",
          ],
        },
      ],
    },
    {
      name: "Payroll Processing",
      description: "Monthly payroll processing workflow",
      type: "task_template",
      trigger: "schedule",
      estimatedDays: 2,
      serviceCode: "PAYROLL",
      stages: [
        {
          name: "Collect Timesheets",
          estimatedHours: 1,
          checklist: [
            "Gather timesheets",
            "Review overtime",
            "Check leave records",
            "Verify hours worked",
          ],
        },
        {
          name: "Calculate Wages",
          estimatedHours: 2,
          checklist: [
            "Calculate gross pay",
            "Apply deductions",
            "Calculate PAYE",
            "Calculate NI",
            "Process benefits",
          ],
        },
        {
          name: "Process Deductions",
          estimatedHours: 1,
          checklist: [
            "Student loans",
            "Pension contributions",
            "Court orders",
            "Union fees",
            "Other deductions",
          ],
        },
        {
          name: "Submit RTI",
          estimatedHours: 1,
          checklist: [
            "Prepare FPS",
            "Submit to HMRC",
            "Get confirmation",
            "Update records",
          ],
        },
        {
          name: "Issue Payslips",
          estimatedHours: 1,
          checklist: [
            "Generate payslips",
            "Review for accuracy",
            "Send to employees",
            "Process payments",
            "File copies",
          ],
        },
      ],
    },
    {
      name: "Compliance Review",
      description: "Regulatory compliance check workflow",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 10,
      stages: [
        {
          name: "Review Requirements",
          estimatedHours: 2,
          checklist: [
            "Identify regulations",
            "Check updates",
            "Review deadlines",
            "Assess scope",
          ],
        },
        {
          name: "Gather Documentation",
          estimatedHours: 3,
          checklist: [
            "Collect policies",
            "Gather records",
            "Review procedures",
            "Interview staff",
          ],
        },
        {
          name: "Check Compliance",
          estimatedHours: 4,
          checklist: [
            "Test controls",
            "Review documentation",
            "Check procedures",
            "Identify gaps",
          ],
        },
        {
          name: "Document Findings",
          estimatedHours: 2,
          checklist: [
            "Write report",
            "Document issues",
            "Recommend actions",
            "Set priorities",
          ],
        },
        {
          name: "Submit Report",
          estimatedHours: 1,
          checklist: [
            "Finalize report",
            "Management review",
            "Submit to board",
            "File documentation",
          ],
        },
      ],
    },
    {
      name: "Document Review Process",
      description: "Standard document review and approval workflow",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 3,
      stages: [
        {
          name: "Initial Review",
          estimatedHours: 1,
          checklist: [
            "Check completeness",
            "Verify format",
            "Review scope",
            "Check references",
          ],
        },
        {
          name: "Detailed Analysis",
          estimatedHours: 2,
          checklist: [
            "Check accuracy",
            "Verify calculations",
            "Review compliance",
            "Check consistency",
          ],
        },
        {
          name: "Quality Check",
          estimatedHours: 1,
          checklist: [
            "Grammar check",
            "Format review",
            "Cross-reference",
            "Fact check",
          ],
        },
        {
          name: "Final Approval",
          estimatedHours: 1,
          requiresApproval: true,
          checklist: [
            "Final review",
            "Get approval",
            "Document decision",
            "Archive copy",
          ],
        },
      ],
    },
    {
      name: "New Client Onboarding",
      description: "Complete onboarding process for new clients",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 7,
      serviceCode: "CONSULT",
      stages: [
        {
          name: "Initial Setup",
          estimatedHours: 1,
          checklist: [
            "Create client record",
            "Set up folders",
            "Send welcome email",
            "Schedule meeting",
          ],
        },
        {
          name: "Document Collection",
          estimatedHours: 2,
          checklist: [
            "ID verification",
            "Engagement letter",
            "Bank details",
            "Tax information",
            "Company documents",
          ],
        },
        {
          name: "Service Configuration",
          estimatedHours: 1,
          checklist: [
            "Assign services",
            "Set rates",
            "Create schedule",
            "Set up billing",
          ],
        },
        {
          name: "System Access",
          estimatedHours: 1,
          checklist: [
            "Portal access",
            "Document sharing",
            "Communication setup",
            "Training provided",
          ],
        },
      ],
    },
    {
      name: "Monthly Bookkeeping",
      description: "Standard monthly bookkeeping workflow",
      type: "task_template",
      trigger: "schedule",
      estimatedDays: 3,
      serviceCode: "BOOKKEEP",
      stages: [
        {
          name: "Transaction Import",
          estimatedHours: 1,
          checklist: [
            "Import bank",
            "Import credit cards",
            "Import expenses",
            "Import invoices",
          ],
        },
        {
          name: "Categorization",
          estimatedHours: 2,
          checklist: [
            "Categorize transactions",
            "Match receipts",
            "Flag queries",
            "Code to accounts",
          ],
        },
        {
          name: "Reconciliation",
          estimatedHours: 2,
          checklist: [
            "Bank reconciliation",
            "Credit card reconciliation",
            "VAT reconciliation",
            "Balance sheet review",
          ],
        },
        {
          name: "Reporting",
          estimatedHours: 1,
          checklist: [
            "P&L report",
            "Balance sheet",
            "Cash flow",
            "Send to client",
            "File reports",
          ],
        },
      ],
    },
  ];

  for (const template of workflowTemplates) {
    // Find the service component if specified
    let serviceComponentId = null;
    if (template.serviceCode) {
      const component = createdServiceComponents.find(
        (s) => s.code === template.serviceCode,
      );
      if (component) {
        serviceComponentId = component.id;
      }
    }

    const [workflow] = await db
      .insert(workflows)
      .values({
        tenantId: tenant.id,
        name: template.name,
        description: template.description,
        type: template.type as any,
        trigger: template.trigger as any,
        estimatedDays: template.estimatedDays,
        serviceComponentId,
        isActive: true,
        config: {},
        createdById: adminUser.id,
      })
      .returning();

    // Create workflow stages
    for (let i = 0; i < template.stages.length; i++) {
      const stage = template.stages[i];
      await db.insert(workflowStages).values({
        workflowId: workflow.id,
        name: stage.name,
        description: `Stage ${i + 1} of ${template.name}`,
        stageOrder: i + 1,
        isRequired: true,
        estimatedHours: String(stage.estimatedHours),
        checklistItems: stage.checklist?.map((item, idx) => ({
          id: `item-${idx}`,
          text: item,
          isRequired: true,
        })),
        autoComplete: false,
        requiresApproval: stage.requiresApproval || false,
      });
    }
  }

  // 11.5. Assign workflows to tasks and create instances
  console.log("Assigning workflows to tasks...");

  // Get workflow IDs from database
  const createdWorkflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.tenantId, tenant.id));

  // Create a map of task types to workflows
  const workflowMap: { [key: string]: any } = {
    "Tax Return": createdWorkflows.find((w) => w.name.includes("Tax Return")),
    "VAT Return": createdWorkflows.find((w) => w.name.includes("VAT Return")),
    "Annual Accounts": createdWorkflows.find((w) =>
      w.name.includes("Annual Accounts"),
    ),
    Payroll: createdWorkflows.find((w) => w.name.includes("Payroll")),
    Bookkeeping: createdWorkflows.find((w) => w.name.includes("Bookkeeping")),
    "Client Meeting": createdWorkflows.find((w) =>
      w.name.includes("Client Onboarding"),
    ),
    "Compliance Check": createdWorkflows.find((w) =>
      w.name.includes("Compliance Review"),
    ),
    "Document Review": createdWorkflows.find((w) =>
      w.name.includes("Document Review"),
    ),
  };

  // Assign workflows to matching tasks based on task_type
  for (const task of createdTasks) {
    if (!task.taskType) continue;
    const workflowToAssign = workflowMap[task.taskType];

    if (workflowToAssign) {
      // Update task with workflow ID
      await db
        .update(tasks)
        .set({ workflowId: workflowToAssign.id })
        .where(eq(tasks.id, task.id));

      // Get workflow stages
      const stages = await db
        .select()
        .from(workflowStages)
        .where(eq(workflowStages.workflowId, workflowToAssign.id))
        .orderBy(workflowStages.stageOrder);

      // Create workflow instance
      await db.insert(taskWorkflowInstances).values({
        taskId: task.id,
        workflowId: workflowToAssign.id,
        currentStageId: stages[0]?.id || null,
        status: "active",
        stageProgress: {},
      });
    }
  }

  const workflowInstanceCount = await db
    .select()
    .from(taskWorkflowInstances)
    .then((r) => r.length);

  console.log(`✓ ${workflowInstanceCount} Workflow instances created`);

  // 12. Create Documents
  console.log("Creating documents...");
  const _documentTypes = ["file", "folder"] as const;
  const fileTypes = [
    { name: "Tax Return 2023.pdf", mimeType: "application/pdf", size: 245678 },
    { name: "Invoice_March.pdf", mimeType: "application/pdf", size: 123456 },
    { name: "Bank_Statement.pdf", mimeType: "application/pdf", size: 456789 },
    { name: "Receipts.zip", mimeType: "application/zip", size: 2345678 },
    {
      name: "Accounts_2023.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 345678,
    },
    {
      name: "Meeting_Notes.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 123456,
    },
  ];

  // Create root folders
  const rootFolders = [
    "Tax Returns",
    "Invoices",
    "Bank Statements",
    "Contracts",
    "Correspondence",
  ];
  for (const folderName of rootFolders) {
    const [folder] = await db
      .insert(documents)
      .values({
        tenantId: tenant.id,
        name: folderName,
        type: "folder",
        path: `/${folderName}`,
        uploadedById: adminUser.id,
      })
      .returning();

    // Add some files to each folder
    for (let i = 0; i < faker.number.int({ min: 2, max: 5 }); i++) {
      const fileTemplate = faker.helpers.arrayElement(fileTypes);
      const client = faker.helpers.arrayElement(createdClients);

      await db.insert(documents).values({
        tenantId: tenant.id,
        name: `${client.name}_${fileTemplate.name}`,
        type: "file",
        mimeType: fileTemplate.mimeType,
        size: fileTemplate.size,
        parentId: folder.id,
        path: `/${folderName}/${client.name}_${fileTemplate.name}`,
        clientId: client.id,
        uploadedById: faker.helpers.arrayElement(createdUsers).id,
        description: faker.lorem.sentence(),
        tags: faker.helpers.arrayElements(
          ["important", "archived", "pending-review", "approved"],
          { min: 0, max: 2 },
        ),
      });
    }
  }

  // 13. Create Activity Logs
  console.log("Creating activity logs...");
  const actions = [
    "created",
    "updated",
    "completed",
    "assigned",
    "status_changed",
  ];
  const entityTypes = ["task", "client", "invoice", "compliance", "document"];

  for (let i = 0; i < 100; i++) {
    const entityType = faker.helpers.arrayElement(entityTypes);
    const action = faker.helpers.arrayElement(actions);
    const user = faker.helpers.arrayElement(createdUsers);

    let entityId: string;
    let entityName: string;

    switch (entityType) {
      case "task": {
        const task = faker.helpers.arrayElement(createdTasks);
        entityId = task.id;
        entityName = task.title;
        break;
      }
      case "client": {
        const client = faker.helpers.arrayElement(createdClients);
        entityId = client.id;
        entityName = client.name;
        break;
      }
      case "invoice":
        entityId = faker.string.uuid();
        entityName = `Invoice #${faker.number.int({ min: 1000, max: 9999 })}`;
        break;
      default:
        entityId = faker.string.uuid();
        entityName = `${entityType} Item`;
    }

    await db.insert(activityLogs).values({
      tenantId: tenant.id,
      entityType,
      entityId,
      action,
      description: `${user.firstName} ${user.lastName} ${action} ${entityType} "${entityName}"`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      createdAt: faker.date.recent({ days: 30 }),
      metadata: {
        browser: faker.helpers.arrayElement([
          "Chrome",
          "Firefox",
          "Safari",
          "Edge",
        ]),
        os: faker.helpers.arrayElement(["Windows", "MacOS", "Linux"]),
      },
    });
  }

  console.log("✅ Database seeding completed!");

  // Print summary
  console.log("\n📊 Seed Summary:");
  console.log("================");
  console.log(`✓ 1 Tenant created`);
  console.log(`✓ ${createdUsers.length} Users created`);
  console.log(`✓ 3 Portal categories created`);
  console.log(`✓ 20 Portal links created (internal modules + external tools)`);
  console.log(
    `✓ ${createdServiceComponents.length} Service Components created`,
  );
  console.log(`✓ ${createdPricingRules.length} Pricing Rules created`);
  console.log(`✓ ${createdClients.length} Clients created`);
  console.log(`✓ ${createdTasks.length} Tasks created`);
  console.log(`✓ 30 Invoices created`);
  console.log(`✓ Multiple time entries created (last 90 days)`);
  console.log(`✓ Compliance items created`);
  console.log(`✓ Document structure created`);
  console.log(`✓ ${workflowTemplates.length} Workflow templates created`);
  console.log(`✓ 100 Activity logs created`);

  console.log("\n👤 Test Users:");
  console.log("==============");
  for (const user of userList) {
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`---`);
  }

  console.log("\n🎉 You can now log in with any of the above users!");
  console.log(
    "Note: In development, authentication will auto-create these users with Clerk.",
  );
}

async function main() {
  try {
    // Check if we should clear first
    const shouldClear =
      process.argv.includes("--clear") || process.argv.includes("-c");

    if (shouldClear) {
      await clearDatabase();
    }

    await seedDatabase();

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
