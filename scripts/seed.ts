import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { faker } from "@faker-js/faker";
import { db } from "../lib/db";
import {
  tenants,
  users,
  clients,
  clientContacts,
  tasks,
  services,
  clientServices,
  timeEntries,
  invoices,
  invoiceItems,
  compliance,
  documents,
  workflows,
  workflowStages,
  activityLogs,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";

// Set a consistent seed for reproducible data
faker.seed(12345);

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");

  // Delete in reverse order of dependencies
  await db.delete(activityLogs);
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(timeEntries);
  await db.delete(workflowStages);
  await db.delete(workflows);
  await db.delete(documents);
  await db.delete(compliance);
  await db.delete(clientServices);
  await db.delete(tasks);
  await db.delete(clientContacts);
  await db.delete(clients);
  await db.delete(services);
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
      clerkId: "user_demo_admin",
      email: "admin@demo.com",
      firstName: "John",
      lastName: "Admin",
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
      }))
    )
    .returning();

  const [adminUser, sarah, mike, emily] = createdUsers;

  // 3. Create Services
  console.log("Creating services...");
  const serviceList = [
    {
      code: "TAX-PREP",
      name: "Tax Preparation",
      description: "Annual tax return preparation and filing",
      category: "Tax Services",
      defaultRate: "250",
      priceType: "hourly" as const,
      duration: 180,
    },
    {
      code: "BOOKKEEP",
      name: "Bookkeeping",
      description: "Monthly bookkeeping and reconciliation",
      category: "Accounting",
      defaultRate: "150",
      priceType: "hourly" as const,
      duration: 240,
    },
    {
      code: "VAT-RET",
      name: "VAT Returns",
      description: "Quarterly VAT return preparation and submission",
      category: "Tax Services",
      defaultRate: "500",
      priceType: "fixed" as const,
      duration: 120,
    },
    {
      code: "PAYROLL",
      name: "Payroll Processing",
      description: "Monthly payroll processing and submissions",
      category: "Payroll",
      defaultRate: "200",
      priceType: "fixed" as const,
      duration: 60,
    },
    {
      code: "AUDIT",
      name: "Annual Audit",
      description: "Complete annual audit and certification",
      category: "Audit",
      defaultRate: "5000",
      priceType: "project" as const,
      duration: 2400,
    },
    {
      code: "CONSULT",
      name: "Business Consultation",
      description: "Strategic business and financial consulting",
      category: "Advisory",
      defaultRate: "200",
      priceType: "hourly" as const,
      duration: 60,
    },
  ];

  const createdServices = await db
    .insert(services)
    .values(
      serviceList.map((service) => ({
        ...service,
        tenantId: tenant.id,
        isActive: true,
        tags: [service.category],
      }))
    )
    .returning();

  // 4. Create Clients
  console.log("Creating clients...");
  const clientList = [];
  const clientTypes = ["individual", "company", "trust", "partnership"] as const;
  const clientStatuses = ["active", "active", "active", "prospect", "inactive"] as const;

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
      registrationNumber: isCompany ? faker.string.alphanumeric(8).toUpperCase() : null,
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      postalCode: faker.location.zipCode("??# #??"),
      country: "United Kingdom",
      accountManagerId: faker.helpers.arrayElement(createdUsers).id,
      incorporationDate: isCompany ? faker.date.past({ years: 10 }).toISOString() : null,
      yearEnd: isCompany ? faker.date.future({ years: 1 }).toISOString().slice(5, 10) : null,
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
      }))
    )
    .returning();

  // 5. Create Client Contacts
  console.log("Creating client contacts...");
  for (const client of createdClients) {
    // Create 1-3 contacts per client
    const contactCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < contactCount; i++) {
      await db.insert(clientContacts).values({
        tenantId: tenant.id,
        clientId: client.id,
        isPrimary: i === 0,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        mobile: faker.phone.number(),
        position: faker.person.jobTitle(),
        department: faker.commerce.department(),
        isActive: true,
      });
    }
  }

  // 6. Assign Services to Clients
  console.log("Assigning services to clients...");
  for (const client of createdClients) {
    // Each client gets 1-4 services
    const serviceCount = faker.number.int({ min: 1, max: 4 });
    const selectedServices = faker.helpers.arrayElements(createdServices, serviceCount);

    for (const service of selectedServices) {
      await db.insert(clientServices).values({
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: service.id,
        customRate: faker.datatype.boolean()
          ? String(Number(service.defaultRate) * faker.number.float({ min: 0.8, max: 1.2 }))
          : null,
        startDate: faker.date.past({ years: 2 }).toISOString(),
        isActive: true,
      });
    }
  }

  // 7. Create Tasks
  console.log("Creating tasks...");
  const taskStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
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

    const task = await db
      .insert(tasks)
      .values({
        tenantId: tenant.id,
        title: `${faker.helpers.arrayElement(taskTypes)} - ${faker.company.name()}`,
        description: faker.lorem.paragraph(),
        status,
        priority: faker.helpers.arrayElement(taskPriorities),
        clientId: faker.helpers.arrayElement(createdClients).id,
        assignedToId: faker.helpers.arrayElement(createdUsers).id,
        reviewerId: faker.datatype.boolean() ? faker.helpers.arrayElement(createdUsers).id : null,
        createdById: faker.helpers.arrayElement(createdUsers).id,
        dueDate,
        targetDate: faker.date.soon({ days: 3, refDate: dueDate }),
        completedAt: status === "completed" ? faker.date.recent({ days: 7 }) : null,
        estimatedHours: String(faker.number.int({ min: 1, max: 20 })),
        actualHours: status === "completed" ? String(faker.number.int({ min: 1, max: 25 })) : null,
        progress: status === "completed" ? 100 : faker.number.int({ min: 0, max: 80 }),
        taskType: faker.helpers.arrayElement(taskTypes),
        category: faker.helpers.arrayElement(["Client Work", "Admin", "Development", "Support"]),
        tags: faker.helpers.arrayElements(["urgent", "client-request", "monthly", "quarterly", "annual"], { min: 0, max: 3 }),
      })
      .returning();

    createdTasks.push(task[0]);
  }

  // 8. Create Time Entries
  console.log("Creating time entries...");
  const workTypes = ["work", "admin", "meeting", "training", "research"] as const;
  const timeEntryStatuses = ["draft", "submitted", "approved", "rejected"] as const;

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
        const relatedTasks = createdTasks.filter(t => t.clientId === client.id);
        const task = relatedTasks.length > 0 ? faker.helpers.arrayElement(relatedTasks) : null;
        const hours = faker.number.float({ min: 0.5, max: 4, multipleOf: 0.25 });
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
          status: days > 7 ? "approved" : faker.helpers.arrayElement(timeEntryStatuses),
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

    const subtotal = faker.number.float({ min: 500, max: 10000, multipleOf: 0.01 });
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
        paidDate: status === "paid" ? faker.date.between({ from: issueDate, to: new Date() }).toISOString().split("T")[0] : null,
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
        : faker.number.float({ min: 100, max: remainingAmount / 2, multipleOf: 0.01 });

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
  const complianceStatuses = ["pending", "in_progress", "completed", "overdue"] as const;

  for (const client of createdClients.filter(c => c.type === "company").slice(0, 15)) {
    for (const type of faker.helpers.arrayElements(complianceTypes, { min: 2, max: 4 })) {
      const dueDate = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      });

      const isOverdue = dueDate < new Date() && faker.datatype.boolean({ probability: 0.2 });

      await db.insert(compliance).values({
        tenantId: tenant.id,
        title: `${type} - ${client.name}`,
        type,
        description: faker.lorem.sentence(),
        clientId: client.id,
        assignedToId: faker.helpers.arrayElement(createdUsers).id,
        dueDate,
        completedDate: faker.datatype.boolean({ probability: 0.3 }) ? faker.date.recent({ days: 30 }) : null,
        reminderDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: isOverdue ? "overdue" : faker.helpers.arrayElement(complianceStatuses),
        priority: isOverdue ? "urgent" : faker.helpers.arrayElement(["low", "medium", "high"] as const),
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
      stages: [
        { name: "Gather Documents", estimatedHours: 2, checklist: ["Bank statements", "Receipts", "P60s"] },
        { name: "Data Entry", estimatedHours: 4, checklist: ["Enter income", "Enter expenses", "Enter deductions"] },
        { name: "Review & Calculations", estimatedHours: 3, checklist: ["Review entries", "Calculate tax", "Apply reliefs"] },
        { name: "Client Approval", estimatedHours: 1, requiresApproval: true },
        { name: "Submit to HMRC", estimatedHours: 1, checklist: ["Final check", "Submit online", "Get confirmation"] },
      ],
    },
    {
      name: "New Client Onboarding",
      description: "Complete onboarding process for new clients",
      type: "task_template",
      trigger: "manual",
      estimatedDays: 7,
      stages: [
        { name: "Initial Setup", estimatedHours: 1, checklist: ["Create client record", "Set up folders", "Send welcome email"] },
        { name: "Document Collection", estimatedHours: 2, checklist: ["ID verification", "Engagement letter", "Bank details"] },
        { name: "Service Configuration", estimatedHours: 1, checklist: ["Assign services", "Set rates", "Create schedule"] },
        { name: "System Access", estimatedHours: 1, checklist: ["Portal access", "Document sharing", "Communication setup"] },
      ],
    },
    {
      name: "Monthly Bookkeeping",
      description: "Standard monthly bookkeeping workflow",
      type: "task_template",
      trigger: "schedule",
      estimatedDays: 3,
      stages: [
        { name: "Transaction Import", estimatedHours: 1, checklist: ["Import bank", "Import credit cards", "Import expenses"] },
        { name: "Categorization", estimatedHours: 2, checklist: ["Categorize transactions", "Match receipts", "Flag queries"] },
        { name: "Reconciliation", estimatedHours: 2, checklist: ["Bank reconciliation", "VAT reconciliation", "Balance sheet review"] },
        { name: "Reporting", estimatedHours: 1, checklist: ["P&L report", "Cash flow", "Send to client"] },
      ],
    },
  ];

  for (const template of workflowTemplates) {
    const [workflow] = await db
      .insert(workflows)
      .values({
        tenantId: tenant.id,
        name: template.name,
        description: template.description,
        type: template.type as any,
        trigger: template.trigger as any,
        estimatedDays: template.estimatedDays,
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

  // 12. Create Documents
  console.log("Creating documents...");
  const documentTypes = ["file", "folder"] as const;
  const fileTypes = [
    { name: "Tax Return 2023.pdf", mimeType: "application/pdf", size: 245678 },
    { name: "Invoice_March.pdf", mimeType: "application/pdf", size: 123456 },
    { name: "Bank_Statement.pdf", mimeType: "application/pdf", size: 456789 },
    { name: "Receipts.zip", mimeType: "application/zip", size: 2345678 },
    { name: "Accounts_2023.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 345678 },
    { name: "Meeting_Notes.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 123456 },
  ];

  // Create root folders
  const rootFolders = ["Tax Returns", "Invoices", "Bank Statements", "Contracts", "Correspondence"];
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
        tags: faker.helpers.arrayElements(["important", "archived", "pending-review", "approved"], { min: 0, max: 2 }),
      });
    }
  }

  // 13. Create Activity Logs
  console.log("Creating activity logs...");
  const actions = ["created", "updated", "completed", "assigned", "status_changed"];
  const entityTypes = ["task", "client", "invoice", "compliance", "document"];

  for (let i = 0; i < 100; i++) {
    const entityType = faker.helpers.arrayElement(entityTypes);
    const action = faker.helpers.arrayElement(actions);
    const user = faker.helpers.arrayElement(createdUsers);

    let entityId: string;
    let entityName: string;

    switch (entityType) {
      case "task":
        const task = faker.helpers.arrayElement(createdTasks);
        entityId = task.id;
        entityName = task.title;
        break;
      case "client":
        const client = faker.helpers.arrayElement(createdClients);
        entityId = client.id;
        entityName = client.name;
        break;
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
        browser: faker.helpers.arrayElement(["Chrome", "Firefox", "Safari", "Edge"]),
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
  console.log(`✓ ${createdServices.length} Services created`);
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
  console.log("Note: In development, authentication will auto-create these users with Clerk.");
}

async function main() {
  try {
    // Check if we should clear first
    const shouldClear = process.argv.includes("--clear") || process.argv.includes("-c");

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