export default function ClientPortalPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
        Welcome to Your Client Portal
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Access your documents, messages, and book meetings with our team.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Recent Documents
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No recent documents
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            New Messages
          </h3>
          <p className="text-gray-500 dark:text-gray-400">No new messages</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Upcoming Meetings
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No scheduled meetings
          </p>
        </div>
      </div>
    </div>
  );
}
