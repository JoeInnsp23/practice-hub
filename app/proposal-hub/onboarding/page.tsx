"use client";

import { format } from "date-fns";
import {
  Building2,
  Calendar,
  CheckCircle2,
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

export default function OnboardingPage() {
  const router = useRouter();

  // Fetch onboarding sessions
  const { data: sessionsData, isLoading: sessionsLoading } =
    trpc.onboarding.list.useQuery({});
  const sessions = sessionsData?.sessions || [];

  // Fetch stats
  const { data: statsData } = trpc.onboarding.getStats.useQuery();

  // Fetch all clients for total count
  const { data: clientsData } = trpc.clients.list.useQuery({});

  if (sessionsLoading) {
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
          <p className="text-2xl font-bold">{statsData?.recent || 0}</p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold">{statsData?.inProgress || 0}</p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {statsData?.completed || 0}
          </p>
        </Card>
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Clients</span>
          </div>
          <p className="text-2xl font-bold">
            {clientsData?.clients?.length || 0}
          </p>
        </Card>
      </div>

      {/* Onboarding Queue */}
      {sessions.length === 0 ? (
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
          {sessions.map((session) => {
            return (
              <Card
                key={session.id}
                className="glass-card p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/proposal-hub/onboarding/${session.id}`)
                }
              >
                <div className="space-y-4">
                  {/* Client Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {session.clientName}
                        </h3>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            session.status === "completed"
                              ? "text-green-600"
                              : session.status === "in_progress"
                                ? "text-blue-600"
                                : "text-slate-600"
                          }
                        >
                          {session.status
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1),
                            )
                            .join(" ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {session.clientEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {session.clientEmail}
                          </div>
                        )}
                        {session.clientPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {session.clientPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started{" "}
                          {format(new Date(session.startDate), "MMM d, yyyy")}
                        </div>
                        {session.targetCompletionDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target:{" "}
                            {format(
                              new Date(session.targetCompletionDate),
                              "MMM d",
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Onboarding Progress
                      </span>
                      <span className="font-medium">{session.progress}%</span>
                    </div>
                    <Progress value={session.progress} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/client-hub/clients/${session.clientId}`);
                      }}
                    >
                      View Client
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/proposal-hub/onboarding/${session.id}`);
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
