import type { Metadata } from "next";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import { EmployeeHubLayoutClient } from "./employee-hub-layout-client";

export const metadata: Metadata = {
  title: "Employee Hub | Practice Hub",
};

export default function EmployeeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hubColor = HUB_COLORS["employee-hub"];

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
      <EmployeeHubLayoutClient>{children}</EmployeeHubLayoutClient>
    </div>
  );
}
