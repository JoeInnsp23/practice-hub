export default function ClientsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Clients
        </h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          Add Client
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">
            No clients yet. Add your first client to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
