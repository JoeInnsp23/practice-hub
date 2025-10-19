import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useSession } from "@/lib/auth-client";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

export function useTenant() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["tenant", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const dbUser = await db
        .select({
          user: users,
          tenant: tenants,
        })
        .from(users)
        .innerJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.id, session.user.id))
        .limit(1);

      return dbUser[0] || null;
    },
    enabled: !!session?.user?.id,
  });
}
