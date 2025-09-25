export default function ClientsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Client
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <p className="text-gray-500">No clients yet. Add your first client to get started.</p>
        </div>
      </div>
    </div>
  );
}