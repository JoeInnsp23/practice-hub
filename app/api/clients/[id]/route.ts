import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, clientContacts, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;

    // Fetch client with related data
    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.tenantId, authContext.tenantId)
        )
      );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch contacts
    const contacts = await db
      .select()
      .from(clientContacts)
      .where(
        and(
          eq(clientContacts.clientId, clientId),
          eq(clientContacts.tenantId, authContext.tenantId)
        )
      );

    return NextResponse.json({ client, contacts });
  } catch (error) {
    console.error("Client API: Failed to fetch client", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;
    const body = await req.json();

    // Verify client exists and belongs to tenant
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.tenantId, authContext.tenantId)
        )
      );

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client in transaction
    const result = await db.transaction(async (tx) => {
      // Update client
      const [updatedClient] = await tx
        .update(clients)
        .set({
          name: body.name,
          type: body.type,
          status: body.status,
          email: body.email,
          phone: body.phone,
          website: body.website,
          vatNumber: body.vatNumber,
          registrationNumber: body.registrationNumber,
          addressLine1: body.addressLine1,
          addressLine2: body.addressLine2,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          country: body.country,
          accountManagerId: body.accountManagerId,
          incorporationDate: body.incorporationDate,
          yearEnd: body.yearEnd,
          notes: body.notes,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(clients.id, clientId),
            eq(clients.tenantId, authContext.tenantId)
          )
        )
        .returning();

      // Log the activity
      const changes: any = {};
      const oldValues: any = {};

      // Track changes
      Object.keys(body).forEach(key => {
        if (body[key] !== existingClient[key as keyof typeof existingClient]) {
          changes[key] = body[key];
          oldValues[key] = existingClient[key as keyof typeof existingClient];
        }
      });

      if (Object.keys(changes).length > 0) {
        await tx.insert(activityLogs).values({
          tenantId: authContext.tenantId,
          entityType: "client",
          entityId: clientId,
          action: "updated",
          description: `Updated client "${body.name}"`,
          userId: authContext.userId,
          userName: `${authContext.firstName} ${authContext.lastName}`,
          oldValues,
          newValues: changes
        });
      }

      return updatedClient;
    });

    return NextResponse.json({ success: true, client: result });
  } catch (error) {
    console.error("Client API: Failed to update client", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;

    // Verify client exists
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.tenantId, authContext.tenantId)
        )
      );

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft delete by setting status to archived
    await db.transaction(async (tx) => {
      await tx
        .update(clients)
        .set({
          status: "archived",
          updatedAt: new Date()
        })
        .where(
          and(
            eq(clients.id, clientId),
            eq(clients.tenantId, authContext.tenantId)
          )
        );

      // Log the activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "client",
        entityId: clientId,
        action: "archived",
        description: `Archived client "${existingClient.name}"`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client API: Failed to delete client", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 },
    );
  }
}