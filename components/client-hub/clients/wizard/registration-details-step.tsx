"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardFormData } from "../client-wizard-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText } from "lucide-react";

interface RegistrationDetailsStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

export function RegistrationDetailsStep({ formData, updateFormData }: RegistrationDetailsStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Registration
          </CardTitle>
          <CardDescription>
            Company and tax registration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companiesHouseNumber">Companies House Number</Label>
              <Input
                id="companiesHouseNumber"
                value={formData.companiesHouseNumber || ''}
                onChange={(e) => updateFormData({ companiesHouseNumber: e.target.value })}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incorporationDate">Incorporation Date</Label>
              <Input
                id="incorporationDate"
                type="date"
                value={formData.incorporationDate || ''}
                onChange={(e) => updateFormData({ incorporationDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearEndDate">Year End Date</Label>
              <Input
                id="yearEndDate"
                type="date"
                value={formData.yearEndDate || ''}
                onChange={(e) => updateFormData({ yearEndDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber || ''}
                onChange={(e) => updateFormData({ vatNumber: e.target.value })}
                placeholder="GB 123 4567 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatPeriods">VAT Periods</Label>
              <Input
                id="vatPeriods"
                value={formData.vatPeriods || ''}
                onChange={(e) => updateFormData({ vatPeriods: e.target.value })}
                placeholder="Quarterly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utr">UTR (Unique Tax Reference)</Label>
              <Input
                id="utr"
                value={formData.utr || ''}
                onChange={(e) => updateFormData({ utr: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payeReference">PAYE Reference</Label>
              <Input
                id="payeReference"
                value={formData.payeReference || ''}
                onChange={(e) => updateFormData({ payeReference: e.target.value })}
                placeholder="123/A456"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}