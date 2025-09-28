import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services, clientServices } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    let query;
    if (clientId) {
      // Get services assigned to a specific client
      query = sql`
        SELECT * FROM client_services_view
        WHERE tenant_id = ${authContext.tenantId}
          AND client_id = ${clientId}
        ORDER BY service_name
      `;
    } else {
      // Get all services
      query = sql`
        SELECT * FROM services
        WHERE tenant_id = ${authContext.tenantId}
          AND is_active = true
        ORDER BY category, name
      `;
    }

    const result = await db.execute(query);

    const servicesList = result.rows.map((service: any) => ({
      id: service.id,
      code: service.code || service.service_code,
      name: service.name || service.service_name,
      description: service.description || service.service_description,
      category: service.category || service.service_category,
      defaultRate: service.default_rate ? Number(service.default_rate) : null,
      price: service.price ? Number(service.price) : null,
      priceType: service.price_type,
      duration: service.duration,
      tags: service.tags,
      isActive: service.is_active,
      // For client-specific services
      clientId: service.client_id,
      customRate: service.custom_rate ? Number(service.custom_rate) : null,
      effectiveRate: service.effective_rate ? Number(service.effective_rate) : null
    }));

    return NextResponse.json({ services: servicesList });
  } catch (error) {
    console.error("Services API: Failed to fetch services", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
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

    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: code, name" },
        { status: 400 },
      );
    }

    const [newService] = await db
      .insert(services)
      .values({
        tenantId: authContext.tenantId,
        code: body.code,
        name: body.name,
        description: body.description,
        category: body.category,
        defaultRate: body.defaultRate,
        price: body.price || body.defaultRate,
        priceType: body.priceType || "fixed",
        duration: body.duration,
        tags: body.tags,
        isActive: body.isActive !== false
      })
      .returning();

    return NextResponse.json({ success: true, service: newService });
  } catch (error) {
    console.error("Services API: Failed to create service", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 },
    );
  }
}