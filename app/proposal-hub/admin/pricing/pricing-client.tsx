"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigurationTab } from "./components/configuration-tab";
import { PricingRulesTab } from "./components/pricing-rules-tab";
import { ServiceComponentsTab } from "./components/service-components-tab";

export function PricingManagementClient() {
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Pricing Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage service components, pricing rules, and configuration
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="services">Service Components</TabsTrigger>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <ServiceComponentsTab />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <PricingRulesTab />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <ConfigurationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
