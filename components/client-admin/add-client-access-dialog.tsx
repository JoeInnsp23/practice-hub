"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

const addClientAccessSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  role: z.enum(["viewer", "editor", "admin"]),
});

type AddClientAccessForm = z.infer<typeof addClientAccessSchema>;

interface AddClientAccessDialogProps {
  userId: string;
  userName: string;
  existingClientIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddClientAccessDialog({
  userId,
  userName,
  existingClientIds,
  open,
  onOpenChange,
  onSuccess,
}: AddClientAccessDialogProps) {
  const utils = trpc.useUtils();
  const { data: allClientsData, isLoading: isLoadingClients } =
    trpc.clients.list.useQuery({});

  const form = useForm<AddClientAccessForm>({
    resolver: zodResolver(addClientAccessSchema),
    defaultValues: {
      clientId: "",
      role: "viewer",
    },
  });

  const grantAccessMutation = trpc.clientPortalAdmin.grantAccess.useMutation();

  const onSubmit = async (data: AddClientAccessForm) => {
    try {
      await grantAccessMutation.mutateAsync({
        portalUserId: userId,
        clientId: data.clientId,
        role: data.role as "viewer" | "editor" | "admin",
      });
      toast.success("Client access granted");
      form.reset();
      utils.clientPortalAdmin.listPortalUsers.invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to grant access",
      );
    }
  };

  // Filter out clients the user already has access to
  const allClients = allClientsData?.clients || [];
  const availableClients = allClients.filter(
    (client) => !existingClientIds.includes(client.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Client Access</DialogTitle>
          <DialogDescription>
            Add a new client for {userName} to access
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={
                      isLoadingClients ||
                      !availableClients ||
                      availableClients.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                      {availableClients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {availableClients?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      This user already has access to all clients
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                      <SelectItem value="viewer">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Viewer</span>
                          <span className="text-xs text-muted-foreground">
                            Can view proposals and invoices
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Editor</span>
                          <span className="text-xs text-muted-foreground">
                            Can view and sign proposals
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Admin</span>
                          <span className="text-xs text-muted-foreground">
                            Full access to all client data
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={grantAccessMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  grantAccessMutation.isPending ||
                  !availableClients ||
                  availableClients.length === 0
                }
              >
                {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
