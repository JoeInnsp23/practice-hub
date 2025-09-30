"use client";

import {
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Phone,
  Plus,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function OnboardingPage() {
  const router = useRouter();

  // Fetch recent clients (last 30 days)
  const { data: clientsData, isLoading } = trpc.clients.list.useQuery({});
  const allClients = clientsData?.clients || [];

  // Filter to recently created clients (within last 30 days)
  const recentClients = allClients.filter((client) => {
    const createdDate = new Date(client.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  });

  // Mock onboarding steps (in a real app, this would come from the database)
  const getOnboardingSteps = (clientId: string) => {
    // This is a simplified version - in production you'd have an onboarding table
    return [
      { id: "welcome", label: "Welcome Email Sent", completed: true },
      { id: "documents", label: "Documents Collected", completed: false },
      { id: "setup", label: "Systems Setup", completed: false },
      { id: "training", label: "Client Training", completed: false },
      { id: "first_service", label: "First Service Delivered", completed: false },
    ];
  };

  const getOnboardingProgress = (clientId: string) => {
    const steps = getOnboardingSteps(clientId);
    const completed = steps.filter((s) => s.completed).length;
    return (completed / steps.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading onboarding queue...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Client Onboarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage new client onboarding
          </p>
        </div>
        <Button onClick={() => router.push("/client-hub/clients/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              New Clients (30d)
            </span>
          </div>
          <p className="text-2xl font-bold">{recentClients.length}</p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold">{recentClients.length}</p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">0</p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Clients</span>
          </div>
          <p className="text-2xl font-bold">{allClients.length}</p>
        </Card>
      </div>

      {/* Onboarding Queue */}
      {recentClients.length === 0 ? (
        <Card className="glass-card p-12">
          <div className="flex flex-col items-center gap-4">
            <UserCheck className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No clients in onboarding
              </h3>
              <p className="text-muted-foreground mb-4">
                New clients will appear here automatically
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recentClients.map((client) => {
            const steps = getOnboardingSteps(client.id);
            const progress = getOnboardingProgress(client.id);

            return (
              <Card
                key={client.id}
                className="glass-card p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/client-hub/clients/${client.id}`)}
              >
                <div className="space-y-4">
                  {/* Client Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                        >
                          {client.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Added {format(new Date(client.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Onboarding Progress
                      </span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Onboarding Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span
                          className={
                            step.completed
                              ? "text-muted-foreground line-through"
                              : ""
                          }
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/client-hub/clients/${client.id}`);
                      }}
                    >
                      View Client
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // In a real app, this would open an onboarding checklist
                      }}
                    >
                      Update Progress
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
