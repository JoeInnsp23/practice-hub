"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Settings as SettingsIcon,
  Unplug,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "xero" | "quickbooks" | "sage" | "slack" | "teams" | "stripe";
  category: "accounting" | "communication" | "payment";
  available: boolean;
  comingSoon?: boolean;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: "xero",
    name: "Xero",
    description: "Sync clients, invoices, and financial data with Xero accounting software",
    icon: "🔵",
    type: "xero",
    category: "accounting",
    available: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Connect with QuickBooks Online for seamless accounting integration",
    icon: "🟢",
    type: "quickbooks",
    category: "accounting",
    available: false,
    comingSoon: true,
  },
  {
    id: "sage",
    name: "Sage",
    description: "Integrate with Sage accounting platform for automated bookkeeping",
    icon: "🟡",
    type: "sage",
    category: "accounting",
    available: false,
    comingSoon: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and updates in your Slack workspace",
    icon: "💬",
    type: "slack",
    category: "communication",
    available: false,
    comingSoon: true,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Receive practice updates and notifications in Microsoft Teams",
    icon: "👥",
    type: "teams",
    category: "communication",
    available: false,
    comingSoon: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept online payments and sync payment data automatically",
    icon: "💳",
    type: "stripe",
    category: "payment",
    available: false,
    comingSoon: true,
  },
];

export default function IntegrationsPage() {
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: integrationsList, isLoading } = trpc.integrations.list.useQuery();
  const { data: xeroAuthData } = trpc.integrations.getXeroAuthUrl.useQuery();
  const testConnectionMutation = trpc.integrations.testConnection.useMutation();
  const disconnectMutation = trpc.integrations.disconnect.useMutation();

  const handleConnectXero = () => {
    if (xeroAuthData?.url) {
      // Open OAuth flow in current window
      window.location.href = xeroAuthData.url;
    }
  };

  const handleTestConnection = async (integrationType: Integration["type"]) => {
    setTestingConnection(integrationType);

    try {
      const result = await testConnectionMutation.mutateAsync({
        integrationType,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Connection test failed");
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;

    try {
      const result = await disconnectMutation.mutateAsync({
        integrationType: selectedIntegration.type,
      });

      if (result.success) {
        toast.success(result.message);
        utils.integrations.list.invalidate();
        setDisconnectModalOpen(false);
        setSelectedIntegration(null);
      }
    } catch (error) {
      toast.error("Failed to disconnect integration");
    }
  };

  const getIntegrationStatus = (integrationType: string) => {
    return integrationsList?.find((i) => i.integrationType === integrationType);
  };

  const isConnected = (integrationType: string) => {
    const status = getIntegrationStatus(integrationType);
    return status?.enabled && status?.syncStatus === "connected";
  };

  const getLastSyncText = (integrationType: string) => {
    const status = getIntegrationStatus(integrationType);
    if (!status?.lastSyncedAt) return null;

    return `Last synced ${formatDistanceToNow(new Date(status.lastSyncedAt), { addSuffix: true })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integration Settings</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to automate workflows and sync data
        </p>
      </div>

      {/* Accounting Integrations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Accounting Software
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_INTEGRATIONS.filter((i) => i.category === "accounting").map((integration) => {
            const connected = isConnected(integration.type);
            const status = getIntegrationStatus(integration.type);
            const lastSync = getLastSyncText(integration.type);

            return (
              <Card key={integration.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        {integration.comingSoon && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                    {connected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription className="mt-2">{integration.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={`font-medium ${connected ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  {/* Last sync time */}
                  {lastSync && (
                    <div className="text-xs text-muted-foreground">{lastSync}</div>
                  )}

                  {/* Error message */}
                  {status?.syncError && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                      {status.syncError}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {integration.available ? (
                      <>
                        {connected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleTestConnection(integration.type)}
                              disabled={testingConnection === integration.type}
                            >
                              {testingConnection === integration.type ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-1" />
                                  Test
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setConfigModalOpen(true);
                              }}
                            >
                              <SettingsIcon className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setDisconnectModalOpen(true);
                              }}
                            >
                              <Unplug className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (integration.type === "xero") {
                                handleConnectXero();
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect {integration.name}
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Communication Integrations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Communication</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_INTEGRATIONS.filter((i) => i.category === "communication").map(
            (integration) => {
              return (
                <Card key={integration.id} className="glass-card opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{integration.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      </div>

      {/* Payment Integrations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_INTEGRATIONS.filter((i) => i.category === "payment").map((integration) => {
            return (
              <Card key={integration.id} className="glass-card opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Configuration Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Manage sync settings and data mapping preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="syncFrequency">Sync Frequency</Label>
              <select
                id="syncFrequency"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="realtime">Real-time (recommended)</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Auto-sync Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sync new clients</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sync new invoices</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sync payments</span>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Configuration saved");
                setConfigModalOpen(false);
              }}
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {selectedIntegration?.name}?</DialogTitle>
            <DialogDescription>
              This will stop syncing data with {selectedIntegration?.name}. You can reconnect at
              any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
