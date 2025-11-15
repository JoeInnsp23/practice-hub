import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import CreateSopForm from "./create-sop-form";

export default async function CreateSopPage() {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create SOP</h1>
        <p className="text-muted-foreground mt-1">
          Upload a new Standard Operating Procedure for your organization
        </p>
      </div>

      <CreateSopForm />
    </div>
  );
}
