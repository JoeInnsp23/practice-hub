"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  clientIds: z.array(z.string()).min(1, "Select at least one client"),
  role: z.enum(["viewer", "editor", "admin"]),
  message: z.string().optional(),
});

type InvitationForm = z.infer<typeof invitationSchema>;

interface SendInvitationDialogProps {
  onSuccess?: () => void;
}

export function SendInvitationDialog({ onSuccess }: SendInvitationDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      clientIds: [],
      role: "viewer",
      message: "",
    },
  });

  // Fetch clients for selection
  const { data: clientsData, isLoading: clientsLoading } =
    trpc.clients.list.useQuery({});
  const clients = clientsData?.clients || [];

  // Send invitation mutation
  const sendInvitationMutation =
    trpc.clientPortalAdmin.sendInvitation.useMutation({
      onSuccess: () => {
        toast.success("Invitation sent successfully!");
        form.reset();
        setOpen(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send invitation");
      },
    });

  const onSubmit = (data: InvitationForm) => {
    sendInvitationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          Send Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Client Portal Invitation</DialogTitle>
          <DialogDescription>
            Invite a new user to access the client portal. They'll receive an
            email with instructions to set up their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Personal Information</h3>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Client Access */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Client Access</h3>

              <FormField
                control={form.control}
                name="clientIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clients *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          // For simplicity, this allows single selection
                          // For multi-select, you'd need a different component
                          field.onChange([value]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client(s)" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientsLoading && (
                            <SelectItem value="loading" disabled>
                              Loading clients...
                            </SelectItem>
                          )}
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select which client(s) this user can access
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div>
                              <div className="font-medium">Viewer</div>
                              <div className="text-xs text-muted-foreground">
                                Can view documents and information
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div>
                              <div className="font-medium">Editor</div>
                              <div className="text-xs text-muted-foreground">
                                Can view and edit information
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div>
                              <div className="font-medium">Admin</div>
                              <div className="text-xs text-muted-foreground">
                                Full access and management permissions
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal message to the invitation email..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be included in the invitation email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={sendInvitationMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendInvitationMutation.isPending}>
                {sendInvitationMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Send Invitation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
