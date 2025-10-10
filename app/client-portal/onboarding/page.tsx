"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Upload, FileText, Building2, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import toast from "react-hot-toast";
import { OnboardingDocumentUpload } from "./components/document-upload";
import { OnboardingIndividualForm } from "./components/individual-form";
import { OnboardingCompanyForm } from "./components/company-form";
import { OnboardingBusinessForm } from "./components/business-form";
import { OnboardingOwnershipForm } from "./components/ownership-form";
import { OnboardingRiskForm } from "./components/risk-form";
import { OnboardingReview } from "./components/review";

const STEPS = [
  {
    id: "upload",
    title: "Upload Documents",
    description: "Upload your ID and company documents for verification",
    icon: Upload,
  },
  {
    id: "individual",
    title: "Personal Information",
    description: "Your personal details",
    icon: FileText,
  },
  {
    id: "company",
    title: "Company Information",
    description: "Your company details",
    icon: Building2,
  },
  {
    id: "business",
    title: "Business Activity",
    description: "What your business does",
    icon: FileText,
  },
  {
    id: "ownership",
    title: "Ownership",
    description: "Beneficial owners and control",
    icon: Users,
  },
  {
    id: "risk",
    title: "Compliance",
    description: "Risk assessment questions",
    icon: ShieldCheck,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Check your information and submit",
    icon: CheckCircle2,
  },
];

export default function OnboardingQuestionnairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [aiExtractedFields, setAiExtractedFields] = useState<Set<string>>(new Set());

  // Get onboarding session with pre-filled data
  const { data: sessionData, isLoading } = trpc.onboarding.getQuestionnaireSession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  // Initialize form data from pre-filled questionnaire
  useEffect(() => {
    if (sessionData?.questionnaire) {
      const initialData: Record<string, any> = {};
      const aiFields = new Set<string>();

      for (const [key, field] of Object.entries(sessionData.questionnaire.fields)) {
        if (field.value !== null) {
          initialData[key] = field.value;

          if (field.extractedFromAi && !field.verifiedByUser) {
            aiFields.add(key);
          }
        }
      }

      setFormData(initialData);
      setAiExtractedFields(aiFields);
    }
  }, [sessionData]);

  const updateResponseMutation = trpc.onboarding.updateQuestionnaireResponse.useMutation();
  const verifyResponseMutation = trpc.onboarding.verifyQuestionnaireResponse.useMutation();
  const submitQuestionnaireMutation = trpc.onboarding.submitQuestionnaire.useMutation();

  const handleFieldChange = async (key: string, value: any) => {
    // Update local state
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Remove from AI-extracted if user edited
    if (aiExtractedFields.has(key)) {
      setAiExtractedFields((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }

    // Auto-save to backend
    if (sessionId) {
      try {
        await updateResponseMutation.mutateAsync({
          sessionId,
          questionKey: key,
          value,
        });
      } catch (error) {
        console.error("Failed to save field:", error);
      }
    }
  };

  const handleVerifyAiField = async (key: string) => {
    if (!sessionId) return;

    try {
      await verifyResponseMutation.mutateAsync({
        sessionId,
        questionKey: key,
      });

      // Remove from AI-extracted set
      setAiExtractedFields((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      toast.success("Field verified");
    } catch (error) {
      toast.error("Failed to verify field");
    }
  };

  const handleDocumentsUploaded = (extractedData: Record<string, any>) => {
    // Merge extracted data into form
    setFormData((prev) => ({ ...prev, ...extractedData }));

    // Mark all as AI-extracted
    const newAiFields = new Set(aiExtractedFields);
    for (const key of Object.keys(extractedData)) {
      newAiFields.add(key);
    }
    setAiExtractedFields(newAiFields);

    // Show success message
    toast.success(
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <span>We found {Object.keys(extractedData).length} fields from your documents!</span>
      </div>
    );

    // Move to next step
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) return;

    try {
      const result = await submitQuestionnaireMutation.mutateAsync({
        sessionId,
      });

      // Show appropriate message based on email send status
      if (result.emailSent) {
        toast.success(result.message);
      } else {
        toast.error(result.message, { duration: 5000 });
      }

      // Redirect to pending approval page with clientId
      router.push(`/client-portal/onboarding/pending?clientId=${result.clientId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit questionnaire");
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No onboarding session found. Please check your invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = sessionData?.questionnaire?.completionPercentage || 0;
  const CurrentStepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Getting Started</h1>
          <p className="text-muted-foreground">
            Complete your client information to get started with our services
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap
                  ${isActive ? "bg-primary text-primary-foreground border-primary" : ""}
                  ${isComplete ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900" : ""}
                  ${!isActive && !isComplete ? "bg-card border-border hover:bg-accent" : ""}
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CurrentStepIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                <CardDescription>{STEPS[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 0: Document Upload */}
            {currentStep === 0 && (
              <OnboardingDocumentUpload
                sessionId={sessionId}
                onDocumentsUploaded={handleDocumentsUploaded}
              />
            )}

            {/* Step 1: Individual Information */}
            {currentStep === 1 && (
              <OnboardingIndividualForm
                formData={formData}
                aiExtractedFields={aiExtractedFields}
                onFieldChange={handleFieldChange}
                onVerifyAiField={handleVerifyAiField}
              />
            )}

            {/* Step 2: Company Information */}
            {currentStep === 2 && (
              <OnboardingCompanyForm
                formData={formData}
                aiExtractedFields={aiExtractedFields}
                onFieldChange={handleFieldChange}
                onVerifyAiField={handleVerifyAiField}
              />
            )}

            {/* Step 3: Business Activity */}
            {currentStep === 3 && (
              <OnboardingBusinessForm
                formData={formData}
                aiExtractedFields={aiExtractedFields}
                onFieldChange={handleFieldChange}
                onVerifyAiField={handleVerifyAiField}
              />
            )}

            {/* Step 4: Ownership */}
            {currentStep === 4 && (
              <OnboardingOwnershipForm
                formData={formData}
                aiExtractedFields={aiExtractedFields}
                onFieldChange={handleFieldChange}
                onVerifyAiField={handleVerifyAiField}
              />
            )}

            {/* Step 5: Risk Assessment */}
            {currentStep === 5 && (
              <OnboardingRiskForm
                formData={formData}
                aiExtractedFields={aiExtractedFields}
                onFieldChange={handleFieldChange}
                onVerifyAiField={handleVerifyAiField}
              />
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 6 && (
              <OnboardingReview
                formData={formData}
                questionnaire={sessionData?.questionnaire}
                onSubmit={handleSubmit}
                isSubmitting={submitQuestionnaireMutation.isPending}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitQuestionnaireMutation.isPending || completionPercentage < 100}
                >
                  {submitQuestionnaireMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Help Indicator */}
        {aiExtractedFields.size > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-medium">
                We found {aiExtractedFields.size} field{aiExtractedFields.size > 1 ? "s" : ""} from your documents.
                Please review and verify them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
