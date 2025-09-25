export default function SocialHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Social Hub</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Connected Accounts</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Scheduled Posts</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Content Drafts</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Published This Week</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}