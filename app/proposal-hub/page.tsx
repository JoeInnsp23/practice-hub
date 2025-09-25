export default function ProposalHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-8">
        Proposal Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Leads
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Open Proposals
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Onboarding
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mt-2">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
