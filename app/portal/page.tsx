import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientPortalDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-2">
        Welcome to Your Client Portal
      </h1>
      <p className="text-muted-foreground mb-8">
        Access your proposals, invoices, and documents in one secure location.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No proposals yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No invoices yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No documents yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
