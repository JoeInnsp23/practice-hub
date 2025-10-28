"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientPortalContext } from "@/contexts/client-portal-context";

export function ClientSwitcher() {
  const { currentClientId, setCurrentClientId, setClientAccess } =
    useClientPortalContext();

  // Fetch user's client access list
  const { data: clients, isLoading } =
    trpc.clientPortal.getMyClients.useQuery();

  // Update context when data loads
  useEffect(() => {
    if (clients) {
      setClientAccess(clients);
    }
  }, [clients, setClientAccess]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No clients</span>
      </div>
    );
  }

  const currentClient = clients.find((c) => c.clientId === currentClientId);

  // Helper to get role badge color
  const getRoleBadgeVariant = (
    role: string,
  ): "default" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate text-sm font-medium">
              {currentClient?.clientName || "Select Client"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {clients.map((client) => (
          <DropdownMenuItem
            key={client.clientId}
            onClick={() => setCurrentClientId(client.clientId)}
            className="flex items-center justify-between cursor-pointer py-3"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {currentClientId === client.clientId ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {client.clientName}
                </p>
                <Badge
                  variant={getRoleBadgeVariant(client.role)}
                  className="mt-1 text-xs"
                >
                  {client.role}
                </Badge>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        {clients.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground">
                Managing {clients.length}{" "}
                {clients.length === 1 ? "client" : "clients"}
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
