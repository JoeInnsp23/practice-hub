import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No new messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No scheduled meetings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
