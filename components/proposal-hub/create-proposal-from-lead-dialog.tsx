"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
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
import type { leads } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;

interface CreateProposalFromLeadDialogProps {
  lead: Lead;
}

export function CreateProposalFromLeadDialog({
  lead,
}: CreateProposalFromLeadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const createMutation = trpc.proposals.createFromLead.useMutation({
    onSuccess: (data) => {
      toast.success("Proposal created successfully!");
      setOpen(false);
      // Redirect to calculator with the proposal ID
      router.push(`/proposal-hub/calculator?proposalId=${data.proposal.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create proposal");
    },
  });

  const handleCreate = () => {
    if (!lead.id) {
      toast.error("Invalid lead ID");
      return;
    }

    createMutation.mutate({
      leadId: lead.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Create Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Proposal from Lead</DialogTitle>
          <DialogDescription>
            This will create a new proposal pre-filled with lead data and take
            you to the calculator to configure services and pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Lead Information
            </h4>
            <div className="grid gap-3">
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="text-sm font-medium">Company:</span>
                <span className="text-sm">{lead.companyName || "N/A"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="text-sm font-medium">Contact:</span>
                <span className="text-sm">{lead.firstName} {lead.lastName}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{lead.email}</span>
              </div>
              {lead.estimatedTurnover && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-sm font-medium">Est. Turnover:</span>
                  <span className="text-sm">£{lead.estimatedTurnover}</span>
                </div>
              )}
              {lead.industry && (
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-sm font-medium">Industry:</span>
                  <span className="text-sm">{lead.industry}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Next Steps:</strong> The proposal will be created and
              you'll be taken to the calculator to configure pricing and
              services. The lead status will be updated to "Proposal Sent".
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create & Go to Calculator
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
