import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContext = await getAuthContext();

  // Check for both old and new admin role formats
  if (!authContext || (authContext.role !== "admin" && authContext.role !== "org:admin")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/practice-hub"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Back to Practice Hub</span>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    System Administration
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">Users</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/feedback">Feedback</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}