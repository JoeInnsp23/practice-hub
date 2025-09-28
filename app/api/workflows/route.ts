import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows, workflowStages } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflowList = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.tenantId, authContext.tenantId),
          eq(workflows.isActive, true)
        )
      )
      .orderBy(workflows.name);

    // Get stages for each workflow
    const workflowsWithStages = await Promise.all(
      workflowList.map(async (workflow) => {
        const stages = await db
          .select()
          .from(workflowStages)
          .where(eq(workflowStages.workflowId, workflow.id))
          .orderBy(workflowStages.stageOrder);

        return {
          ...workflow,
          estimatedDays: workflow.estimatedDays || 0,
          stages: stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            description: stage.description,
            order: stage.stageOrder,
            isRequired: stage.isRequired,
            estimatedHours: stage.estimatedHours ? Number(stage.estimatedHours) : 0,
            checklistItems: stage.checklistItems || []
          }))
        };
      })
    );

    return NextResponse.json({ workflows: workflowsWithStages });
  } catch (error) {
    console.error("Workflows API: Failed to fetch workflows", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [newWorkflow] = await tx
        .insert(workflows)
        .values({
          tenantId: authContext.tenantId,
          name: body.name,
          description: body.description,
          type: body.type,
          trigger: body.trigger || "manual",
          isActive: true,
          estimatedDays: body.estimatedDays,
          serviceId: body.serviceId,
          config: body.config || {},
          conditions: body.conditions,
          actions: body.actions,
          createdById: authContext.userId
        })
        .returning();

      // Create stages if provided
      if (body.stages && Array.isArray(body.stages)) {
        for (let i = 0; i < body.stages.length; i++) {
          const stage = body.stages[i];
          await tx.insert(workflowStages).values({
            workflowId: newWorkflow.id,
            name: stage.name,
            description: stage.description,
            stageOrder: i + 1,
            isRequired: stage.isRequired !== false,
            estimatedHours: stage.estimatedHours,
            checklistItems: stage.checklistItems,
            autoComplete: stage.autoComplete || false,
            requiresApproval: stage.requiresApproval || false
          });
        }
      }

      return newWorkflow;
    });

    return NextResponse.json({ success: true, workflow: result });
  } catch (error) {
    console.error("Workflows API: Failed to create workflow", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}