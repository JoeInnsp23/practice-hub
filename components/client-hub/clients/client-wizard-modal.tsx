"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";

// Import step components
import { BasicInfoStep } from "./wizard/basic-info-step";
import { ServiceSelectionStep } from "./wizard/service-selection-step";
import { ServiceConfigurationStep } from "./wizard/service-configuration-step";
import { PricingConfigurationStep } from "./wizard/pricing-configuration-step";
import { RegistrationDetailsStep } from "./wizard/registration-details-step";
import { DirectorsShareholdersStep } from "./wizard/directors-shareholders-step";
import { ContactInfoStep } from "./wizard/contact-info-step";
import { ReviewStep } from "./wizard/review-step";

interface ClientWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  client?: any;
}

export interface WizardFormData {
  // Basic Info
  clientCode?: string;
  name: string;
  type: string;
  status: string;
  accountManager?: string;
  clientManagerId?: string;

  // Registration Details
  companiesHouseNumber?: string;
  vatNumber?: string;
  vatPeriods?: string;
  utr?: string;
  payeReference?: string;
  payePeriods?: string;
  accountOffice?: string;
  yearEndDate?: string;
  incorporationDate?: string;

  // Directors & Shareholders
  directors?: Array<{
    id: string;
    name: string;
    role: string;
    appointedDate: string;
    resignedDate?: string;
    nationality?: string;
    occupation?: string;
    email?: string;
    phone?: string;
    isPrimaryContact?: boolean;
  }>;
  shareholders?: Array<{
    id: string;
    name: string;
    percentage: number;
    shareClass?: string;
    nationality?: string;
    notifiedDate?: string;
  }>;
  manualContacts?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    jobTitle: string;
    isPrimary: boolean;
  }>;

  // Service Selection
  selectedServices?: Array<{
    serviceId: string;
    status: string;
    frequency?: string;
    fixedFee?: number;
    hourlyRate?: number;
    nextDueDate?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    recurringDayOfMonth?: number;
    taxYear?: string;
    taxYearDueDate?: string;
    isOverdueBacklog?: boolean;
    originalDueDate?: string;
    isRecurring?: boolean;
    instanceType?: string;
    vatPeriod?: string;
  }>;

  // Pricing Configuration
  billingStrategy?: "ad_hoc_hourly" | "fixed_per_service" | "monthly_retainer";
  monthlyRetainer?: number;
  defaultHourlyRate?: number;

  // Contact Info
  primaryContactName?: string;
  primaryContactFirstName?: string;
  primaryContactMiddleName?: string;
  primaryContactLastName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  healthScore?: number;
  notes?: string;

  // Metadata
  metadata?: Record<string, any>;
}

const STEPS = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Client details and account manager",
    icon: "📋",
  },
  {
    id: "services",
    title: "Service Selection",
    description: "Choose services for this client",
    icon: "⚙️",
  },
  {
    id: "service-config",
    title: "Service Configuration",
    description: "Configure periods, dates, and schedules",
    icon: "📅",
  },
  {
    id: "pricing",
    title: "Pricing Configuration",
    description: "Configure pricing for selected services",
    icon: "💷",
  },
  {
    id: "registration",
    title: "Registration Details",
    description: "Tax and company information",
    icon: "🏢",
  },
  {
    id: "directors",
    title: "Directors & Shareholders",
    description: "Director and shareholder information",
    icon: "👥",
  },
  {
    id: "contact",
    title: "Contact & Additional Info",
    description: "Contact details and notes",
    icon: "📞",
  },
  {
    id: "review",
    title: "Review & Confirm",
    description: "Review all information",
    icon: "✅",
  },
];

