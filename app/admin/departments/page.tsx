import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import DepartmentsClient from "./departments-client";

export default async function DepartmentsPage() {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return <DepartmentsClient tenantId={authContext.tenantId} />;
}
