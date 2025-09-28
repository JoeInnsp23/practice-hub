import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, clientContacts, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { broadcastToTenant } from "@/app/api/sse/route";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build the base query using the view for denormalized data
    let query = sql`
      SELECT * FROM client_details_view
      WHERE tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (search) {
      conditions.push(sql`(
        name ILIKE ${`%${search}%`} OR
        client_code ILIKE ${`%${search}%`} OR
        email ILIKE ${`%${search}%`}
      )`);
    }
    if (type && type !== "all") {
      conditions.push(sql`type = ${type}`);
    }
    if (status && status !== "all") {
      conditions.push(sql`status = ${status}`);
    }

    // Combine conditions
    if (conditions.length > 0) {
      query = sql`
        SELECT * FROM client_details_view
        WHERE tenant_id = ${authContext.tenantId}
          AND ${sql.join(conditions, sql` AND `)}
      `;
    }

    // Add ordering
    query = sql`${query} ORDER BY created_at DESC`;

    const result = await db.execute(query);

    // Format the response
    const clientsList = result.rows.map((client: any) => ({
      id: client.id,
      clientCode: client.client_code,
      name: client.name,
      type: client.type,
      status: client.status,
      email: client.email,
      phone: client.phone,
      website: client.website,
      vatNumber: client.vat_number,
      registrationNumber: client.registration_number,
      addressLine1: client.address_line1,
      addressLine2: client.address_line2,
      city: client.city,
      state: client.state,
      postalCode: client.postal_code,
      country: client.country,
      accountManagerId: client.account_manager_id,
      accountManagerName: client.account_manager_name,
      accountManagerEmail: client.account_manager_email,
      incorporationDate: client.incorporation_date,
      yearEnd: client.year_end,
      notes: client.notes,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));

    return NextResponse.json({ clients: clientsList });
  } catch (error) {
    console.error("Clients API: Failed to fetch clients", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
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

    // Validate required fields
    if (!body.name || !body.type || !body.clientCode) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, clientCode" },
        { status: 400 },
      );
    }

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the client
      const [newClient] = await tx
        .insert(clients)
        .values({
          tenantId: authContext.tenantId,
          clientCode: body.clientCode,
          name: body.name,
          type: body.type,
          status: body.status || "active",
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
          accountManagerId: body.accountManagerId || authContext.userId,
          incorporationDate: body.incorporationDate,
          yearEnd: body.yearEnd,
          notes: body.notes,
          createdBy: authContext.userId
        })
        .returning();

      // Create primary contact if provided
      if (body.primaryContact) {
        await tx.insert(clientContacts).values({
          tenantId: authContext.tenantId,
          clientId: newClient.id,
          isPrimary: true,
          firstName: body.primaryContact.firstName,
          lastName: body.primaryContact.lastName,
          email: body.primaryContact.email,
          phone: body.primaryContact.phone,
          mobile: body.primaryContact.mobile,
          position: body.primaryContact.position
        });
      }

      // Log the activity
      await tx.insert(activityLogs).values({
        tenantId: authContext.tenantId,
        entityType: "client",
        entityId: newClient.id,
        action: "created",
        description: `Created new client "${body.name}"`,
        userId: authContext.userId,
        userName: `${authContext.firstName} ${authContext.lastName}`,
        newValues: { name: body.name, type: body.type, status: body.status || "active" }
      });

      return newClient;
    });

    // Send real-time notification
    broadcastToTenant(authContext.tenantId, {
      type: "notification",
      data: {
        type: "success",
        title: "New Client Added",
        message: `${body.name} has been added to your client list`,
        actionUrl: `/client-hub/clients/${result.id}`,
      },
    });

    return NextResponse.json({ success: true, client: result });
  } catch (error) {
    console.error("Clients API: Failed to create client", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
}