import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { AdminLayoutClient } from "./admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContext = await getAuthContext();

  // Check for both old and new admin role formats
  if (
    !authContext ||
    (authContext.role !== "admin" && authContext.role !== "org:admin")
  ) {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}