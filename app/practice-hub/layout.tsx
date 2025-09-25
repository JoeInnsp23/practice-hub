import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Home, Settings } from 'lucide-react';

export default function PracticeHubLayout({
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
              <nav className="flex space-x-4">
                <Link href="/practice-hub/settings" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}