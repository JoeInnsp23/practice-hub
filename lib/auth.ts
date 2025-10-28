import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail({
        email: user.email,
        userName: user.name,
        resetLink: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail({
        email: user.email,
        userName: user.name,
        verificationLink: url,
      });
    },
    autoSignInAfterVerification: true,
  },
  socialProviders: (() => {
    const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, NODE_ENV } =
      process.env;

    // Only register Microsoft OAuth if credentials are present
    if (MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET) {
      return {
        microsoft: {
          clientId: MICROSOFT_CLIENT_ID,
          clientSecret: MICROSOFT_CLIENT_SECRET,
          tenantId: "common", // Allows personal + work/school Microsoft accounts
          authority: "https://login.microsoftonline.com",
          prompt: "select_account", // Forces account selection every time
        },
      };
    }

    // In production, Microsoft OAuth is required
    if (NODE_ENV === "production") {
      throw new Error(
        "Microsoft OAuth credentials (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET) are required in production",
      );
    }

    // In development/test, OAuth is optional (allows testing without OAuth)
    return {};
  })(),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (update session if older than this)
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1, // Users can only create one org
    }),
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    // Get the current session from Better Auth
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session || !session.user) {
      return null;
    }

    // Look up the full user record from database to get tenant info
    const { eq } = await import("drizzle-orm");
    const { users, tenants } = await import("@/lib/db/schema");

    const userRecord = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        role: users.role,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        tenantName: tenants.name,
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (userRecord.length === 0) {
      console.warn("Auth: User not found in users table");
      return null;
    }

    const { id, tenantId, role, email, firstName, lastName, tenantName } =
      userRecord[0];

    return {
      userId: id,
      tenantId,
      organizationName: tenantName,
      role,
      email,
      firstName,
      lastName,
    };
  } catch (error: unknown) {
    console.error("Auth: Failed to get auth context", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const authContext = await getAuthContext();

  if (!authContext) {
    throw new Error("Unauthorized");
  }

  return authContext;
}

export async function requireAdmin(): Promise<AuthContext> {
  const authContext = await requireAuth();

  if (authContext.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return authContext;
}
