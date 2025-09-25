import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Home, FileText, MessageSquare, Calendar } from 'lucide-react';

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/client-portal" className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="text-xl font-semibold">Client Portal</span>
              </Link>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] border-r">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Client Portal</h2>
            <div className="space-y-1">
              <Link href="/client-portal" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/client-portal/documents" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <FileText className="w-5 h-5" />
                <span>Documents</span>
              </Link>
              <Link href="/client-portal/messages" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </Link>
              <Link href="/client-portal/bookings" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Calendar className="w-5 h-5" />
                <span>Book Meeting</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}