"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardFormData } from "../client-wizard-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ServiceConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const SERVICE_DETAILS: Record<string, { frequency: string; defaultPeriod?: string; color?: string }> = {
  bookkeeping: { frequency: "monthly", color: "blue" },
  vat_returns: { frequency: "quarterly", defaultPeriod: "Q1", color: "green" },
  annual_accounts: { frequency: "annual", color: "purple" },
  corporation_tax: { frequency: "annual", color: "orange" },
  self_assessment: { frequency: "annual", color: "pink" },
  payroll: { frequency: "monthly", color: "cyan" },
  company_secretarial: { frequency: "annual", color: "yellow" },
  management_accounts: { frequency: "monthly", color: "indigo" },
};

export function ServiceConfigurationStep({ formData, updateFormData }: ServiceConfigurationStepProps) {
  const selectedServices = formData.selectedServices || [];

  if (selectedServices.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No Services Selected</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Please select services in the previous step to configure their schedules and timing.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getFrequencyBadge = (frequency: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      monthly: "default",
      quarterly: "secondary",
      annual: "outline",
    };
    return variants[frequency] || "default";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Configure the schedule and timing for each selected service.
        </p>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {selectedServices.length} Service{selectedServices.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {selectedServices.map((serviceId) => {
        const serviceConfig = SERVICE_DETAILS[serviceId];
        const serviceName = serviceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return (
          <Card key={serviceId} className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  {serviceName}
                </div>
                <Badge variant={getFrequencyBadge(serviceConfig?.frequency || '')}>
                  {serviceConfig?.frequency || 'custom'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Frequency</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={serviceConfig?.frequency || 'custom'}
                      disabled
                      className="capitalize bg-muted"
                    />
                  </div>
                </div>

                {serviceConfig?.frequency === 'quarterly' && (
                  <div className="space-y-2">
                    <Label>VAT Period</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Jan/Apr/Jul/Oct)</SelectItem>
                        <SelectItem value="feb">February Stagger</SelectItem>
                        <SelectItem value="mar">March Stagger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {serviceConfig?.frequency === 'annual' && (
                  <div className="space-y-2">
                    <Label>Year End</Label>
                    <Input type="date" placeholder="Select year end date" />
                  </div>
                )}

                {serviceConfig?.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Select defaultValue="15">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5th</SelectItem>
                        <SelectItem value="10">10th</SelectItem>
                        <SelectItem value="15">15th</SelectItem>
                        <SelectItem value="20">20th</SelectItem>
                        <SelectItem value="25">25th</SelectItem>
                        <SelectItem value="last">Last day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}