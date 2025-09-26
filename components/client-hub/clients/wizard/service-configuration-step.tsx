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
import { CalendarIcon } from "lucide-react";

interface ServiceConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

const SERVICE_DETAILS: Record<string, { frequency: string; defaultPeriod?: string }> = {
  bookkeeping: { frequency: "monthly" },
  vat_returns: { frequency: "quarterly", defaultPeriod: "Q1" },
  annual_accounts: { frequency: "annual" },
  corporation_tax: { frequency: "annual" },
  self_assessment: { frequency: "annual" },
  payroll: { frequency: "monthly" },
  company_secretarial: { frequency: "annual" },
  management_accounts: { frequency: "monthly" },
};

export function ServiceConfigurationStep({ formData, updateFormData }: ServiceConfigurationStepProps) {
  const selectedServices = formData.selectedServices || [];

  if (selectedServices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No services selected. Please select services in the previous step.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Configure the schedule and timing for each selected service.
      </p>

      {selectedServices.map((serviceId) => {
        const serviceConfig = SERVICE_DETAILS[serviceId];
        const serviceName = serviceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return (
          <Card key={serviceId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {serviceName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Input
                    value={serviceConfig?.frequency || 'custom'}
                    disabled
                    className="capitalize"
                  />
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