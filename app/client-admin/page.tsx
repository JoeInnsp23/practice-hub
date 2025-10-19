import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientAdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-2">
        Client Admin Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">
        Manage external client portal users, invitations, and access
        permissions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portal Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No portal users yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No pending invitations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
