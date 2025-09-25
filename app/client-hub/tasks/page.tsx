export default function TasksPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Task
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <p className="text-gray-500">No tasks yet. Create your first task to start tracking.</p>
        </div>
      </div>
    </div>
  );
}