"use client";

import { UserCheck } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Convert Lead to Client</DialogTitle>
        <DialogDescription className="sr-only">
          Convert {leadName} from {companyName || "Unknown Company"} into an
          active client.
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Convert Lead to Client</CardTitle>
            <CardDescription>
              Convert {leadName} from {companyName || "Unknown Company"} into an
              active client.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-8 md:px-10">
            <div className="space-y-2">
              <Label htmlFor="clientCode">Client Code *</Label>
              <Input
                id="clientCode"
                placeholder="e.g., CLT001"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value.toUpperCase())}
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
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={isPending || !clientCode}>
              {isPending ? "Converting..." : "Convert to Client"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
