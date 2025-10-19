"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingCompanyFormProps {
  formData: Record<string, any>;
  aiExtractedFields: Set<string>;
  onFieldChange: (key: string, value: any) => void;
  onVerifyAiField: (key: string) => void;
}

export function OnboardingCompanyForm({
  formData,
  aiExtractedFields,
  onFieldChange,
  onVerifyAiField,
}: OnboardingCompanyFormProps) {
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
          {aiField && <Sparkles className="h-3 w-3 text-yellow-500" />}
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Company Details</h3>
        {renderField("company_name", "Company Name", "text", "Acme Ltd", true)}
        {renderField(
          "company_number",
          "Registration Number",
          "text",
          "12345678",
          true,
        )}
        {renderField(
          "company_type",
          "Company Type",
          "text",
          "Private Limited Company",
          true,
        )}
        {renderField(
          "company_incorporation_date",
          "Incorporation Date",
          "date",
          undefined,
          true,
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-lg">Registered Address</h3>
        {renderField(
          "company_registered_address.line1",
          "Address Line 1",
          "text",
          "123 Business Street",
          true,
        )}
        {renderField(
          "company_registered_address.line2",
          "Address Line 2",
          "text",
          "Suite 100",
        )}
        {renderField(
          "company_registered_address.city",
          "City",
          "text",
          "London",
          true,
        )}
        {renderField(
          "company_registered_address.postalCode",
          "Postcode",
          "text",
          "EC1A 1BB",
          true,
        )}
        {renderField(
          "company_registered_address.country",
          "Country",
          "text",
          "United Kingdom",
          true,
        )}
      </div>
    </div>
  );
}
