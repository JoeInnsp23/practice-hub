"use client";

import { addDays, format } from "date-fns";
import { Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SendProposalDialogProps {
  proposalId: string;
  proposalTitle: string;
  clientName?: string;
  onSuccess?: () => void;
}

export function SendProposalDialog({
  proposalId,
  proposalTitle,
  clientName,
  onSuccess,
}: SendProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 30), "yyyy-MM-dd"),
  );

  const utils = trpc.useUtils();

  const { mutate: sendProposal, isPending } = trpc.proposals.send.useMutation({
    onSuccess: () => {
      toast.success("Proposal sent successfully");
      utils.proposals.getById.invalidate(proposalId);
      utils.proposals.list.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send proposal");
    },
  });

  const handleSend = () => {
    sendProposal({
      id: proposalId,
      validUntil,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send to Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Proposal to Client</DialogTitle>
          <DialogDescription>
            Set a validity date for the proposal and send it to{" "}
            {clientName || "the client"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="proposal">Proposal</Label>
            <Input id="proposal" value={proposalTitle} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid Until *</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
            <p className="text-xs text-muted-foreground">
              The proposal will be valid until this date
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending || !validUntil}>
            {isPending ? "Sending..." : "Send Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
