import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import SopsClient from "./sops-client";

export default async function SopsPage() {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return <SopsClient />;
}
