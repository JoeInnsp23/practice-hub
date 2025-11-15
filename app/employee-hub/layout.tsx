import type { Metadata } from "next";
import { getAuthContext } from "@/lib/auth";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import { EmployeeHubLayoutClient } from "./employee-hub-layout-client";

export const metadata: Metadata = {
  title: "Employee Hub | Practice Hub",
};

export default async function EmployeeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hubColor = HUB_COLORS["employee-hub"];

  // Get auth context for role-based filtering
  const authContext = await getAuthContext();
  const isAdmin = authContext?.role === "admin";

  return (
    <div
      style={
        {
          "--hub-color": hubColor,
          "--hub-color-500": hubColor,
          "--primary": hubColor,
          "--ring": hubColor,
        } as React.CSSProperties
      }
    >
      <EmployeeHubLayoutClient isAdmin={isAdmin}>
        {children}
      </EmployeeHubLayoutClient>
    </div>
  );
}
