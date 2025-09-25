import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Home, Share2, FileText, Calendar } from 'lucide-react';

export default function SocialHubLayout({
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
              <span className="text-lg font-medium text-purple-600">Social Hub</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] border-r">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Social Hub</h2>
            <div className="space-y-1">
              <Link href="/social-hub" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Home className="w-5 h-5" />
                <span>Overview</span>
              </Link>
              <Link href="/social-hub/accounts" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Share2 className="w-5 h-5" />
                <span>Accounts</span>
              </Link>
              <Link href="/social-hub/content" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <FileText className="w-5 h-5" />
                <span>Content</span>
              </Link>
              <Link href="/social-hub/schedule" className="flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
                <Calendar className="w-5 h-5" />
                <span>Schedule</span>
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