"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { trpc } from "@/app/providers/trpc-provider";
import { EmailPreviewModal } from "@/components/admin/EmailPreviewModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useSession } from "@/lib/auth-client";

const invitationFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "accountant", "member"]),
  customMessage: z.string().optional(),
});

type InvitationFormValues = z.infer<typeof invitationFormSchema>;

interface SendInvitationDialogProps {
  onSuccess?: () => void;
}

export function SendInvitationDialog({ onSuccess }: SendInvitationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: session } = useSession();

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "member",
      customMessage: "",
    },
  });

  const watchedEmail = form.watch("email");
  const watchedCustomMessage = form.watch("customMessage");

  const sendInvitationMutation = trpc.invitations.send.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      utils.users.list.invalidate();
      setIsOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: InvitationFormValues) => {
    sendInvitationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation to a new user. They will receive an email with a
            link to set up their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The email address where the invitation will be sent
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
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The role the user will have in your organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal welcome message..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A personalized message that will be included in the
                    invitation email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <EmailPreviewModal
                previewData={{
                  email: watchedEmail || "user@example.com",
                  invitedByName: session?.user?.name || "Your Administrator",
                  organizationName: "Practice Hub",
                  customMessage: watchedCustomMessage,
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendInvitationMutation.isPending}>
                {sendInvitationMutation.isPending
                  ? "Sending..."
                  : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
