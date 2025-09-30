"use client";

import { UserCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConvertToClientDialogProps {
  leadId: string;
  leadName: string;
  companyName?: string;
  onSuccess?: (clientId: string) => void;
}

export function ConvertToClientDialog({
  leadId,
  leadName,
  companyName,
  onSuccess,
}: ConvertToClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [type, setType] = useState("company");

  const utils = trpc.useUtils();

  const { mutate: convertToClient, isPending } =
    trpc.leads.convertToClient.useMutation({
      onSuccess: (data) => {
        toast.success("Lead converted to client successfully");
        utils.leads.getById.invalidate(leadId);
        utils.leads.list.invalidate();
        utils.clients.list.invalidate();
        setOpen(false);
        onSuccess?.(data.client.id);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to convert lead to client");
      },
    });

  const handleConvert = () => {
    if (!clientCode) {
      toast.error("Please enter a client code");
      return;
    }

    convertToClient({
      leadId,
      clientData: {
        clientCode,
        type,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserCheck className="h-4 w-4 mr-2" />
          Convert to Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead to Client</DialogTitle>
          <DialogDescription>
            Convert {leadName} from {companyName || "Unknown Company"} into an
            active client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientCode">Client Code *</Label>
            <Input
              id="clientCode"
              placeholder="e.g., CLT001"
              value={clientCode}
              onChange={(e) =>
                setClientCode(e.target.value.toUpperCase())
              }
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for the client
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Client Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="sole_trader">Sole Trader</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium mb-1">What happens next:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Client record will be created</li>
              <li>Lead status will be updated to "converted"</li>
              <li>Any linked proposals will be associated with the client</li>
              <li>Client will appear in onboarding queue</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isPending || !clientCode}>
            {isPending ? "Converting..." : "Convert to Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
