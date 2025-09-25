export default function ClientHubDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-8">
        Client Hub Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Clients
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Tasks
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Hours This Week
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Pending Invoices
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Recent Tasks
          </h2>
          <p className="text-gray-500 dark:text-gray-400">No recent tasks</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Time Entries Today
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            No time entries today
          </p>
        </div>
      </div>
    </div>
  );
}
