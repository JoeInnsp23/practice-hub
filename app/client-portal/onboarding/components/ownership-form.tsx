"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OnboardingOwnershipFormProps {
  formData: Record<string, unknown>;
  aiExtractedFields: Set<string>;
  onFieldChange: (key: string, value: unknown) => void;
  onVerifyAiField: (key: string) => void;
}

export function OnboardingOwnershipForm({
  formData,
  onFieldChange,
}: OnboardingOwnershipFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Beneficial Ownership</h3>
        <p className="text-sm text-muted-foreground">
          Information about individuals who own or control your company (25% or
          more ownership)
        </p>

        <div className="space-y-2">
          <Label htmlFor="psc_register">
            Persons with Significant Control (PSC)
          </Label>
          <Textarea
            id="psc_register"
            value={
              formData.psc_register
                ? JSON.stringify(formData.psc_register, null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                onFieldChange("psc_register", JSON.parse(e.target.value));
              } catch {
                onFieldChange("psc_register", e.target.value);
              }
            }}
            placeholder="PSC information (extracted from Companies House if available)"
            rows={6}
            readOnly={!!formData.psc_register}
            className={formData.psc_register ? "bg-muted/50" : ""}
          />
          <p className="text-xs text-muted-foreground">
            This information is typically extracted from Companies House filings
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="beneficial_owners">
            Additional Beneficial Owners
          </Label>
          <Textarea
            id="beneficial_owners"
            value={String(formData.beneficial_owners || "")}
            onChange={(e) => onFieldChange("beneficial_owners", e.target.value)}
            placeholder="List any other beneficial owners not in the PSC register..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
