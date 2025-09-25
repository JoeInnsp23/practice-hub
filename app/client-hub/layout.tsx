import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Home, Users, CheckSquare, Clock, FileText } from 'lucide-react';

export default function ClientHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/practice-hub" className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="text-xl font-semibold">Practice Hub</span>
              </Link>
              <div className="text-gray-400">/</div>
              <span className="text-lg font-medium text-blue-600">Client Hub</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] border-r">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Client Hub</h2>
            <div className="space-y-1">
              <Link href="/client-hub" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Home className="w-5 h-5" />
                <span>Overview</span>
              </Link>
              <Link href="/client-hub/clients" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Users className="w-5 h-5" />
                <span>Clients</span>
              </Link>
              <Link href="/client-hub/tasks" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <CheckSquare className="w-5 h-5" />
                <span>Tasks</span>
              </Link>
              <Link href="/client-hub/time" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Clock className="w-5 h-5" />
                <span>Time Tracking</span>
              </Link>
              <Link href="/client-hub/invoices" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <FileText className="w-5 h-5" />
                <span>Invoices</span>
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