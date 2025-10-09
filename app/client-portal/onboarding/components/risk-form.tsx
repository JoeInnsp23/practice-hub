"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OnboardingRiskFormProps {
  formData: Record<string, any>;
  aiExtractedFields: Set<string>;
  onFieldChange: (key: string, value: any) => void;
  onVerifyAiField: (key: string) => void;
}

export function OnboardingRiskForm({
  formData,
  onFieldChange,
}: OnboardingRiskFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Compliance & Risk Assessment</h3>
        <p className="text-sm text-muted-foreground">
          Required for UK Anti-Money Laundering (AML) compliance
        </p>

        {/* High Risk Jurisdictions */}
        <div className="space-y-3">
          <Label>
            Does your business operate in or have connections to high-risk jurisdictions?
          </Label>
          <RadioGroup
            value={formData.high_risk_jurisdictions || ""}
            onValueChange={(value) => onFieldChange("high_risk_jurisdictions", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="high-risk-no" />
              <Label htmlFor="high-risk-no" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="high-risk-yes" />
              <Label htmlFor="high-risk-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
          </RadioGroup>

          {formData.high_risk_jurisdictions === "yes" && (
            <Textarea
              id="high_risk_jurisdictions_details"
              value={formData.high_risk_jurisdictions_details || ""}
              onChange={(e) => onFieldChange("high_risk_jurisdictions_details", e.target.value)}
              placeholder="Please provide details..."
              rows={3}
            />
          )}
        </div>

        {/* Cash Intensive */}
        <div className="space-y-3">
          <Label>
            Is your business cash-intensive?
          </Label>
          <RadioGroup
            value={formData.cash_intensive_business || ""}
            onValueChange={(value) => onFieldChange("cash_intensive_business", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="cash-no" />
              <Label htmlFor="cash-no" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="cash-yes" />
              <Label htmlFor="cash-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* PEP */}
        <div className="space-y-3">
          <Label>
            Are you or any beneficial owners a Politically Exposed Person (PEP)?
          </Label>
          <RadioGroup
            value={formData.politically_exposed_person || ""}
            onValueChange={(value) => onFieldChange("politically_exposed_person", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="pep-no" />
              <Label htmlFor="pep-no" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="pep-yes" />
              <Label htmlFor="pep-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
          </RadioGroup>

          {formData.politically_exposed_person === "yes" && (
            <Textarea
              id="pep_details"
              value={formData.pep_details || ""}
              onChange={(e) => onFieldChange("pep_details", e.target.value)}
              placeholder="Please provide details of the position and when it was held..."
              rows={3}
            />
          )}
        </div>
      </div>
    </div>
  );
}
