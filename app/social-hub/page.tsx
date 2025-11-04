import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardInteractive } from "@/components/ui/card-interactive";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

export default function SocialHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-card-foreground mb-8">
        Social Hub
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardInteractive
          moduleColor={HUB_COLORS["social-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0s", opacity: 0 }}
          ariaLabel="Connected Accounts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </CardInteractive>
        <CardInteractive
          moduleColor={HUB_COLORS["social-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
          ariaLabel="Scheduled Posts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </CardInteractive>
        <CardInteractive
          moduleColor={HUB_COLORS["social-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.2s", opacity: 0 }}
          ariaLabel="Content Drafts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </CardInteractive>
        <CardInteractive
          moduleColor={HUB_COLORS["social-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.3s", opacity: 0 }}
          ariaLabel="Published This Week"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-card-foreground">0</p>
          </CardContent>
        </CardInteractive>
      </div>
    </div>
  );
}
