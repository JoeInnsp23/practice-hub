import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProposalHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-8">
        Proposal Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
