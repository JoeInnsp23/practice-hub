import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { PricingManagementClient } from "./pricing-client";

export default async function PricingSettingsPage() {
  const authContext = await getAuthContext();

  // Require admin access
  if (
    !authContext ||
    (authContext.role !== "admin" && authContext.role !== "org:admin")
  ) {
    redirect("/");
  }

  return <PricingManagementClient />;
}
