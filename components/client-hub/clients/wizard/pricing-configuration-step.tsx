"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { WizardFormData } from "../client-wizard-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface PricingConfigurationStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function PricingConfigurationStep({ formData, updateFormData }: PricingConfigurationStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Strategy
          </CardTitle>
          <CardDescription>
            Choose how this client will be billed for services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.billingStrategy || 'fixed'}
            onValueChange={(value: any) => updateFormData({ billingStrategy: value })}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="fixed" id="fixed" />
                <div className="grid gap-1">
                  <Label htmlFor="fixed" className="font-medium">
                    Fixed Fee per Service
                  </Label>
                  <p className="text-sm text-slate-700">
                    Each service has a predetermined fixed price
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="hourly" id="hourly" />
                <div className="grid gap-1">
                  <Label htmlFor="hourly" className="font-medium">
                    Hourly Rate
                  </Label>
                  <p className="text-sm text-slate-700">
                    Bill based on time spent on each service
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="retainer" id="retainer" />
                <div className="grid gap-1">
                  <Label htmlFor="retainer" className="font-medium">
                    Monthly Retainer
                  </Label>
                  <p className="text-sm text-slate-700">
                    Fixed monthly fee covering all services
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {formData.billingStrategy === 'hourly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hourly Rate Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Default Hourly Rate (£)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.defaultHourlyRate || ''}
                onChange={(e) => updateFormData({ defaultHourlyRate: parseFloat(e.target.value) })}
                placeholder="150.00"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {formData.billingStrategy === 'retainer' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Retainer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="retainer">Monthly Retainer Amount (£)</Label>
              <Input
                id="retainer"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyRetainer || ''}
                onChange={(e) => updateFormData({ monthlyRetainer: parseFloat(e.target.value) })}
                placeholder="1500.00"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}