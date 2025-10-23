// Environment variables are loaded via tsx -r dotenv/config in package.json
import crypto from "node:crypto";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  activityLogs,
  calendarEventAttendees,
  calendarEvents,
  clientContacts,
  clientDirectors,
  clientPortalAccess,
  clientPortalInvitations,
  clientPortalUsers,
  clientPSCs,
  clientServices,
  clients,
  clientTaskTemplateOverrides,
  compliance,
  departments,
  documents,
  importLogs,
  integrationSettings,
  invitations,
  invoiceItems,
  invoices,
  leads,
  legalPages,
  messages,
  messageThreadParticipants,
  messageThreads,
  notifications,
  onboardingSessions,
  onboardingTasks,
  portalCategories,
  portalLinks,
  pricingRules,
  proposalServices,
  proposals,
  proposalVersions,
  services,
  staffCapacity,
  taskAssignmentHistory,
  taskNotes,
  tasks,
  taskTemplates,
  taskWorkflowInstances,
  tenants,
  timeEntries,
  timesheetSubmissions,
  userSettings,
  users,
  workflowStages,
  workflows,
  workflowTemplates,
  workflowVersions,
  xeroWebhookEvents,
} from "../lib/db/schema";

// Set a consistent seed for reproducible data
faker.seed(12345);

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");

  // Delete in reverse order of dependencies
  await db.delete(activityLogs);
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(timesheetSubmissions);
  await db.delete(timeEntries);
  await db.delete(taskWorkflowInstances);
  await db.delete(workflowVersions);
  await db.delete(workflowStages);
  await db.delete(workflowTemplates);
  await db.delete(workflows);
  await db.delete(documents);
  await db.delete(compliance);
  await db.delete(clientServices);
  await db.delete(taskAssignmentHistory);
  await db.delete(tasks);
  await db.delete(onboardingTasks);
  await db.delete(onboardingSessions);
  await db.delete(clientPSCs);
  await db.delete(clientDirectors);
  await db.delete(clientContacts);
  await db.delete(proposalServices);
  await db.delete(proposals);
  await db.delete(clients);
  await db.delete(leads);
  await db.delete(clientTaskTemplateOverrides);
  await db.delete(taskTemplates);
  await db.delete(pricingRules);
  await db.delete(services);

  // Clear portal data
  await db.delete(portalLinks);
  await db.delete(portalCategories);

  // Clear legal pages
  await db.delete(legalPages);

  // Clear integration and import data
  await db.delete(importLogs);
  await db.delete(integrationSettings);

  // Clear webhook data
  await db.delete(xeroWebhookEvents);

  await db.delete(invitations);
  await db.delete(staffCapacity);
  await db.delete(userSettings);
  await db.delete(users);
  await db.delete(departments);
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
      id: crypto.randomUUID(), // Better Auth requires text ID
      name: "Demo Accounting Firm",
      slug: "demo-firm",
      metadata: {
        company: {
          name: "Demo Accounting Firm",
          email: "info@demo-firm.com",
          phone: "+44 20 1234 5678",
          address: {
            street: "123 Business Street",
            city: "London",
            postcode: "SW1A 1AA",
            country: "United Kingdom",
          },
        },
        regional: {
          currency: "GBP",
          dateFormat: "DD/MM/YYYY",
          timezone: "Europe/London",
        },
        fiscal: {
          fiscalYearStart: "04-06",
        },
      },
    })
    .returning();

  // 2. Create Departments
  console.log("Creating departments...");
  const departmentList = [
    {
      id: crypto.randomUUID(),
      name: "Tax",
      description: "Tax preparation, planning, and compliance services",
      managerId: null, // Will be set after users are created
    },
    {
      id: crypto.randomUUID(),
      name: "Audit",
      description: "Financial audits and assurance services",
      managerId: null,
    },
    {
      id: crypto.randomUUID(),
      name: "Advisory",
      description: "Business advisory and consulting services",
      managerId: null,
    },
    {
      id: crypto.randomUUID(),
      name: "Admin",
      description: "Administrative and support functions",
      managerId: null,
    },
  ];

  const createdDepartments = await db
    .insert(departments)
    .values(
      departmentList.map((dept) => ({
        ...dept,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  const [taxDept, auditDept, advisoryDept, adminDept] = createdDepartments;

  // 3. Create Users (team members)
  console.log("Creating users...");
  const userList = [
    {
      email: "joe@pageivy.com",
      firstName: "Joe",
      lastName: "Test",
      name: "Joe Test",
      role: "admin",
      hourlyRate: "150",
      emailVerified: true,
      departmentId: adminDept.id, // Admin department
    },
    {
      email: "sarah.johnson@demo.com",
      firstName: "Sarah",
      lastName: "Johnson",
      name: "Sarah Johnson",
      role: "accountant",
      hourlyRate: "120",
      emailVerified: true,
      departmentId: taxDept.id, // Tax department
    },
    {
      email: "mike.chen@demo.com",
      firstName: "Mike",
      lastName: "Chen",
      name: "Mike Chen",
      role: "accountant",
      hourlyRate: "110",
      emailVerified: true,
      departmentId: auditDept.id, // Audit department
    },
    {
      email: "emily.davis@demo.com",
      firstName: "Emily",
      lastName: "Davis",
      name: "Emily Davis",
      role: "member",
      hourlyRate: "85",
      emailVerified: true,
      departmentId: advisoryDept.id, // Advisory department
    },
  ];

  const createdUsers = await db
    .insert(users)
    .values(
      userList.map((user) => ({
        id: crypto.randomUUID(), // Better Auth requires text ID
        ...user,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  const [adminUser, sarahUser, mikeUser, emilyUser] = createdUsers;

  // 3.1. Update Departments with Managers
  console.log("Updating departments with managers...");
  await db
    .update(departments)
    .set({ managerId: sarahUser.id })
    .where(eq(departments.id, taxDept.id));

  await db
    .update(departments)
    .set({ managerId: mikeUser.id })
    .where(eq(departments.id, auditDept.id));

  await db
    .update(departments)
    .set({ managerId: emilyUser.id })
    .where(eq(departments.id, advisoryDept.id));

  await db
    .update(departments)
    .set({ managerId: adminUser.id })
    .where(eq(departments.id, adminDept.id));

  // 3.2. Create User Settings
  console.log("Creating user settings...");
  await db.insert(userSettings).values(
    createdUsers.map((user) => ({
      id: crypto.randomUUID(),
      userId: user.id,
      emailNotifications: true,
      inAppNotifications: true,
      digestEmail: user.role === "admin" ? "daily" : "weekly",
      theme: "system",
      language: "en",
      timezone: "Europe/London",
    })),
  );

  // 3.3. Create Staff Capacity Records
  console.log("Creating staff capacity records...");
  const currentDate = new Date();
  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

  await db.insert(staffCapacity).values([
    // Joe (admin) - Full time (37.5 hours/week)
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      userId: adminUser.id,
      effectiveFrom: threeMonthsAgo.toISOString().split("T")[0],
      weeklyHours: 37.5,
      notes: "Full-time admin capacity",
    },
    // Sarah (accountant) - Full time (37.5 hours/week)
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      userId: sarahUser.id,
      effectiveFrom: threeMonthsAgo.toISOString().split("T")[0],
      weeklyHours: 37.5,
      notes: "Full-time senior accountant",
    },
    // Mike (accountant) - Full time (37.5 hours/week)
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      userId: mikeUser.id,
      effectiveFrom: threeMonthsAgo.toISOString().split("T")[0],
      weeklyHours: 37.5,
      notes: "Full-time accountant",
    },
    // Emily (member) - Part time (20 hours/week)
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      userId: emilyUser.id,
      effectiveFrom: threeMonthsAgo.toISOString().split("T")[0],
      weeklyHours: 20,
      notes: "Part-time junior accountant",
    },
  ]);

  // 2.5. Create Invitations
  console.log("Creating invitations...");
  await db.insert(invitations).values([
    {
      tenantId: tenant.id,
      email: "newuser@example.com",
      role: "accountant",
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: adminUser.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      tenantId: tenant.id,
      email: "teammember@example.com",
      role: "member",
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: adminUser.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  ]);

  // 2.6. Create Legal Pages
  console.log("Creating legal pages...");
  await db.insert(legalPages).values([
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      pageType: "privacy",
      content: `# Privacy Policy

**Last Updated:** ${new Date().toISOString().split("T")[0]}

## Introduction

This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Practice Hub platform. We are committed to protecting your privacy and ensuring transparency in how we handle your data in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

## Data Controller

The data controller responsible for your personal information is:

**[Company Name]**
[Address]
[Contact Email]
[Contact Phone]

## Information We Collect

### Personal Information
We collect the following types of personal information:
- Name and contact information (email, phone number, address)
- Professional information (company name, role, industry)
- Account credentials and authentication data
- Financial information (for billing purposes)
- Communication records and correspondence

### Usage Data
We automatically collect certain information when you use our platform:
- Log data (IP address, browser type, pages visited)
- Device information (device type, operating system)
- Usage patterns and interaction data
- Performance and diagnostic data

## Legal Basis for Processing

We process your personal data under the following legal bases:
- **Contract Performance:** To provide our services and fulfill our contractual obligations
- **Legitimate Interests:** To improve our services, prevent fraud, and ensure security
- **Legal Obligation:** To comply with legal and regulatory requirements
- **Consent:** Where specifically obtained for certain processing activities

## How We Use Your Information

We use your personal information to:
- Provide, maintain, and improve our services
- Process transactions and manage your account
- Communicate with you about our services
- Provide customer support
- Send administrative and service-related communications
- Ensure platform security and prevent fraud
- Comply with legal obligations
- Analyze usage to improve user experience

## Data Sharing and Disclosure

We may share your personal information with:
- **Service Providers:** Third-party vendors who assist in operating our platform
- **Legal Authorities:** When required by law or to protect our rights
- **Business Transfers:** In connection with mergers, acquisitions, or asset sales

We do not sell your personal information to third parties.

## Your Rights

Under UK GDPR, you have the following rights:
- **Right of Access:** Request access to your personal data
- **Right to Rectification:** Request correction of inaccurate data
- **Right to Erasure:** Request deletion of your data
- **Right to Restrict Processing:** Request limitation of processing
- **Right to Data Portability:** Receive your data in a structured format
- **Right to Object:** Object to processing based on legitimate interests

To exercise your rights, please contact us at [data protection email].

## Security

We implement appropriate technical and organizational measures to protect your personal information, including encryption, access controls, and regular security assessments.

## Contact Us

If you have questions about this Privacy Policy, please contact our Data Protection Officer at [email address].

You also have the right to lodge a complaint with the Information Commissioner's Office (ICO):
- Website: https://ico.org.uk
- Phone: 0303 123 1113

---

*This is a placeholder Privacy Policy. It must be reviewed and approved by legal counsel before production deployment.*`,
      version: 1,
      updatedBy: adminUser.id,
    },
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      pageType: "terms",
      content: `# Terms of Service

**Last Updated:** ${new Date().toISOString().split("T")[0]}

## Agreement to Terms

By accessing and using Practice Hub ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.

## Description of Service

Practice Hub is a cloud-based practice management platform designed for accountancy firms and professional services.

## Account Registration

### Eligibility
You must be at least 18 years old to use the Service.

### Account Security
You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.

### Accurate Information
You agree to provide accurate, current, and complete information during registration.

## Acceptable Use

### Permitted Use
You may use the Service only for lawful purposes and in accordance with these Terms.

### Prohibited Activities
You may not:
- Violate any applicable laws or regulations
- Infringe upon intellectual property rights
- Upload malicious code or viruses
- Attempt unauthorized access to the Service
- Interfere with or disrupt the Service
- Use the Service to transmit spam

## Intellectual Property

The Service and its content are owned by us and protected by copyright and trademark laws. You retain ownership of content you upload.

## Payment Terms

### Subscription Fees
Access requires payment of subscription fees as outlined in your selected plan.

### Billing
Fees are billed in advance monthly or annually. All fees are non-refundable except as required by law.

## Termination

We may suspend or terminate your account if you breach these Terms. Upon termination, your right to access the Service ceases immediately.

## Disclaimers

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.

## Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.

## Governing Law

These Terms are governed by the laws of England and Wales.

## Contact Information

For questions about these Terms, please contact: [Email]

---

*This is a placeholder Terms of Service. It must be reviewed and approved by legal counsel before production deployment.*`,
      version: 1,
      updatedBy: adminUser.id,
    },
    {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      pageType: "cookie_policy",
      content: `# Cookie Policy

**Last Updated:** ${new Date().toISOString().split("T")[0]}

## Introduction

This Cookie Policy explains how Practice Hub uses cookies and similar tracking technologies on our platform.

## What Are Cookies?

Cookies are small text files placed on your device when you visit a website.

## How We Use Cookies

### Essential Cookies (Strictly Necessary)
These cookies are necessary for the platform to function:
- Authentication and session management
- Security and fraud prevention
- Load balancing

### Functional Cookies
These enable enhanced functionality:
- Remember your preferences (theme, language)
- Store feature preferences

### Analytics Cookies
These help us understand usage:
- Analyze usage patterns
- Measure platform performance
- Identify and fix issues

## Cookies We Use

| Cookie Name | Type | Purpose | Duration |
|-------------|------|---------|----------|
| session_token | Essential | Session management | Session |
| auth_token | Essential | Authentication | 30 days |
| theme | Functional | Theme preference | 1 year |

## Your Cookie Choices

### Managing Cookies
You can control cookies through your browser settings. Note that blocking essential cookies may impact functionality.

### Browser Settings
Most browsers allow you to view, delete, and block cookies in their privacy settings.

## Third-Party Cookies

We may use third-party services that set their own cookies:
- **Microsoft Azure AD:** For authentication
- **Sentry:** For error monitoring

## Contact Us

If you have questions about our use of cookies, please contact: [Email]

For more information, visit the ICO website: https://ico.org.uk

---

*This is a placeholder Cookie Policy. It must be reviewed and approved by legal counsel before production deployment.*`,
      version: 1,
      updatedBy: adminUser.id,
    },
  ]);

  // 2.7. Create Portal Categories and Links
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
      title: "Client Admin",
      description: "Manage external client portal users and access",
      url: "/client-admin",
      iconName: "Users",
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
      description:
        "Transaction categorization and basic reconciliation in Xero",
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
      description: "Minutes, resolutions, register maintenance, all filings",
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
      description: "Group structures, multiple entities, complex changes",
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

  const createdServices = await db
    .insert(services)
    .values(
      serviceComponentsList.map((component) => ({
        ...component,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  console.log(`✓ Created ${createdServices.length} services`);

  // 4. Create Pricing Rules
  console.log("Creating pricing rules...");

  // Helper to find service by code
  const getService = (code: string) =>
    // biome-ignore lint/style/noNonNullAssertion: seed data - services guaranteed to exist
    createdServices.find((c) => c.code === code)!;

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

  // biome-ignore lint/suspicious/noExplicitAny: seed data only
  const pricingRulesList: any[] = [];

  // COMP_ACCOUNTS - Turnover-based pricing
  const accountsPrices = [49, 59, 79, 99, 119, 139, 159];
  turnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      serviceId: getService("COMP_ACCOUNTS").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: accountsPrices[index].toString(),
    });
  });

  // COMP_ACCOUNTS - Transaction-based pricing (Model B)
  // Base £30 + £0.15 per transaction
  pricingRulesList.push({
    serviceId: getService("COMP_ACCOUNTS").id,
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
      serviceId: getService("VAT_STANDARD").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: vatPrices[index].toString(),
    });
  });

  // VAT_STANDARD - Transaction-based pricing (Model B)
  // £0.10 per transaction (minimum £20)
  pricingRulesList.push({
    serviceId: getService("VAT_STANDARD").id,
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
      serviceId: getService("BOOK_BASIC").id,
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
      serviceId: getService("BOOK_BASIC").id,
      ruleType: "transaction_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: band.price.toString(),
    });
  });

  // BOOK_BASIC - High volume transaction pricing (500+)
  pricingRulesList.push({
    serviceId: getService("BOOK_BASIC").id,
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
        serviceId: getService("BOOK_FULL").id,
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
        serviceId: getService("BOOK_FULL").id,
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
      serviceId: getService("BOOK_FULL").id,
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
      serviceId: getService("MGMT_MONTHLY").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: mgmtMonthlyPrices[index].toString(),
    });
  });

  // MGMT_QUARTERLY - Turnover-based pricing (50% of monthly)
  mgmtMonthlyTurnoverBands.forEach((band, index) => {
    pricingRulesList.push({
      serviceId: getService("MGMT_QUARTERLY").id,
      ruleType: "turnover_band" as const,
      minValue: band.min.toString(),
      maxValue: band.max.toString(),
      price: (mgmtMonthlyPrices[index] * 0.5).toString(),
    });
  });

  // PAYROLL_STANDARD - Employee count based pricing (Monthly frequency base)
  const payrollEmployeeBands = [
    {
      minEmployees: 1,
      maxEmployees: 1,
      price: 18,
      description: "Director only",
    },
    { minEmployees: 2, maxEmployees: 2, price: 35, description: "2 employees" },
    { minEmployees: 3, maxEmployees: 3, price: 50, description: "3 employees" },
    {
      minEmployees: 4,
      maxEmployees: 5,
      price: 65,
      description: "4-5 employees",
    },
    {
      minEmployees: 6,
      maxEmployees: 10,
      price: 90,
      description: "6-10 employees",
    },
    {
      minEmployees: 11,
      maxEmployees: 15,
      price: 130,
      description: "11-15 employees",
    },
    {
      minEmployees: 16,
      maxEmployees: 20,
      price: 170,
      description: "16-20 employees",
    },
  ];

  payrollEmployeeBands.forEach((band) => {
    // Monthly (base rate)
    pricingRulesList.push({
      serviceId: getService("PAYROLL_STANDARD").id,
      ruleType: "employee_band" as const,
      minValue: band.minEmployees.toString(),
      maxValue: band.maxEmployees.toString(),
      price: band.price.toString(),
      metadata: { frequency: "monthly", description: band.description },
    });

    // Weekly (3x monthly rate)
    pricingRulesList.push({
      serviceId: getService("PAYROLL_STANDARD").id,
      ruleType: "employee_band" as const,
      minValue: band.minEmployees.toString(),
      maxValue: band.maxEmployees.toString(),
      price: (band.price * 3).toString(),
      metadata: { frequency: "weekly", description: band.description },
    });

    // Fortnightly (2x monthly rate)
    pricingRulesList.push({
      serviceId: getService("PAYROLL_STANDARD").id,
      ruleType: "employee_band" as const,
      minValue: band.minEmployees.toString(),
      maxValue: band.maxEmployees.toString(),
      price: (band.price * 2).toString(),
      metadata: { frequency: "fortnightly", description: band.description },
    });

    // 4-Weekly (2x monthly rate)
    pricingRulesList.push({
      serviceId: getService("PAYROLL_STANDARD").id,
      ruleType: "employee_band" as const,
      minValue: band.minEmployees.toString(),
      maxValue: band.maxEmployees.toString(),
      price: (band.price * 2).toString(),
      metadata: { frequency: "4weekly", description: band.description },
    });
  });

  // PAYROLL_STANDARD - Per employee pricing for 20+ employees
  const payrollPerEmployeePricing = [
    { frequency: "monthly", pricePerEmployee: 5, basePrice: 170 },
    { frequency: "weekly", pricePerEmployee: 15, basePrice: 510 },
    { frequency: "fortnightly", pricePerEmployee: 10, basePrice: 340 },
    { frequency: "4weekly", pricePerEmployee: 10, basePrice: 340 },
  ];

  payrollPerEmployeePricing.forEach((pricing) => {
    pricingRulesList.push({
      serviceId: getService("PAYROLL_STANDARD").id,
      ruleType: "per_unit" as const,
      minValue: "21",
      price: pricing.pricePerEmployee.toString(),
      metadata: {
        frequency: pricing.frequency,
        basePrice: pricing.basePrice,
        description: `Per employee over 20 (${pricing.frequency})`,
      },
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

  // 5. Create Task Templates
  console.log("Creating task templates...");

  const taskTemplatesList = [
    // Company Accounts Templates
    {
      serviceId: getService("COMP_ACCOUNTS").id,
      namePattern: "Prepare Company Accounts for {client_name}",
      descriptionPattern:
        "Prepare year-end accounts for {client_name} - Tax year {tax_year}",
      estimatedHours: 8,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 9, // 9 months after year-end
      dueDateOffsetDays: 0,
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_ACCOUNTS").id,
      namePattern: "Review Company Accounts for {client_name}",
      descriptionPattern:
        "Manager review of accounts for {client_name} before filing",
      estimatedHours: 2,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 9,
      dueDateOffsetDays: -7, // 7 days before main task due
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_ACCOUNTS").id,
      namePattern: "File Company Accounts for {client_name}",
      descriptionPattern:
        "Submit accounts to Companies House for {client_name}",
      estimatedHours: 1,
      priority: "urgent" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 9,
      dueDateOffsetDays: -3, // 3 days before deadline
      isRecurring: true,
    },
    // VAT Return Templates
    {
      serviceId: getService("VAT_STANDARD").id,
      namePattern: "Prepare VAT Return for {client_name} - {period}",
      descriptionPattern:
        "Prepare quarterly VAT return for {client_name} - Period: {period}",
      estimatedHours: 3,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 30, // 30 days after quarter end
      isRecurring: true,
    },
    {
      serviceId: getService("VAT_STANDARD").id,
      namePattern: "Review VAT Return for {client_name} - {period}",
      descriptionPattern: "Manager review of VAT return before submission",
      estimatedHours: 0.5,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 30,
      isRecurring: true,
    },
    {
      serviceId: getService("VAT_STANDARD").id,
      namePattern: "File VAT Return for {client_name} - {period}",
      descriptionPattern: "Submit VAT return to HMRC for period {period}",
      estimatedHours: 0.5,
      priority: "urgent" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 37, // 7 days before deadline (30 + 7)
      isRecurring: true,
    },
    // Bookkeeping Basic Templates
    {
      serviceId: getService("BOOK_BASIC").id,
      namePattern: "Monthly Bookkeeping for {client_name} - {month} {year}",
      descriptionPattern:
        "Process monthly transactions and reconcile bank accounts for {client_name}",
      estimatedHours: 4,
      priority: "medium" as const,
      taskType: "bookkeeping",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 15, // 15 days after month end
      isRecurring: true,
    },
    {
      serviceId: getService("BOOK_BASIC").id,
      namePattern: "Bank Reconciliation for {client_name} - {month} {year}",
      descriptionPattern: "Reconcile all bank accounts for {client_name}",
      estimatedHours: 1,
      priority: "medium" as const,
      taskType: "bookkeeping",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 10,
      isRecurring: true,
    },
    // Bookkeeping Full Templates
    {
      serviceId: getService("BOOK_FULL").id,
      namePattern:
        "Full Bookkeeping Service for {client_name} - {month} {year}",
      descriptionPattern:
        "Comprehensive bookkeeping including invoicing, expenses, and reporting",
      estimatedHours: 8,
      priority: "medium" as const,
      taskType: "bookkeeping",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 20,
      isRecurring: true,
    },
    {
      serviceId: getService("BOOK_FULL").id,
      namePattern: "Management Accounts for {client_name} - {month} {year}",
      descriptionPattern: "Prepare monthly management accounts and KPI reports",
      estimatedHours: 3,
      priority: "high" as const,
      taskType: "management",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 25,
      isRecurring: true,
    },
    // Payroll Templates
    {
      serviceId: getService("PAYROLL_STANDARD").id,
      namePattern: "Process Payroll for {client_name} - {month} {year}",
      descriptionPattern:
        "Calculate and process monthly payroll for {client_name}",
      estimatedHours: 2,
      priority: "high" as const,
      taskType: "payroll",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 28, // End of month
      isRecurring: true,
    },
    {
      serviceId: getService("PAYROLL_STANDARD").id,
      namePattern: "Submit RTI for {client_name} - {month} {year}",
      descriptionPattern:
        "Submit Real Time Information (RTI) to HMRC for payroll period",
      estimatedHours: 0.5,
      priority: "urgent" as const,
      taskType: "payroll",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 28,
      isRecurring: true,
    },
    // Corporation Tax Templates
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "Prepare Corporation Tax Return for {client_name}",
      descriptionPattern:
        "Prepare CT600 for {client_name} - Tax year {tax_year}",
      estimatedHours: 6,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 12, // 12 months after year-end
      dueDateOffsetDays: 0,
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "Review Corporation Tax Return for {client_name}",
      descriptionPattern: "Manager review of CT600 before submission",
      estimatedHours: 1.5,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 12,
      dueDateOffsetDays: -7,
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "File Corporation Tax Return for {client_name}",
      descriptionPattern: "Submit CT600 to HMRC for {client_name}",
      estimatedHours: 1,
      priority: "urgent" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 12,
      dueDateOffsetDays: -3,
      isRecurring: true,
    },
    // Self Assessment Templates
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "Prepare Self Assessment for {client_name} - {tax_year}",
      descriptionPattern:
        "Prepare personal tax return for {client_name} - Tax year {tax_year}",
      estimatedHours: 4,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 275, // ~9 months (January 31 deadline)
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "Review Self Assessment for {client_name}",
      descriptionPattern: "Review personal tax return before submission",
      estimatedHours: 1,
      priority: "high" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 270,
      isRecurring: true,
    },
    {
      serviceId: getService("COMP_SATR").id,
      namePattern: "File Self Assessment for {client_name}",
      descriptionPattern: "Submit personal tax return to HMRC",
      estimatedHours: 0.5,
      priority: "urgent" as const,
      taskType: "compliance",
      dueDateOffsetMonths: 0,
      dueDateOffsetDays: 275,
      isRecurring: true,
    },
    // Confirmation Statement Template
    {
      serviceId: getService("COMP_CONFIRMATION").id,
      namePattern: "File Confirmation Statement for {client_name}",
      descriptionPattern:
        "Submit annual confirmation statement to Companies House for {client_name}",
      estimatedHours: 1,
      priority: "high" as const,
      taskType: "secretarial",
      dueDateOffsetMonths: 12, // 12 months after incorporation anniversary
      dueDateOffsetDays: -14, // 14 days before deadline
      isRecurring: true,
    },
  ];

  const createdTaskTemplates = await db
    .insert(taskTemplates)
    .values(
      taskTemplatesList.map((template) => ({
        ...template,
        tenantId: tenant.id,
        isActive: true,
      })),
    )
    .returning();

  console.log(`✓ Created ${createdTaskTemplates.length} task templates`);

  // 6. Create Clients
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
      clientCode: `CLIENT-${String(i + 1).padStart(3, "0")}`,
      name: isCompany ? faker.company.name() : faker.person.fullName(),
      type: isCompany
        ? faker.helpers.arrayElement(["company", "partnership"] as const)
        : faker.helpers.arrayElement(["individual", "trust"] as const),
      status: faker.helpers.arrayElement(clientStatuses),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      website: isCompany ? faker.internet.url() : null,
      vatRegistered: isCompany,
      vatNumber: isCompany ? `GB${faker.string.numeric(9)}` : null,
      vatValidationStatus: isCompany
        ? faker.helpers.arrayElement(["valid", "pending", null] as const)
        : null,
      vatValidatedAt:
        isCompany && faker.datatype.boolean()
          ? faker.date.recent({ days: 30 })
          : null,
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
      createdServices,
      serviceCount,
    );

    for (const component of selectedComponents) {
      await db.insert(clientServices).values({
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: component.id,
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
          provider: `${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
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
          [
            "COMP_ACCOUNTS",
            "BOOK_BASIC",
            "VAT_STANDARD",
            "PAYROLL",
            "TAX_PLANNING",
          ],
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

  // 7. Create Proposals with varied sales stages
  console.log("Creating proposals...");

  const salesStages = [
    "enquiry",
    "qualified",
    "proposal_sent",
    "follow_up",
    "won",
    "lost",
    "dormant",
  ] as const;

  const proposalStatuses = [
    "draft",
    "sent",
    "viewed",
    "signed",
    "rejected",
  ] as const;

  const proposalsList: any[] = [];

  // Create 20 proposals across different stages
  for (let i = 0; i < 20; i++) {
    const randomClient = faker.helpers.arrayElement(createdClients);
    const randomUser = faker.helpers.arrayElement(createdUsers);
    const salesStage = faker.helpers.arrayElement(salesStages);

    // Determine status based on stage
    let status: (typeof proposalStatuses)[number];
    if (salesStage === "won") {
      status = "signed";
    } else if (salesStage === "lost") {
      status = "rejected";
    } else if (salesStage === "proposal_sent" || salesStage === "follow_up") {
      status = faker.helpers.arrayElement(["sent", "viewed"]);
    } else {
      status = "draft";
    }

    const monthlyTotal = faker.number.float({
      min: 500,
      max: 5000,
      fractionDigits: 2,
    });
    const annualTotal = monthlyTotal * 12;

    const [proposal] = await db
      .insert(proposals)
      .values({
        tenantId: tenant.id,
        clientId: randomClient.id,
        proposalNumber: `PROP-${String(i + 1).padStart(4, "0")}`,
        title: `${faker.company.buzzPhrase()} Services for ${randomClient.name}`,
        status,
        salesStage,
        turnover: faker.helpers.arrayElement([
          "50k-100k",
          "100k-250k",
          "250k-500k",
          "500k-1M",
          "1M+",
        ]),
        industry:
          randomClient.industry ||
          faker.helpers.arrayElement([
            "Technology",
            "Retail",
            "Healthcare",
            "Manufacturing",
            "Professional Services",
          ]),
        monthlyTransactions: faker.number.int({ min: 50, max: 500 }),
        pricingModelUsed: faker.helpers.arrayElement(["model_a", "model_b"]),
        monthlyTotal: String(monthlyTotal),
        annualTotal: String(annualTotal),
        notes: faker.lorem.paragraph(),
        termsAndConditions: "Standard terms and conditions apply.",
        validUntil: faker.date.future({ years: 0.25 }),
        createdById: randomUser.id,
        assignedToId: faker.helpers.arrayElement(createdUsers).id, // Randomly assign to a user
        ...(salesStage === "lost"
          ? {
              lossReason: faker.helpers.arrayElement([
                "Price too high",
                "Chose competitor",
                "No longer needed",
                "Budget constraints",
                "Timing not right",
                "Lack of required features",
                "Poor fit for business",
              ]),
              lossReasonDetails: faker.lorem.sentence(),
            }
          : {}),
        createdAt: faker.date.recent({ days: 60 }),
        ...(status === "sent" || status === "viewed" || status === "signed"
          ? { sentAt: faker.date.recent({ days: 30 }) }
          : {}),
        ...(status === "viewed" || status === "signed"
          ? { viewedAt: faker.date.recent({ days: 20 }) }
          : {}),
        ...(status === "signed"
          ? { signedAt: faker.date.recent({ days: 10 }) }
          : {}),
      })
      .returning();

    proposalsList.push(proposal);

    // Add 2-4 services to each proposal
    const serviceCount = faker.number.int({ min: 2, max: 4 });
    for (let j = 0; j < serviceCount; j++) {
      await db.insert(proposalServices).values({
        tenantId: tenant.id,
        proposalId: proposal.id,
        componentCode: faker.helpers.arrayElement([
          "accounts",
          "vat",
          "payroll",
          "self-assessment",
        ]),
        componentName: faker.helpers.arrayElement([
          "Annual Accounts Preparation",
          "VAT Returns",
          "Payroll Services",
          "Self Assessment",
        ]),
        calculation: `Based on ${faker.helpers.arrayElement(["turnover", "complexity", "transaction volume"])}`,
        price: String(
          faker.number.float({ min: 100, max: 1000, fractionDigits: 2 }),
        ),
        config: {
          complexity: faker.helpers.arrayElement(["low", "medium", "high"]),
        },
        sortOrder: j,
      });
    }
  }

  console.log(`✅ Created ${proposalsList.length} proposals with services`);

  // 8. Create Onboarding Sessions (for 5 recent clients)
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

  console.log(
    `✅ Created ${recentClients.length} onboarding sessions with tasks`,
  );

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

  // Create 50 regular (manually created) tasks
  for (let i = 0; i < 50; i++) {
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
        autoGenerated: false,
      })
      .returning();

    createdTasks.push(task[0]);
  }

  // Create 25 auto-generated tasks from templates
  console.log("Creating auto-generated tasks from templates...");
  for (let i = 0; i < 25; i++) {
    const status = faker.helpers.arrayElement(taskStatuses);
    const dueDate = faker.date.between({
      from: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    const generatedAt = faker.date.recent({ days: 30 });

    // Select a client with services
    const assignedClient = faker.helpers.arrayElement(createdClients);

    // Get client's active services
    const clientServicesData = await db
      .select()
      .from(clientServices)
      .where(eq(clientServices.clientId, assignedClient.id));

    if (clientServicesData.length === 0) continue;

    const clientService = faker.helpers.arrayElement(clientServicesData);

    // Get templates for this service
    const serviceTemplates = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.serviceId, clientService.serviceId));

    if (serviceTemplates.length === 0) continue;

    const template = faker.helpers.arrayElement(serviceTemplates);

    // Generate task with template placeholders replaced
    const taskTitle = template.namePattern
      .replace("{client_name}", assignedClient.name)
      .replace("{period}", "Q1 2025")
      .replace("{month}", "January")
      .replace("{year}", "2025")
      .replace("{tax_year}", "2024/25");

    const task = await db
      .insert(tasks)
      .values({
        tenantId: tenant.id,
        title: taskTitle,
        description:
          template.descriptionPattern
            ?.replace("{client_name}", assignedClient.name)
            ?.replace("{tax_year}", "2024/25") || null,
        status,
        priority: template.priority,
        clientId: assignedClient.id,
        serviceId: clientService.serviceId,
        assignedToId:
          assignedClient.assignedToId ||
          faker.helpers.arrayElement(createdUsers).id,
        createdById: faker.helpers.arrayElement(createdUsers).id,
        dueDate,
        targetDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before due
        completedAt:
          status === "completed" ? faker.date.recent({ days: 7 }) : null,
        estimatedHours: String(template.estimatedHours),
        actualHours:
          status === "completed"
            ? String(
                faker.number.float({
                  min: template.estimatedHours - 2,
                  max: template.estimatedHours + 5,
                }),
              )
            : null,
        progress:
          status === "completed" ? 100 : faker.number.int({ min: 0, max: 80 }),
        taskType: template.taskType,
        category: "Client Work",
        tags: [
          "auto-generated",
          "template",
          faker.datatype.boolean() ? "recurring" : "one-time",
        ],
        autoGenerated: true,
        templateId: template.id,
        generatedAt,
      })
      .returning();

    createdTasks.push(task[0]);
  }

  // 8. Create Task Notes
  console.log("Creating task notes...");
  const createdTaskNotes = [];

  // Add 2-4 notes to each of the first 10 tasks
  for (const task of createdTasks.slice(0, 10)) {
    const noteCount = faker.number.int({ min: 2, max: 4 });

    for (let i = 0; i < noteCount; i++) {
      const author = faker.helpers.arrayElement(createdUsers);
      const isInternal = faker.datatype.boolean({ probability: 0.3 }); // 30% internal notes

      // 40% chance of having @mentions
      const hasMention = faker.datatype.boolean({ probability: 0.4 });
      const mentionedUsers: string[] = [];
      let noteText = faker.lorem.paragraph();

      if (hasMention) {
        // Mention 1-2 random users
        const mentionCount = faker.number.int({ min: 1, max: 2 });
        const usersToMention = faker.helpers.arrayElements(
          createdUsers.filter((u) => u.id !== author.id),
          mentionCount,
        );

        for (const user of usersToMention) {
          mentionedUsers.push(user.id);
          // Add @mention to note text
          noteText += ` @[${user.firstName} ${user.lastName}] `;
        }
      }

      const taskNote = await db
        .insert(taskNotes)
        .values({
          tenantId: tenant.id,
          taskId: task.id,
          userId: author.id,
          note: noteText.trim(),
          isInternal,
          mentionedUsers,
          createdAt: faker.date.recent({ days: 7 }),
        })
        .returning();

      createdTaskNotes.push(taskNote[0]);

      // Create notifications for mentioned users
      for (const mentionedUserId of mentionedUsers) {
        await db.insert(notifications).values({
          tenantId: tenant.id,
          userId: mentionedUserId,
          type: "task_mention",
          title: "You were mentioned in a task",
          message: `${author.firstName} ${author.lastName} mentioned you in a task comment`,
          actionUrl: `/client-hub/tasks/${task.id}`,
          entityType: "task",
          entityId: task.id,
          isRead: faker.datatype.boolean({ probability: 0.5 }), // 50% read
        });
      }
    }
  }

  console.log(
    `✅ Created ${createdTaskNotes.length} task notes for ${createdTasks.slice(0, 10).length} tasks`,
  );

  // 8b. Create Task Assignment History
  console.log("Creating task assignment history...");
  const assignmentTypes = ["preparer", "reviewer", "assigned_to"] as const;

  // Add assignment history to 15 random tasks (simulate reassignments)
  const tasksWithHistory = faker.helpers.arrayElements(createdTasks, 15);

  for (const task of tasksWithHistory) {
    // Create 1-3 reassignment records per task
    const historyCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < historyCount; i++) {
      const fromUser =
        i === 0 ? null : faker.helpers.arrayElement(createdUsers).id;
      const toUser = faker.helpers.arrayElement(createdUsers).id;
      const changedBy = faker.helpers.arrayElement(createdUsers).id;
      const assignmentType = faker.helpers.arrayElement(assignmentTypes);

      const changeReasons = [
        "Workload balancing",
        "Staff member on leave",
        "Expertise required",
        "Priority escalation",
        "Client request",
        null, // Some without reason
      ];

      await db.insert(taskAssignmentHistory).values({
        tenantId: tenant.id,
        taskId: task.id,
        fromUserId: fromUser,
        toUserId: toUser,
        changedBy,
        assignmentType,
        changeReason: faker.helpers.arrayElement(changeReasons),
        changedAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  console.log(
    `✅ Created assignment history for ${tasksWithHistory.length} tasks`,
  );

  // 9. Create Time Entries
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
          serviceId: faker.helpers.arrayElement(createdServices).id,
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

  // 9.5 Create Timesheet Submissions
  console.log("Creating timesheet submissions...");
  const submissionStatuses = [
    "pending",
    "approved",
    "rejected",
    "resubmitted",
  ] as const;

  // Create submissions for the last 4 weeks
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekStartDate = new Date();
    weekStartDate.setDate(
      weekStartDate.getDate() -
        ((weekStartDate.getDay() + 6) % 7) -
        weekOffset * 7,
    );
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    const weekStartStr = weekStartDate.toISOString().split("T")[0];
    const weekEndStr = weekEndDate.toISOString().split("T")[0];

    // Create submission for some users (not all)
    for (const user of createdUsers.slice(0, 3)) {
      // Only first 3 users
      // Calculate total hours for this week
      const result = await db.execute(
        `SELECT COALESCE(SUM(CAST(hours AS DECIMAL)), 0) as total_hours
         FROM time_entries
         WHERE tenant_id = '${tenant.id}'
           AND user_id = '${user.id}'
           AND date >= '${weekStartStr}'
           AND date <= '${weekEndStr}'`,
      );

      const totalHours = Number((result.rows[0] as any).total_hours || 0);

      if (totalHours < 37.5) continue; // Skip if not enough hours

      // Determine status based on week
      let status: string;
      let reviewedBy: string | null = null;
      let reviewedAt: Date | null = null;
      let reviewerComments: string | null = null;

      if (weekOffset === 0) {
        // Current week - pending
        status = "pending";
      } else if (weekOffset === 1) {
        // Last week - mix of pending and resubmitted
        status = user.id === createdUsers[0].id ? "resubmitted" : "pending";
      } else if (weekOffset === 2) {
        // 2 weeks ago - rejected for one user
        if (user.id === createdUsers[1].id) {
          status = "rejected";
          reviewedBy = adminUser.id;
          reviewedAt = new Date(
            weekStartDate.getTime() + 5 * 24 * 60 * 60 * 1000,
          ); // 5 days after week start
          reviewerComments =
            "Please add more detailed descriptions for client meetings. Some entries are missing task associations.";
        } else {
          status = "approved";
          reviewedBy = adminUser.id;
          reviewedAt = new Date(
            weekStartDate.getTime() + 3 * 24 * 60 * 60 * 1000,
          );
        }
      } else {
        // 3 weeks ago - approved
        status = "approved";
        reviewedBy = adminUser.id;
        reviewedAt = new Date(
          weekStartDate.getTime() + 2 * 24 * 60 * 60 * 1000,
        );
      }

      const [submission] = await db
        .insert(timesheetSubmissions)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          weekStartDate: weekStartStr,
          weekEndDate: weekEndStr,
          status,
          totalHours: String(totalHours),
          submittedAt: new Date(weekStartDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after week start
          reviewedBy,
          reviewedAt,
          reviewerComments,
        })
        .returning();

      // Link time entries to submission (except for rejected ones, which should be unlinked)
      if (status !== "rejected") {
        await db.execute(
          `UPDATE time_entries
           SET submission_id = '${submission.id}'
           WHERE tenant_id = '${tenant.id}'
             AND user_id = '${user.id}'
             AND date >= '${weekStartStr}'
             AND date <= '${weekEndStr}'`,
        );
      }
    }
  }
  console.log("✅ Created timesheet submissions");

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
      const maxAmount = remainingAmount / 2;
      const minAmount = Math.min(100, maxAmount * 0.5);
      const itemAmount = isLastItem
        ? remainingAmount
        : faker.number.float({
            min: minAmount,
            max: maxAmount,
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
        serviceId: faker.helpers.arrayElement(createdServices).id,
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
      serviceCode: null, // No specific service
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
      serviceCode: "BOOK_BASIC", // Use existing bookkeeping service
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
    let serviceId = null;
    if (template.serviceCode) {
      const component = createdServices.find(
        (s) => s.code === template.serviceCode,
      );
      if (component) {
        serviceId = component.id;
      }
    }

    const [workflow] = await db
      .insert(workflows)
      .values({
        tenantId: tenant.id,
        version: 1,
        name: template.name,
        description: template.description,
        // biome-ignore lint/suspicious/noExplicitAny: seed data enum cast
        type: template.type as any,
        // biome-ignore lint/suspicious/noExplicitAny: seed data enum cast
        trigger: template.trigger as any,
        estimatedDays: template.estimatedDays,
        serviceId,
        isActive: true,
        config: {},
        createdById: adminUser.id,
      })
      .returning();

    // Create workflow stages
    const createdStages = [];
    for (let i = 0; i < template.stages.length; i++) {
      const stage = template.stages[i];
      const [createdStage] = await db
        .insert(workflowStages)
        .values({
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
        })
        .returning();
      createdStages.push(createdStage);
    }

    // Create initial workflow version (snapshot)
    const stagesSnapshot = {
      stages: createdStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        stageOrder: stage.stageOrder,
        isRequired: stage.isRequired,
        estimatedHours: stage.estimatedHours || "0",
        autoComplete: stage.autoComplete,
        requiresApproval: stage.requiresApproval,
        checklistItems: (stage.checklistItems as any) || [],
      })),
    };

    const [workflowVersion] = await db
      .insert(workflowVersions)
      .values({
        workflowId: workflow.id,
        tenantId: tenant.id,
        version: 1,
        name: template.name,
        description: template.description,
        // biome-ignore lint/suspicious/noExplicitAny: seed data enum cast
        type: template.type as any,
        // biome-ignore lint/suspicious/noExplicitAny: seed data enum cast
        trigger: template.trigger as any,
        estimatedDays: template.estimatedDays,
        serviceId,
        config: {},
        stagesSnapshot,
        changeDescription: "Initial version",
        changeType: "created",
        publishNotes: "Initial release - production ready",
        isActive: true,
        publishedAt: new Date(),
        createdById: adminUser.id,
      })
      .returning();

    // Update workflow with current version ID
    await db
      .update(workflows)
      .set({ currentVersionId: workflowVersion.id })
      .where(eq(workflows.id, workflow.id));
  }

  // 11.5. Assign workflows to tasks and create instances
  console.log("Assigning workflows to tasks...");

  // Get workflow IDs from database
  const createdWorkflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.tenantId, tenant.id));

  // 11.4. Create Workflow Templates (triggers for auto task generation)
  // TEMPORARILY DISABLED - Has unrelated bugs with undefined service codes
  console.log("Skipping workflow templates (disabled due to bugs)...");

  // Get some workflows and templates to link
  /*
  const taxReturnWorkflow = createdWorkflows.find((w) =>
    w.name.includes("Tax Return"),
  );
  const vatReturnWorkflow = createdWorkflows.find((w) =>
    w.name.includes("VAT Return"),
  );
  */

  // Link workflows to task templates for auto-generation triggers
  // Note: This is optional seed data, so we skip if conditions aren't met
  /*
  if (taxReturnWorkflow?.id && createdTaskTemplates.length > 0) {
    // Get Tax Return templates - filter and validate
    const taxTemplates = createdTaskTemplates
      .filter((t) => t?.id && t?.namePattern && (
        t.namePattern.includes("Tax Return") || t.namePattern.includes("Self Assessment")
      ))
      .slice(0, 2);

    for (const template of taxTemplates) {
      if (template.id) {
        await db.insert(workflowTemplates).values({
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          workflowId: taxReturnWorkflow.id,
          stageId: null, // Trigger on workflow completion
          templateId: template.id,
          triggerType: "on_workflow_complete",
        });
      }
    }
  }

  if (vatReturnWorkflow?.id && createdTaskTemplates.length > 0) {
    // Get VAT Return templates - filter and validate
    const vatTemplates = createdTaskTemplates
      .filter((t) => t?.id && t?.namePattern && t.namePattern.includes("VAT Return"))
      .slice(0, 2);

    for (const template of vatTemplates) {
      if (template.id) {
        await db.insert(workflowTemplates).values({
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          workflowId: vatReturnWorkflow.id,
          stageId: null, // Trigger on workflow start
          templateId: template.id,
          triggerType: "on_workflow_start",
        });
      }
    }
  }
  */

  console.log("✓ Skipped workflow templates (section disabled)");

  // Create a map of task types to workflows
  // biome-ignore lint/suspicious/noExplicitAny: seed data workflow mapping
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

      // Get active workflow version (snapshot)
      const [activeVersion] = await db
        .select()
        .from(workflowVersions)
        .where(eq(workflowVersions.workflowId, workflowToAssign.id))
        .limit(1);

      if (activeVersion) {
        // Extract first stage ID from snapshot
        const stagesSnapshot = activeVersion.stagesSnapshot as any;
        const firstStageId = stagesSnapshot?.stages?.[0]?.id || null;

        // Create workflow instance with version snapshot
        await db.insert(taskWorkflowInstances).values({
          taskId: task.id,
          workflowId: workflowToAssign.id,
          workflowVersionId: activeVersion.id,
          version: activeVersion.version,
          stagesSnapshot: activeVersion.stagesSnapshot,
          currentStageId: firstStageId,
          status: "active",
          stageProgress: {},
        });
      }
    }
  }

  const workflowInstanceCount = await db
    .select()
    .from(taskWorkflowInstances)
    .then((r) => r.length);

  console.log(`✓ ${workflowInstanceCount} Workflow instances created`);

  // 12. Create Documents (with actual S3 uploads)
  console.log("Creating documents and uploading to S3...");
  const { uploadPublicFile } = await import("../lib/s3/upload");

  const fileTypes = [
    { name: "Tax_Return_2023.pdf", mimeType: "application/pdf" },
    { name: "Invoice_March.pdf", mimeType: "application/pdf" },
    { name: "Bank_Statement.pdf", mimeType: "application/pdf" },
    { name: "Contract.pdf", mimeType: "application/pdf" },
    { name: "Receipt.pdf", mimeType: "application/pdf" },
    { name: "Meeting_Notes.txt", mimeType: "text/plain" },
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

    // Add some files to each folder (with actual S3 uploads)
    for (let i = 0; i < faker.number.int({ min: 2, max: 3 }); i++) {
      const fileTemplate = faker.helpers.arrayElement(fileTypes);
      const client = faker.helpers.arrayElement(createdClients);
      const fileName = `${client.name.replace(/\s+/g, "_")}_${fileTemplate.name}`;

      // Generate sample file content
      const fileContent = `${folderName} - ${fileName}\n\nClient: ${client.name}\nGenerated: ${new Date().toISOString()}\n\n${faker.lorem.paragraphs(3)}\n\nThis is a sample document for testing purposes.`;
      const buffer = Buffer.from(fileContent, "utf-8");

      try {
        // Upload to S3
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).slice(2, 11);
        const s3Key = `documents/${tenant.id}/${timestamp}-${randomString}-${fileName}`;
        const publicUrl = await uploadPublicFile(
          buffer,
          s3Key,
          fileTemplate.mimeType,
        );

        // Create database record
        await db.insert(documents).values({
          tenantId: tenant.id,
          name: fileName,
          type: "file",
          mimeType: fileTemplate.mimeType,
          size: buffer.length,
          url: publicUrl,
          parentId: folder.id,
          path: `/${folderName}/${fileName}`,
          clientId: client.id,
          uploadedById: faker.helpers.arrayElement(createdUsers).id,
          description: faker.lorem.sentence(),
          tags: faker.helpers.arrayElements(
            ["important", "archived", "pending-review", "approved"],
            { min: 0, max: 2 },
          ),
        });
      } catch (error) {
        console.warn(
          `Failed to upload ${fileName} to S3 (MinIO may not be running):`,
          error instanceof Error ? error.message : error,
        );
        // Create database record without S3 URL
        await db.insert(documents).values({
          tenantId: tenant.id,
          name: fileName,
          type: "file",
          mimeType: fileTemplate.mimeType,
          size: buffer.length,
          url: null,
          parentId: folder.id,
          path: `/${folderName}/${fileName}`,
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
  }
  console.log("✓ Documents created and uploaded to S3");

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

  // 13. Client Portal Users and Access
  console.log("Creating client portal users and access...");

  // Create client portal users for some of the clients
  const clientPortalUsersList = [
    {
      email: "john.smith@techstart.com",
      firstName: "John",
      lastName: "Smith",
      phone: "+44 20 1234 5678",
      status: "active",
    },
    {
      email: "sarah.williams@techstart.com",
      firstName: "Sarah",
      lastName: "Williams",
      phone: "+44 20 1234 5679",
      status: "active",
    },
  ];

  const createdPortalUsers = await db
    .insert(clientPortalUsers)
    .values(
      clientPortalUsersList.map((user) => ({
        id: crypto.randomUUID(),
        ...user,
        tenantId: tenant.id,
        invitedBy: adminUser.id,
        invitedAt: faker.date.recent({ days: 30 }),
        acceptedAt: faker.date.recent({ days: 25 }),
      })),
    )
    .returning();

  // Grant access to clients (multi-client linking)
  // First portal user has access to multiple clients
  await db.insert(clientPortalAccess).values([
    {
      tenantId: tenant.id,
      portalUserId: createdPortalUsers[0].id,
      clientId: createdClients[0].id, // TechStart Solutions
      role: "admin",
      grantedBy: adminUser.id,
      isActive: true,
    },
    {
      tenantId: tenant.id,
      portalUserId: createdPortalUsers[0].id,
      clientId: createdClients[1].id, // Green Energy Ltd
      role: "viewer",
      grantedBy: adminUser.id,
      isActive: true,
    },
  ]);

  // Second portal user has access to one client
  await db.insert(clientPortalAccess).values([
    {
      tenantId: tenant.id,
      portalUserId: createdPortalUsers[1].id,
      clientId: createdClients[0].id, // TechStart Solutions
      role: "viewer",
      grantedBy: adminUser.id,
      isActive: true,
    },
  ]);

  // Create pending client portal invitations
  await db.insert(clientPortalInvitations).values([
    {
      tenantId: tenant.id,
      email: "finance@retailco.com",
      firstName: "Michael",
      lastName: "Brown",
      clientIds: [createdClients[2].id], // RetailCo Ltd
      role: "admin",
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: adminUser.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  // ============================================================================
  // Phase 1: Communication & Collaboration - Seed Data
  // ============================================================================

  console.log(
    "Creating message threads, messages, notifications, and calendar events...",
  );

  // 1. Create Message Threads
  const threadsList = [
    {
      type: "team_channel",
      name: "General",
      description: "Team-wide announcements and discussions",
      isPrivate: false,
      createdBy: adminUser.id,
    },
    {
      type: "team_channel",
      name: "Tax Team",
      description: "Tax-specific discussions",
      isPrivate: true,
      createdBy: adminUser.id,
    },
    {
      type: "direct",
      name: null,
      createdBy: adminUser.id,
    },
    {
      type: "direct",
      name: null,
      createdBy: createdUsers[1].id,
    },
    {
      type: "client",
      name: null,
      clientId: createdClients[0].id,
      createdBy: adminUser.id,
    },
  ];

  const createdThreads = await db
    .insert(messageThreads)
    .values(
      threadsList.map((thread) => ({
        ...thread,
        tenantId: tenant.id,
        lastMessageAt: faker.date.recent({ days: 2 }),
      })),
    )
    .returning();

  // 2. Add participants to threads
  await db.insert(messageThreadParticipants).values([
    // General channel - everyone
    ...createdUsers.map((user) => ({
      threadId: createdThreads[0].id,
      userId: user.id,
      participantType: "staff" as const,
      participantId: user.id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    })),
    // Tax Team channel - tax accountants only
    {
      threadId: createdThreads[1].id,
      userId: adminUser.id,
      participantType: "staff" as const,
      participantId: adminUser.id,
      role: "admin",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    {
      threadId: createdThreads[1].id,
      userId: createdUsers[1].id,
      participantType: "staff" as const,
      participantId: createdUsers[1].id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    // DM between admin and user 1
    {
      threadId: createdThreads[2].id,
      userId: adminUser.id,
      participantType: "staff" as const,
      participantId: adminUser.id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    {
      threadId: createdThreads[2].id,
      userId: createdUsers[1].id,
      participantType: "staff" as const,
      participantId: createdUsers[1].id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    // DM between user 1 and user 2
    {
      threadId: createdThreads[3].id,
      userId: createdUsers[1].id,
      participantType: "staff" as const,
      participantId: createdUsers[1].id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    {
      threadId: createdThreads[3].id,
      userId: createdUsers[2].id,
      participantType: "staff" as const,
      participantId: createdUsers[2].id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    // Client thread - admin and user 1
    {
      threadId: createdThreads[4].id,
      userId: adminUser.id,
      participantType: "staff" as const,
      participantId: adminUser.id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
    {
      threadId: createdThreads[4].id,
      userId: createdUsers[1].id,
      participantType: "staff" as const,
      participantId: createdUsers[1].id,
      role: "member",
      lastReadAt: faker.date.recent({ days: 1 }),
    },
  ]);

  // 3. Create messages in threads
  const messagesList = [
    // General channel messages
    {
      threadId: createdThreads[0].id,
      userId: adminUser.id,
      senderType: "staff" as const,
      senderId: adminUser.id,
      content:
        "Welcome to Practice Hub team chat! Let's keep all team communication here.",
      type: "text",
    },
    {
      threadId: createdThreads[0].id,
      userId: createdUsers[1].id,
      senderType: "staff" as const,
      senderId: createdUsers[1].id,
      content: "Looking forward to using this! Much better than email chains.",
      type: "text",
    },
    {
      threadId: createdThreads[0].id,
      userId: createdUsers[2].id,
      senderType: "staff" as const,
      senderId: createdUsers[2].id,
      content: "Agreed! This will help us stay organized.",
      type: "text",
    },
    // Tax Team channel
    {
      threadId: createdThreads[1].id,
      userId: adminUser.id,
      senderType: "staff" as const,
      senderId: adminUser.id,
      content: "Reminder: Tax filing deadline is next week for Q4 clients.",
      type: "text",
    },
    {
      threadId: createdThreads[1].id,
      userId: createdUsers[1].id,
      senderType: "staff" as const,
      senderId: createdUsers[1].id,
      content:
        "On it! I'll reach out to anyone who hasn't submitted documents yet.",
      type: "text",
    },
    // DM between admin and user 1
    {
      threadId: createdThreads[2].id,
      userId: adminUser.id,
      senderType: "staff" as const,
      senderId: adminUser.id,
      content:
        "Can you review the TechStart Solutions proposal when you have a moment?",
      type: "text",
    },
    {
      threadId: createdThreads[2].id,
      userId: createdUsers[1].id,
      senderType: "staff" as const,
      senderId: createdUsers[1].id,
      content:
        "Sure, I'll take a look this afternoon and send you my feedback.",
      type: "text",
    },
    // Client thread
    {
      threadId: createdThreads[4].id,
      userId: adminUser.id,
      senderType: "staff" as const,
      senderId: adminUser.id,
      content:
        "Hi! Welcome to your client portal. Feel free to reach out if you have any questions.",
      type: "text",
    },
  ];

  await db.insert(messages).values(
    messagesList.map((msg, idx) => ({
      ...msg,
      createdAt: new Date(Date.now() - (messagesList.length - idx) * 3600000), // Space out by 1 hour
    })),
  );

  // 4. Create notifications
  const notificationsList = [
    {
      userId: createdUsers[1].id,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `${adminUser.firstName} ${adminUser.lastName} assigned you a task: Review proposal for TechStart Solutions`,
      actionUrl: `/client-hub/tasks/${createdTasks[0].id}`,
      entityType: "task",
      entityId: createdTasks[0].id,
      isRead: false,
    },
    {
      userId: createdUsers[2].id,
      type: "mention",
      title: "Mentioned in Message",
      message: `${createdUsers[1].firstName} mentioned you in #General`,
      actionUrl: `/messages/${createdThreads[0].id}`,
      entityType: "message",
      entityId: createdThreads[0].id,
      isRead: false,
    },
    {
      userId: adminUser.id,
      type: "approval_needed",
      title: "KYC Approval Needed",
      message: "New KYC verification requires your review",
      actionUrl: "/admin/kyc-review",
      entityType: "kyc_verification",
      isRead: true,
      readAt: faker.date.recent({ days: 1 }),
    },
    {
      userId: createdUsers[1].id,
      type: "client_message",
      title: "New Client Message",
      message: "TechStart Solutions sent you a message",
      actionUrl: `/messages/${createdThreads[4].id}`,
      entityType: "message",
      entityId: createdThreads[4].id,
      isRead: false,
    },
    {
      userId: createdUsers[2].id,
      type: "task_assigned",
      title: "New Task Assigned",
      message:
        "You have been assigned to complete tax returns for Green Energy Ltd",
      actionUrl: `/client-hub/tasks/${createdTasks[5].id}`,
      entityType: "task",
      entityId: createdTasks[5].id,
      isRead: true,
      readAt: faker.date.recent({ days: 2 }),
    },
  ];

  await db.insert(notifications).values(
    notificationsList.map((notif) => ({
      ...notif,
      tenantId: tenant.id,
      createdAt: faker.date.recent({ days: 3 }),
    })),
  );

  // 5. Create calendar events
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const eventsList = [
    {
      title: "Client Meeting: TechStart Solutions",
      description:
        "Quarterly review meeting to discuss financials and tax planning",
      type: "meeting",
      startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
      allDay: false,
      location: "Conference Room A",
      clientId: createdClients[0].id,
      createdBy: adminUser.id,
      reminderMinutes: 30,
    },
    {
      title: "Team Planning Session",
      description: "Monthly planning and review",
      type: "meeting",
      startTime: new Date(nextWeek.setHours(14, 0, 0, 0)),
      endTime: new Date(nextWeek.setHours(16, 0, 0, 0)),
      allDay: false,
      location: "Main Office",
      createdBy: adminUser.id,
      reminderMinutes: 60,
    },
    {
      title: "VAT Return Deadline",
      description: "Submit VAT returns for all registered clients",
      type: "deadline",
      startTime: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      allDay: true,
      createdBy: adminUser.id,
      reminderMinutes: 1440, // 1 day before
    },
    {
      title: "Training: New Tax Regulations",
      description: "Mandatory training session on updated tax regulations",
      type: "event",
      startTime: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(
        nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
      allDay: false,
      location: "Virtual - Zoom",
      createdBy: adminUser.id,
      reminderMinutes: 120,
      metadata: {
        meetingLink: "https://zoom.us/j/1234567890",
      },
    },
    {
      title: "Annual Leave",
      description: "Out of office",
      type: "out_of_office",
      startTime: new Date(nextWeek.getTime() + 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(nextWeek.getTime() + 21 * 24 * 60 * 60 * 1000),
      allDay: true,
      createdBy: createdUsers[2].id,
    },
  ];

  const createdEvents = await db
    .insert(calendarEvents)
    .values(
      eventsList.map((event) => ({
        ...event,
        tenantId: tenant.id,
      })),
    )
    .returning();

  // 6. Add attendees to events
  await db.insert(calendarEventAttendees).values([
    // Client meeting - admin and user 1
    {
      eventId: createdEvents[0].id,
      userId: adminUser.id,
      status: "accepted",
      isOptional: false,
      respondedAt: faker.date.recent({ days: 1 }),
    },
    {
      eventId: createdEvents[0].id,
      userId: createdUsers[1].id,
      status: "accepted",
      isOptional: false,
      respondedAt: faker.date.recent({ days: 1 }),
    },
    // Team planning - all users
    ...createdUsers.map((user) => ({
      eventId: createdEvents[1].id,
      userId: user.id,
      status: "accepted",
      isOptional: false,
      respondedAt: faker.date.recent({ days: 2 }),
    })),
    // Training - all users
    ...createdUsers.map((user) => ({
      eventId: createdEvents[3].id,
      userId: user.id,
      status: "pending",
      isOptional: false,
    })),
  ]);

  console.log(
    "✓ Created message threads, messages, notifications, and calendar events",
  );

  // Create integration settings (sample data - disabled integrations)
  console.log("Creating integration settings...");
  const integrationsList = [
    {
      integrationType: "xero",
      enabled: false,
      config: {
        syncFrequency: "daily",
        autoSync: false,
      },
    },
    {
      integrationType: "quickbooks",
      enabled: false,
      config: {
        syncFrequency: "weekly",
        autoSync: false,
      },
    },
    {
      integrationType: "slack",
      enabled: false,
      config: {
        notificationChannels: [],
      },
    },
  ];

  await db.insert(integrationSettings).values(
    integrationsList.map((integration) => ({
      tenantId: tenant.id,
      ...integration,
    })),
  );

  // Create sample import logs
  console.log("Creating import logs...");
  const importLogsList = [
    {
      entityType: "clients" as const,
      fileName: "clients_import_2025-01.csv",
      totalRows: 48,
      processedRows: 45,
      failedRows: 3,
      skippedRows: 0,
      errors: [
        {
          row: 12,
          field: "email",
          error: "Invalid email format",
        },
        {
          row: 23,
          field: "vat_number",
          error: "Invalid VAT number format",
        },
        {
          row: 34,
          field: "company_name",
          error: "Company name is required",
        },
      ],
      status: "completed" as const,
      importedBy: adminUser.id,
      startedAt: faker.date.recent({ days: 30 }),
      completedAt: faker.date.recent({ days: 30 }),
    },
    {
      entityType: "tasks" as const,
      fileName: "tasks_import_2025-01.csv",
      totalRows: 100,
      processedRows: 100,
      failedRows: 0,
      skippedRows: 0,
      errors: [],
      status: "completed" as const,
      importedBy: createdUsers[1].id,
      startedAt: faker.date.recent({ days: 15 }),
      completedAt: faker.date.recent({ days: 15 }),
    },
    {
      entityType: "services" as const,
      fileName: "services_import_2024-12.csv",
      totalRows: 27,
      processedRows: 25,
      failedRows: 2,
      skippedRows: 0,
      errors: [
        {
          row: 8,
          field: "price",
          error: "Price must be a positive number",
        },
        {
          row: 15,
          field: "category",
          error: "Invalid category",
        },
      ],
      status: "completed" as const,
      importedBy: adminUser.id,
      startedAt: faker.date.recent({ days: 45 }),
      completedAt: faker.date.recent({ days: 45 }),
    },
  ];

  await db.insert(importLogs).values(
    importLogsList.map((log) => ({
      tenantId: tenant.id,
      ...log,
    })),
  );

  // Create sample Xero webhook events (for demo/testing)
  console.log("Creating sample Xero webhook events...");
  const sampleEvents = [
    {
      eventId: crypto.randomUUID(),
      eventType: "CREATE",
      eventCategory: "INVOICE",
      resourceId: crypto.randomUUID(),
      xeroTenantId: crypto.randomUUID(),
    },
    {
      eventId: crypto.randomUUID(),
      eventType: "UPDATE",
      eventCategory: "CONTACT",
      resourceId: crypto.randomUUID(),
      xeroTenantId: crypto.randomUUID(),
    },
  ];

  await db.insert(xeroWebhookEvents).values(
    sampleEvents.map((event) => ({
      tenantId: tenant.id,
      eventId: event.eventId,
      eventType: event.eventType,
      eventCategory: event.eventCategory,
      eventDateUtc: faker.date.recent({ days: 7 }),
      resourceId: event.resourceId,
      resourceUrl: `https://api.xero.com/api.xro/2.0/${event.eventCategory}s/${event.resourceId}`,
      xeroTenantId: event.xeroTenantId,
      processed: faker.datatype.boolean(),
      processedAt: faker.datatype.boolean()
        ? faker.date.recent({ days: 7 })
        : null,
      rawPayload: {
        events: [
          {
            eventId: event.eventId,
            eventType: event.eventType,
            eventCategory: event.eventCategory,
            tenantId: event.xeroTenantId,
            resourceId: event.resourceId,
            eventDateUtc: new Date().toISOString(),
          },
        ],
      },
    })),
  );

  console.log(
    "✓ Created integration settings, import logs, and sample webhook events",
  );

  console.log("✅ Database seeding completed!");

  // Print summary
  console.log("\n📊 Seed Summary:");
  console.log("================");
  console.log(`✓ 1 Tenant created`);
  console.log(`✓ ${createdUsers.length} Users created`);
  console.log(`✓ 3 Portal categories created`);
  console.log(`✓ 20 Portal links created (internal modules + external tools)`);
  console.log(`✓ ${createdServices.length} Service Components created`);
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
