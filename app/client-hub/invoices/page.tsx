export default function InvoicesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Invoices
        </h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          Create Invoice
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">
            No invoices yet. Create your first invoice from time entries.
          </p>
        </div>
      </div>
    </div>
  );
}
