import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
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
    sortBy?:
      | "clientCode"
      | "name"
      | "type"
      | "status"
      | "email"
      | "accountManager"
      | "createdAt";
    sortOrder?: "asc" | "desc";
  },
) {
  const conditions = [eq(clientDetailsView.tenantId, tenantId)];

  // Search filter (name, client code, or email)
  if (filters.search) {
    const searchCondition = or(
      ilike(clientDetailsView.name, `%${filters.search}%`),
      ilike(clientDetailsView.clientCode, `%${filters.search}%`),
      ilike(clientDetailsView.email, `%${filters.search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  // Type filter
  if (filters.type && filters.type !== "all") {
    conditions.push(eq(clientDetailsView.type, filters.type));
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(clientDetailsView.status, filters.status));
  }

  // Build orderBy based on sortBy and sortOrder
  const orderByArray = [];
  const sortDirection = filters.sortOrder === "desc" ? desc : asc;

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "clientCode":
        orderByArray.push(sortDirection(clientDetailsView.clientCode));
        break;
      case "name":
        orderByArray.push(sortDirection(clientDetailsView.name));
        break;
      case "type":
        orderByArray.push(sortDirection(clientDetailsView.type));
        break;
      case "status":
        orderByArray.push(sortDirection(clientDetailsView.status));
        break;
      case "email":
        orderByArray.push(sortDirection(clientDetailsView.email));
        break;
      case "accountManager":
        orderByArray.push(sortDirection(clientDetailsView.accountManagerName));
        break;
      case "createdAt":
        orderByArray.push(sortDirection(clientDetailsView.createdAt));
        break;
    }
  } else {
    // Default sorting by name
    orderByArray.push(asc(clientDetailsView.name));
  }

  const clients = await db
    .select()
    .from(clientDetailsView)
    .where(and(...conditions))
    .orderBy(...orderByArray);

  return clients;
}
