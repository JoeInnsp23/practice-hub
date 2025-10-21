"use client";

import { Calculator as CalculatorIcon, FileText, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { FloatingPriceWidget } from "@/components/proposal-hub/calculator/floating-price-widget";
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
  const router = useRouter();
  const breakdownRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState("");
  const [turnover, setTurnover] = useState("90k-149k");
  const [industry, setIndustry] = useState<
    "simple" | "standard" | "complex" | "regulated"
  >("standard");
  const [transactionData, setTransactionData] = useState<{
    monthlyTransactions: number;
    source: "xero" | "manual" | "estimated";
  } | null>(null);
  const [selectedServices, setSelectedServices] = useState<
    Array<{
      componentCode: string;
      quantity?: number;
      config?: Record<string, unknown>;
    }>
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >();

  const { data: clientsData } = trpc.clients.list.useQuery({});
  const clients = clientsData?.clients || [];

  // Fetch templates
  const { data: templatesData } = trpc.proposalTemplates.list.useQuery({
    isActive: true,
  });

  // Fetch selected template
  const { data: templateData } = trpc.proposalTemplates.getById.useQuery(
    selectedTemplateId!,
    { enabled: !!selectedTemplateId },
  );

  // Auto-populate services from template
  useEffect(() => {
    if (templateData?.template) {
      const services = Array.isArray(templateData.template.defaultServices)
        ? templateData.template.defaultServices
        : [];
      setSelectedServices(services);
    }
  }, [templateData]);

  // Get pricing calculation
  const { data: pricingData } = trpc.pricing.calculate.useQuery(
    {
      turnover,
      industry: industry as "simple" | "standard" | "complex" | "regulated",
      services: selectedServices,
      transactionData: transactionData || undefined,
    },
    {
      enabled: selectedServices.length > 0,
    },
  );

  // Create proposal mutation
  const { mutate: createProposal, isPending: isCreating } =
    trpc.proposals.create.useMutation({
      onSuccess: (data) => {
        toast.success("Proposal created successfully");
        router.push(`/proposal-hub/proposals/${data.proposal.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create proposal");
      },
    });

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
    const selectedClient = clients.find((c) => c.id === clientId);
    estimateTransactions({
      clientId,
      turnover,
      industry,
      vatRegistered: selectedClient?.vatRegistered ?? false,
      saveEstimate: false,
    });
  };

  const handleServiceSelectionChange = (
    services: Array<{
      componentCode: string;
      quantity?: number;
      config?: Record<string, unknown>;
    }>,
  ) => {
    setSelectedServices(services);
  };

  const handleSaveDraft = () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }
    if (!pricingData) {
      toast.error("Please wait for pricing calculation to complete");
      return;
    }

    // Use recommended model or default to Model A
    const recommendedModel =
      pricingData.recommendation?.model === "B" && pricingData.modelB
        ? pricingData.modelB
        : pricingData.modelA;

    const client = clients.find((c) => c.id === clientId);

    createProposal({
      clientId,
      title: `Proposal for ${client?.name || "Client"}`,
      status: "draft",
      pricingModelUsed: pricingData.recommendation?.model || "A",
      turnover,
      industry,
      monthlyTransactions: transactionData?.monthlyTransactions,
      monthlyTotal: recommendedModel.monthlyTotal.toString(),
      annualTotal: recommendedModel.annualTotal.toString(),
      services: recommendedModel.services.map((service) => ({
        componentCode: service.componentCode,
        componentName: service.componentName,
        calculation: service.calculation,
        price: service.finalPrice,
      })),
    });
  };

  const handleCreateProposal = () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }
    if (!pricingData) {
      toast.error("Please wait for pricing calculation to complete");
      return;
    }

    // Use recommended model or default to Model A
    const recommendedModel =
      pricingData.recommendation?.model === "B" && pricingData.modelB
        ? pricingData.modelB
        : pricingData.modelA;

    const client = clients.find((c) => c.id === clientId);

    createProposal({
      clientId,
      title: `Proposal for ${client?.name || "Client"}`,
      status: "draft",
      pricingModelUsed: pricingData.recommendation?.model || "A",
      turnover,
      industry,
      monthlyTransactions: transactionData?.monthlyTransactions,
      monthlyTotal: recommendedModel.monthlyTotal.toString(),
      annualTotal: recommendedModel.annualTotal.toString(),
      services: recommendedModel.services.map((service) => ({
        componentCode: service.componentCode,
        componentName: service.componentName,
        calculation: service.calculation,
        price: service.finalPrice,
      })),
    });
  };

  const handleViewBreakdown = () => {
    breakdownRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!clientId || selectedServices.length === 0 || isCreating}
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={handleCreateProposal}
            disabled={!clientId || selectedServices.length === 0 || isCreating}
          >
            <Send className="h-4 w-4 mr-2" />
            {isCreating ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            Start from Template (Optional)
          </h2>
        </div>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template to prefill services..." />
          </SelectTrigger>
          <SelectContent>
            {templatesData?.templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} {template.isDefault && "(Default)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

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
            <Select
              value={industry}
              onValueChange={(value) =>
                setIndustry(
                  value as "simple" | "standard" | "complex" | "regulated",
                )
              }
            >
              <SelectTrigger id="industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">
                  Simple (Consultancy, B2B)
                </SelectItem>
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
                    monthlyTransactions: Number.parseInt(e.target.value, 10),
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
        <div ref={breakdownRef}>
          <PricingCalculator
            turnover={turnover}
            industry={industry}
            services={selectedServices}
            transactionData={transactionData || undefined}
          />
        </div>
      )}

      {/* Floating Price Widget */}
      <FloatingPriceWidget
        turnover={turnover}
        industry={industry}
        services={selectedServices}
        transactionData={transactionData || undefined}
        onCreateProposal={handleCreateProposal}
        onViewBreakdown={handleViewBreakdown}
      />
    </div>
  );
}
