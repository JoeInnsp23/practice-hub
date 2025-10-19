"use client";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingReviewProps {
  formData: Record<string, any>;
  questionnaire?: any;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function OnboardingReview({
  formData,
  questionnaire,
  onSubmit,
  isSubmitting,
}: OnboardingReviewProps) {
  const completionPercentage = questionnaire?.completionPercentage || 0;
  const canSubmit = completionPercentage === 100;

  const sections = [
    {
      title: "Personal Information",
      fields: [
        { key: "contact_first_name", label: "First Name" },
        { key: "contact_last_name", label: "Last Name" },
        { key: "contact_date_of_birth", label: "Date of Birth" },
        { key: "contact_nationality", label: "Nationality" },
      ],
    },
    {
      title: "Company Information",
      fields: [
        { key: "company_name", label: "Company Name" },
        { key: "company_number", label: "Registration Number" },
        { key: "company_type", label: "Company Type" },
      ],
    },
    {
      title: "Business Activity",
      fields: [
        { key: "nature_of_business", label: "Nature of Business" },
        { key: "annual_turnover", label: "Annual Turnover" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium text-lg mb-4">Review Your Information</h3>

        {sections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              {section.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData[field.key] || (
                      <span className="text-red-500">Not provided</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Completion Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {canSubmit ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">
                {canSubmit
                  ? "Questionnaire Complete"
                  : "Questionnaire Incomplete"}
              </p>
              <p className="text-sm text-muted-foreground">
                {completionPercentage}% complete
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Identity Verification Notice */}
      <Card className="p-6 border-2 border-primary">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-lg mb-2">
              Next Step: Identity Verification
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              To complete your onboarding and activate your portal access,
              you'll need to verify your identity through our secure
              verification partner, LEM Verify.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Please Note:</p>
                  <p>
                    You may need to upload your identity documents again on the
                    secure verification platform. This is required for biometric
                    verification and AML compliance checks.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p className="font-medium">The verification process includes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Document verification (passport or driving license)</li>
                <li>Face matching and liveness detection</li>
                <li>AML and PEP screening</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              This process typically takes 2-5 minutes. Results are usually
              available within 24 hours.
            </p>

            <Button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              size="lg"
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit & Continue to Verification
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {!canSubmit && (
              <p className="text-sm text-destructive mt-2">
                Please complete all required fields before submitting
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <div className="text-xs text-muted-foreground text-center">
        <p>
          By submitting, you consent to identity verification and AML screening
          as required by UK Money Laundering Regulations 2017.
        </p>
      </div>
    </div>
  );
}
