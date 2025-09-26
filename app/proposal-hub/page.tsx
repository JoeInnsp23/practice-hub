export default function ProposalHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-8">
        Proposal Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Active Leads
          </h3>
          <p className="text-2xl font-semibold text-card-foreground mt-2">
            0
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Open Proposals
          </h3>
          <p className="text-2xl font-semibold text-card-foreground mt-2">
            0
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Onboarding
          </h3>
          <p className="text-2xl font-semibold text-card-foreground mt-2">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
