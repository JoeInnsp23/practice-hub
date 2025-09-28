import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activityLogs, clients, services, users } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import Papa from "papaparse";

interface ImportRow {
  "Task Code"?: string;
  "Title": string;
  "Description"?: string;
  "Client Code"?: string;
  "Service Name"?: string;
  "Assignee Email"?: string;
  "Reviewer Email"?: string;
  "Status": string;
  "Priority": string;
  "Progress %"?: string;
  "Estimated Hours"?: string;
  "Target Date"?: string;
  "Start Date"?: string;
  "Tags"?: string;
  "Notes"?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  data?: any;
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<ImportRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing failed",
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    const errors: ImportError[] = [];
    const successful: any[] = [];
    const skipped: any[] = [];

    // Validate and process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row

      // Validate required fields
      if (!row.Title) {
        errors.push({
          row: rowNumber,
          field: "Title",
          message: "Title is required",
          data: row,
        });
        continue;
      }

      if (!row.Status) {
        errors.push({
          row: rowNumber,
          field: "Status",
          message: "Status is required",
          data: row,
        });
        continue;
      }

      if (!row.Priority) {
        errors.push({
          row: rowNumber,
          field: "Priority",
          message: "Priority is required",
          data: row,
        });
        continue;
      }

      // Validate enums
      const validStatuses = ["pending", "in-progress", "review", "completed", "cancelled"];
      if (!validStatuses.includes(row.Status.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: "Status",
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          data: row,
        });
        continue;
      }

      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(row.Priority.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: "Priority",
          message: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
          data: row,
        });
        continue;
      }

      // Check for duplicate task code if provided
      if (row["Task Code"]) {
        const existing = await db
          .select()
          .from(tasks)
          .where(
            and(
              eq(tasks.tenantId, authContext.tenantId),
              eq(tasks.taskCode, row["Task Code"])
            )
          )
          .limit(1);

        if (existing.length > 0) {
          skipped.push({
            row: rowNumber,
            reason: `Task code "${row["Task Code"]}" already exists`,
            data: row,
          });
          continue;
        }
      }

      // Look up related entities
      let clientId = null;
      if (row["Client Code"]) {
        const [client] = await db
          .select()
          .from(clients)
          .where(
            and(
              eq(clients.tenantId, authContext.tenantId),
              eq(clients.clientCode, row["Client Code"])
            )
          )
          .limit(1);

        if (!client) {
          errors.push({
            row: rowNumber,
            field: "Client Code",
            message: `Client with code "${row["Client Code"]}" not found`,
            data: row,
          });
          continue;
        }
        clientId = client.id;
      }

      let serviceId = null;
      if (row["Service Name"]) {
        const [service] = await db
          .select()
          .from(services)
          .where(
            and(
              eq(services.tenantId, authContext.tenantId),
              eq(services.name, row["Service Name"])
            )
          )
          .limit(1);

        if (service) {
          serviceId = service.id;
        }
      }

      let assigneeId = null;
      if (row["Assignee Email"]) {
        const [assignee] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.tenantId, authContext.tenantId),
              eq(users.email, row["Assignee Email"])
            )
          )
          .limit(1);

        if (assignee) {
          assigneeId = assignee.id;
        }
      }

      let reviewerId = null;
      if (row["Reviewer Email"]) {
        const [reviewer] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.tenantId, authContext.tenantId),
              eq(users.email, row["Reviewer Email"])
            )
          )
          .limit(1);

        if (reviewer) {
          reviewerId = reviewer.id;
        }
      }

      // Parse numeric fields
      const progress = row["Progress %"] ? parseInt(row["Progress %"]) : 0;
      const estimatedHours = row["Estimated Hours"] ? parseFloat(row["Estimated Hours"]) : null;

      // Parse tags
      const tags = row.Tags ? row.Tags.split(",").map(t => t.trim()).filter(Boolean) : null;

      // Prepare task data
      const taskData = {
        tenantId: authContext.tenantId,
        taskCode: row["Task Code"] || `TASK-${Date.now()}-${i}`,
        title: row.Title.trim(),
        description: row.Description?.trim() || null,
        clientId,
        serviceId,
        assignedToId: assigneeId || authContext.userId,
        reviewerId,
        status: row.Status.toLowerCase() as any,
        priority: row.Priority.toLowerCase() as any,
        progress,
        estimatedHours,
        targetDate: row["Target Date"] || null,
        startDate: row["Start Date"] || null,
        tags,
        notes: row.Notes?.trim() || null,
        createdBy: authContext.userId,
      };

      if (!dryRun) {
        try {
          // Create the task
          const [newTask] = await db
            .insert(tasks)
            .values(taskData)
            .returning();

          // Log the activity
          await db.insert(activityLogs).values({
            tenantId: authContext.tenantId,
            entityType: "task",
            entityId: newTask.id,
            action: "imported",
            description: `Imported task "${taskData.title}" via CSV`,
            userId: authContext.userId,
            userName: `${authContext.firstName} ${authContext.lastName}`,
            metadata: { source: "csv_import", row: rowNumber },
          });

          successful.push({
            row: rowNumber,
            task: newTask,
          });
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            field: "database",
            message: error.message || "Failed to create task",
            data: row,
          });
        }
      } else {
        // Dry run - just validate
        successful.push({
          row: rowNumber,
          task: taskData,
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: errors.length === 0,
      dryRun,
      summary: {
        total: rows.length,
        successful: successful.length,
        failed: errors.length,
        skipped: skipped.length,
      },
      successful: successful.slice(0, 10), // Limit response size
      errors,
      skipped,
    });
  } catch (error) {
    console.error("Import API: Failed to import tasks", error);
    return NextResponse.json(
      { error: "Failed to import tasks" },
      { status: 500 }
    );
  }
}

// Provide template for download
export async function GET(req: NextRequest) {
  const template = Papa.unparse([
    {
      "Task Code": "TASK-001",
      "Title": "Complete Year-End Accounts",
      "Description": "Prepare and finalize year-end financial statements",
      "Client Code": "CLI-0001",
      "Service Name": "Accounting",
      "Assignee Email": "accountant@example.com",
      "Reviewer Email": "manager@example.com",
      "Status": "in-progress",
      "Priority": "high",
      "Progress %": "75",
      "Estimated Hours": "20",
      "Target Date": "2024-03-31",
      "Start Date": "2024-03-01",
      "Tags": "year-end, financial, urgent",
      "Notes": "Client requires draft by March 25th",
    },
    {
      "Task Code": "TASK-002",
      "Title": "VAT Return Submission",
      "Description": "Complete and submit quarterly VAT return",
      "Client Code": "CLI-0002",
      "Service Name": "Tax",
      "Assignee Email": "taxadvisor@example.com",
      "Reviewer Email": "",
      "Status": "pending",
      "Priority": "medium",
      "Progress %": "0",
      "Estimated Hours": "5",
      "Target Date": "2024-04-07",
      "Start Date": "",
      "Tags": "vat, tax, quarterly",
      "Notes": "",
    },
  ]);

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="task_import_template.csv"',
    },
  });
}