"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingBusinessFormProps {
  formData: Record<string, any>;
  aiExtractedFields: Set<string>;
  onFieldChange: (key: string, value: any) => void;
  onVerifyAiField: (key: string) => void;
}

export function OnboardingBusinessForm({
  formData,
  onFieldChange,
}: OnboardingBusinessFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Business Activity</h3>

        <div className="space-y-2">
          <Label htmlFor="nature_of_business">
            Nature of Business <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="nature_of_business"
            value={formData.nature_of_business || ""}
            onChange={(e) => onFieldChange("nature_of_business", e.target.value)}
            placeholder="Describe your business activities..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="annual_turnover">
            Annual Turnover <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.annual_turnover || ""}
            onValueChange={(value) => onFieldChange("annual_turnover", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select turnover range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-50k">£0 - £50,000</SelectItem>
              <SelectItem value="50k-250k">£50,000 - £250,000</SelectItem>
              <SelectItem value="250k-1m">£250,000 - £1,000,000</SelectItem>
              <SelectItem value="1m+">£1,000,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_of_funds">
            Primary Source of Funds <span className="text-destructive">*</span>
          </Label>
          <Input
            id="source_of_funds"
            value={formData.source_of_funds || ""}
            onChange={(e) => onFieldChange("source_of_funds", e.target.value)}
            placeholder="e.g., Trading income, Investment, Loans"
          />
        </div>
      </div>
    </div>
  );
}
