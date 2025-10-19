"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingIndividualFormProps {
  formData: Record<string, any>;
  aiExtractedFields: Set<string>;
  onFieldChange: (key: string, value: any) => void;
  onVerifyAiField: (key: string) => void;
}

export function OnboardingIndividualForm({
  formData,
  aiExtractedFields,
  onFieldChange,
  onVerifyAiField,
}: OnboardingIndividualFormProps) {
  const isAiExtracted = (key: string) => aiExtractedFields.has(key);

  const renderField = (
    key: string,
    label: string,
    type: string = "text",
    placeholder?: string,
    required?: boolean,
  ) => {
    const aiField = isAiExtracted(key);

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {label}
          {required && <span className="text-destructive">*</span>}
          {aiField && (
            <Sparkles
              className="h-3 w-3 text-yellow-500"
              aria-label="AI-extracted"
            />
          )}
        </Label>

        <div className="flex gap-2">
          <Input
            id={key}
            type={type}
            value={formData[key] || ""}
            onChange={(e) => onFieldChange(key, e.target.value)}
            placeholder={placeholder}
            className={
              aiField
                ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20"
                : ""
            }
          />

          {aiField && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerifyAiField(key)}
              className="flex-shrink-0"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Verify
            </Button>
          )}
        </div>

        {aiField && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-filled from your documents - please verify
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Personal Information</h3>

        {renderField("contact_first_name", "First Name", "text", "John", true)}
        {renderField("contact_last_name", "Last Name", "text", "Smith", true)}
        {renderField(
          "contact_date_of_birth",
          "Date of Birth",
          "date",
          undefined,
          true,
        )}
        {renderField(
          "contact_nationality",
          "Nationality",
          "text",
          "British",
          true,
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-lg">Residential Address</h3>

        {renderField(
          "contact_address.line1",
          "Address Line 1",
          "text",
          "123 Main Street",
          true,
        )}
        {renderField(
          "contact_address.line2",
          "Address Line 2",
          "text",
          "Flat 4B",
        )}
        {renderField("contact_address.city", "City", "text", "London", true)}
        {renderField(
          "contact_address.postalCode",
          "Postcode",
          "text",
          "SW1A 1AA",
          true,
        )}
        {renderField(
          "contact_address.country",
          "Country",
          "text",
          "United Kingdom",
          true,
        )}
      </div>

      {aiExtractedFields.size > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>
              {aiExtractedFields.size} field
              {aiExtractedFields.size > 1 ? "s" : ""} were auto-filled from your
              documents. Please verify the information is correct.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
