import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { AdminHeader } from "./admin-header";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <AdminHeader />

      {/* Admin Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
