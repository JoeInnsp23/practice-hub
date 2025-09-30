"use client";

import { Calculator as CalculatorIcon, Save, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { PricingCalculator } from "@/components/proposal-hub/calculator/pricing-calculator";
import { ServiceSelector } from "@/components/proposal-hub/calculator/service-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalculatorPage() {
  const [clientId, setClientId] = useState("");
  const [turnover, setTurnover] = useState("90k-149k");
  const [industry, setIndustry] = useState("standard");
  const [transactionData, setTransactionData] = useState<{
    monthlyTransactions: number;
    source: "xero" | "manual" | "estimated";
  } | null>(null);
  const [selectedServices, setSelectedServices] = useState<
    Array<{
      componentCode: string;
      quantity?: number;
      config?: Record<string, any>;
    }>
  >([]);

  const { data: clientsData } = trpc.clients.list.useQuery({});
  const clients = clientsData?.clients || [];

  // Estimate transactions mutation
  const { mutate: estimateTransactions, isPending: isEstimating } =
    trpc.transactionData.estimate.useMutation({
      onSuccess: (data) => {
        setTransactionData({
          monthlyTransactions: data.estimated,
          source: "estimated",
        });
        toast.success(`Estimated ${data.estimated} monthly transactions`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to estimate transactions");
      },
    });

  const handleEstimateTransactions = () => {
    if (!clientId) {
      toast.error("Please select a client first");
      return;
    }
    estimateTransactions({
      clientId,
      turnover,
      industry,
      vatRegistered: true, // TODO: Get from client data
      saveEstimate: false,
    });
  };

  const handleServiceSelectionChange = (
    services: Array<{
      componentCode: string;
      quantity?: number;
      config?: Record<string, any>;
    }>,
  ) => {
    setSelectedServices(services);
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved successfully");
    // TODO: Implement save draft
  };

  const handleCreateProposal = () => {
    toast.success("Proposal created successfully");
    // TODO: Implement create proposal
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Pricing Calculator
          </h1>
          <p className="text-muted-foreground mt-2">
            Calculate pricing and create proposals for clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleCreateProposal} disabled={!clientId || selectedServices.length === 0}>
            <Send className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>

      {/* Business Information */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <CalculatorIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Business Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Client Selection */}
          <div>
            <Label htmlFor="client">Client / Prospect *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.clientCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turnover */}
          <div>
            <Label htmlFor="turnover">Annual Turnover *</Label>
            <Select value={turnover} onValueChange={setTurnover}>
              <SelectTrigger id="turnover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-89k">£0 - £89k</SelectItem>
                <SelectItem value="90k-149k">£90k - £149k</SelectItem>
                <SelectItem value="150k-249k">£150k - £249k</SelectItem>
                <SelectItem value="250k-499k">£250k - £499k</SelectItem>
                <SelectItem value="500k-749k">£500k - £749k</SelectItem>
                <SelectItem value="750k-999k">£750k - £999k</SelectItem>
                <SelectItem value="1m+">£1m+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Industry */}
          <div>
            <Label htmlFor="industry">Industry Type *</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (Consultancy, B2B)</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="complex">
                  Complex (Retail, E-commerce)
                </SelectItem>
                <SelectItem value="regulated">
                  Regulated (Financial Services)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Transactions */}
          <div>
            <Label htmlFor="transactions">Monthly Transactions</Label>
            <div className="flex gap-2">
              <Input
                id="transactions"
                type="number"
                placeholder="Enter or estimate..."
                value={transactionData?.monthlyTransactions || ""}
                onChange={(e) =>
                  setTransactionData({
                    monthlyTransactions: Number.parseInt(e.target.value),
                    source: "manual",
                  })
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleEstimateTransactions}
                disabled={isEstimating || !clientId}
              >
                Estimate
              </Button>
            </div>
            {transactionData && (
              <p className="text-xs text-muted-foreground mt-1">
                Source: {transactionData.source}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Service Selection */}
      <ServiceSelector
        selectedServices={selectedServices}
        onChange={handleServiceSelectionChange}
      />

      {/* Pricing Calculator Results */}
      {clientId && selectedServices.length > 0 && (
        <PricingCalculator
          turnover={turnover}
          industry={industry}
          services={selectedServices}
          transactionData={transactionData || undefined}
        />
      )}
    </div>
  );
}
