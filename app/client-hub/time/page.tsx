export default function TimePage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Time Tracking
        </h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          Start Timer
        </button>
      </div>
      <div className="bg-card rounded-lg shadow dark:shadow-slate-900/50">
        <div className="px-6 py-4 border-b border">
          <p className="text-muted-foreground dark:text-muted-foreground">
            No time entries yet. Start tracking time for your tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
