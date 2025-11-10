"use client";

import { addDays, format } from "date-fns";
import { Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Send Proposal to Client</DialogTitle>
        <DialogDescription className="sr-only">
          Set a validity date for the proposal and send it to{" "}
          {clientName || "the client"}.
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Send Proposal to Client</CardTitle>
            <CardDescription>
              Set a validity date for the proposal and send it to{" "}
              {clientName || "the client"}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-8 md:px-10">
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
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isPending || !validUntil}>
              {isPending ? "Sending..." : "Send Proposal"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
