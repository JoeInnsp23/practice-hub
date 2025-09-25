import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContext = await getAuthContext();

  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Back to App</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-500" />
                <div>
                  <h1 className="text-xl font-semibold">Admin Panel</h1>
                </div>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link
                href="/admin"
                className="hover:text-orange-400 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="hover:text-orange-400 transition-colors"
              >
                Users
              </Link>
              <Link
                href="/admin/feedback"
                className="hover:text-orange-400 transition-colors"
              >
                Feedback
              </Link>
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