export function ClientWizardModal({
  isOpen,
  onClose,
  onSave,
  client,
}: ClientWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    name: client?.name || "",
    type: client?.type || "limited_company",
    status: client?.status || "prospect",
    accountManager: client?.accountManager || "",
    clientManagerId: client?.clientManagerId || "",
    clientCode: client?.clientCode || "",
    companiesHouseNumber: client?.companiesHouseNumber || "",
    vatNumber: client?.vatNumber || "",
    utr: client?.utr || "",
    payeReference: client?.payeReference || "",
    selectedServices: [],
    healthScore: client?.healthScore || 50,
    metadata: client?.metadata || {},
  });

  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({
    0: false, // Basic Info - required
    1: true,  // Service Selection - optional
    2: true,  // Service Configuration - optional
    3: true,  // Pricing Configuration - optional
    4: true,  // Registration details - optional
    5: true,  // Directors & shareholders - optional
    6: true,  // Contact info - optional
    7: true,  // Review step
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!(formData.name && formData.type && formData.status && formData.clientManagerId);
      case 1: // Service Selection
        return true; // Optional step
      case 2: // Service Configuration
        return true; // Optional step
      case 3: // Pricing Configuration
        return true; // Optional step
      case 4: // Registration Details
        return true; // Optional step
      case 5: // Directors & Shareholders
        return true; // Optional step
      case 6: // Contact Info
        return true; // Optional step
      case 7: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const isValid = validateCurrentStep();
    setStepValidation((prev) => ({ ...prev, [currentStep]: isValid }));

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Prepare final data for submission
    const finalData = {
      ...formData,
      // Convert "none" values to null for proper database handling
      vatPeriods: formData.vatPeriods === "none" ? null : formData.vatPeriods,
      payePeriods: formData.payePeriods === "none" ? null : formData.payePeriods,
      // Convert metadata to include contact info and other details
      metadata: {
        ...formData.metadata,
        contact: {
          primaryContactName: [
            formData.primaryContactFirstName,
            formData.primaryContactMiddleName,
            formData.primaryContactLastName,
          ].filter(Boolean).join(" ") || formData.primaryContactName,
          primaryContactFirstName: formData.primaryContactFirstName,
          primaryContactMiddleName: formData.primaryContactMiddleName,
          primaryContactLastName: formData.primaryContactLastName,
          primaryContactEmail: formData.primaryContactEmail,
          primaryContactPhone: formData.primaryContactPhone,
        },
        address: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        registration: {
          yearEndDate: formData.yearEndDate,
          incorporationDate: formData.incorporationDate,
        },
        notes: formData.notes,
      },
    };

    // Handle "unassigned" client manager
    if (finalData.clientManagerId === "unassigned") {
      finalData.clientManagerId = undefined;
    }

    onSave(finalData);
    onClose();
    setCurrentStep(0);
  };

  const progressValue = ((currentStep + 1) / STEPS.length) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 1:
        return (
          <ServiceSelectionStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 2:
        return (
          <ServiceConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 3:
        return (
          <PricingConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 4:
        return (
          <RegistrationDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 5:
        return (
          <DirectorsShareholdersStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 6:
        return (
          <ContactInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={{}}
          />
        );
      case 7:
        return (
          <ReviewStep
            formData={formData}
            onEdit={(stepIndex) => setCurrentStep(stepIndex)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <DialogHeader className="space-y-4 pb-6">
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {client ? "Edit Client" : "Create New Client"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {client
                ? "Update client information using the comprehensive wizard below."
                : "Set up a new client with all necessary information and configurations."}
            </DialogDescription>
          </div>

          {/* Enhanced Progress Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {Math.round(progressValue)}% Complete
              </span>
            </div>
            <Progress value={progressValue} className="h-2 bg-slate-200 dark:bg-slate-700" />

            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (index < currentStep || (index === 0 && stepValidation[0])) {
                      setCurrentStep(index);
                    }
                  }}
                  disabled={index > currentStep && !stepValidation[index - 1]}
                  className={`
                    relative flex flex-col items-center p-2 rounded-lg transition-all
                    ${index === currentStep
                      ? "bg-blue-50 dark:bg-blue-950 border-2 border-blue-500"
                      : index < currentStep
                        ? "bg-green-50 dark:bg-green-950 border border-green-500 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900"
                        : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    }
                    ${index > currentStep && !stepValidation[index - 1] ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="flex items-center justify-center w-8 h-8 mb-1">
                    {index < currentStep ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : index === currentStep ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-center leading-tight hidden lg:block font-medium">
                    {step.title}
                  </span>
                  <span className="text-xs lg:hidden">{step.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full border-0 shadow-lg">
            <div className="h-full flex flex-col">
              {/* Step Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{STEPS[currentStep].icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {STEPS[currentStep].title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {STEPS[currentStep].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-4xl mx-auto">
                  {renderCurrentStep()}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Navigation Footer */}
        <div className="flex justify-between items-center pt-6 border-t bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 min-w-[120px]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-4">
            {/* Validation Indicator */}
            {currentStep < STEPS.length - 1 && !validateCurrentStep() && (
              <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Complete required fields</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Cancel
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white flex items-center space-x-2 min-w-[140px]"
              >
                <Check className="h-4 w-4" />
                <span>Complete Setup</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 min-w-[100px]"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
