import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function useTenant() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const dbUser = await db
        .select({
          user: users,
          tenant: tenants,
        })
        .from(users)
        .innerJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.clerkId, user.id))
        .limit(1);

      return dbUser[0] || null;
    },
    enabled: !!user?.id,
  });
}