export default function ClientPortalPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-2">
        Welcome to Your Client Portal
      </h1>
      <p className="text-muted-foreground mb-8">
        Access your documents, messages, and book meetings with our team.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            Recent Documents
          </h3>
          <p className="text-muted-foreground">
            No recent documents
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            New Messages
          </h3>
          <p className="text-muted-foreground">No new messages</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            Upcoming Meetings
          </h3>
          <p className="text-muted-foreground">
            No scheduled meetings
          </p>
        </div>
      </div>
    </div>
  );
}
