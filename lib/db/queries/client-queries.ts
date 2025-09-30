import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientDetailsView } from "@/lib/db/schema";

/**
 * Fetch clients list with filters
 * Uses client_details_view for joined data
 */
export async function getClientsList(
  tenantId: string,
  filters: {
    search?: string;
    type?: string;
    status?: string;
  },
) {
  const conditions = [eq(clientDetailsView.tenantId, tenantId)];

  // Search filter (name, client code, or email)
  if (filters.search) {
    conditions.push(
      or(
        ilike(clientDetailsView.name, `%${filters.search}%`),
        ilike(clientDetailsView.clientCode, `%${filters.search}%`),
        ilike(clientDetailsView.email, `%${filters.search}%`),
      )!,
    );
  }

  // Type filter
  if (filters.type && filters.type !== "all") {
    conditions.push(eq(clientDetailsView.type, filters.type));
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(clientDetailsView.status, filters.status));
  }

  const clients = await db
    .select()
    .from(clientDetailsView)
    .where(and(...conditions))
    .orderBy(clientDetailsView.name);

  return clients;
}