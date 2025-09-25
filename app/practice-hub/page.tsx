import Link from 'next/link';
import {
  Users,
  FileText,
  TrendingUp,
  Share2,
  UserCheck,
  DollarSign,
  BookOpen,
  Calculator
} from 'lucide-react';

const modules = [
  {
    id: 'client-hub',
    name: 'Client Hub',
    description: 'CRM, tasks, time tracking & invoicing',
    href: '/client-hub',
    icon: Users,
    color: 'bg-blue-500',
    available: true,
  },
  {
    id: 'proposal-hub',
    name: 'Proposal Hub',
    description: 'Leads, proposals & onboarding',
    href: '/proposal-hub',
    icon: FileText,
    color: 'bg-green-500',
    available: true,
  },
  {
    id: 'social-hub',
    name: 'Social Hub',
    description: 'Social media & content management',
    href: '/social-hub',
    icon: Share2,
    color: 'bg-purple-500',
    available: true,
  },
  {
    id: 'client-portal',
    name: 'Client Portal',
    description: 'Client access & communication',
    href: '/client-portal',
    icon: UserCheck,
    color: 'bg-indigo-500',
    available: true,
  },
  {
    id: 'payroll-app',
    name: 'Payroll App',
    description: 'Payroll & HMRC submissions',
    href: '/payroll-app',
    icon: DollarSign,
    color: 'bg-yellow-500',
    available: false,
  },
  {
    id: 'bookkeeping-hub',
    name: 'Bookkeeping Hub',
    description: 'Client bookkeeping & reports',
    href: '/bookkeeping-hub',
    icon: BookOpen,
    color: 'bg-orange-500',
    available: false,
  },
  {
    id: 'accounts-hub',
    name: 'Accounts Hub',
    description: 'Working papers & consolidation',
    href: '/accounts-hub',
    icon: Calculator,
    color: 'bg-red-500',
    available: false,
  },
];

export default function PracticeHubPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Practice Hub</h1>
        <p className="text-gray-600 mt-2">Your central hub for practice management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.id}
              href={module.available ? module.href : '#'}
              className={`relative group block ${!module.available ? 'cursor-not-allowed' : ''}`}
            >
              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
                module.available ? 'hover:shadow-lg hover:border-gray-300' : 'opacity-60'
              }`}>
                <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
                {!module.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <span className="text-gray-500 font-medium">Coming Soon</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">1</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Tasks</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Revenue This Month</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">£0</p>
        </div>
      </div>
    </div>
  );
}