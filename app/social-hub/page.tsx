import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-8">
        Social Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published This Week
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
