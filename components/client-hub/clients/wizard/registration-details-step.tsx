"use client";

import { Building2, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardFormData } from "../client-wizard-modal";

interface RegistrationDetailsStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors?: Record<string, string>;
}

export function RegistrationDetailsStep({
  formData,
  updateFormData,
}: RegistrationDetailsStepProps) {
  return (
    <div className="space-y-8">
      {/* Company Registration Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h4 className="text-base font-medium text-slate-900 dark:text-slate-100">
            Company Registration
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companiesHouseNumber">Companies House Number</Label>
            <Input
              id="companiesHouseNumber"
              name="companiesHouseNumber"
              autoComplete="off"
              value={formData.companiesHouseNumber || ""}
              onChange={(e) =>
                updateFormData({ companiesHouseNumber: e.target.value })
              }
              placeholder="12345678"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incorporationDate">Incorporation Date</Label>
            <Input
              id="incorporationDate"
              name="incorporationDate"
              type="date"
              autoComplete="off"
              value={formData.incorporationDate || ""}
              onChange={(e) =>
                updateFormData({ incorporationDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearEndDate">Year End Date</Label>
            <Input
              id="yearEndDate"
              name="yearEndDate"
              type="date"
              autoComplete="off"
              value={formData.yearEndDate || ""}
              onChange={(e) => updateFormData({ yearEndDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tax Registration Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h4 className="text-base font-medium text-slate-900 dark:text-slate-100">
            Tax Registration
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT Number</Label>
            <Input
              id="vatNumber"
              name="vatNumber"
              autoComplete="off"
              value={formData.vatNumber || ""}
              onChange={(e) => updateFormData({ vatNumber: e.target.value })}
              placeholder="GB 123 4567 89"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatPeriods">VAT Return Periods</Label>
            <Select
              value={formData.vatPeriods || ""}
              onValueChange={(value) => updateFormData({ vatPeriods: value })}
            >
              <SelectTrigger id="vatPeriods" name="vatPeriods">
                <SelectValue placeholder="Select VAT period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="none">Not VAT Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utr">UTR (Unique Tax Reference)</Label>
            <Input
              id="utr"
              name="utr"
              autoComplete="off"
              value={formData.utr || ""}
              onChange={(e) => updateFormData({ utr: e.target.value })}
              placeholder="1234567890"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payeReference">PAYE Reference</Label>
            <Input
              id="payeReference"
              name="payeReference"
              autoComplete="off"
              value={formData.payeReference || ""}
              onChange={(e) =>
                updateFormData({ payeReference: e.target.value })
              }
              placeholder="123/A456"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payePeriods">PAYE Periods</Label>
            <Select
              value={formData.payePeriods || ""}
              onValueChange={(value) => updateFormData({ payePeriods: value })}
            >
              <SelectTrigger id="payePeriods" name="payePeriods">
                <SelectValue placeholder="Select PAYE period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="none">No PAYE Scheme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountOffice">HMRC Account Office</Label>
            <Input
              id="accountOffice"
              name="accountOffice"
              autoComplete="off"
              value={formData.accountOffice || ""}
              onChange={(e) =>
                updateFormData({ accountOffice: e.target.value })
              }
              placeholder="e.g., Corporation Tax Office"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-1 text-slate-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Registration Information
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              These details help track compliance deadlines and filing
              requirements. You can update them later as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
