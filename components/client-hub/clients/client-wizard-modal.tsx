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
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

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

  // Registration Details
  companiesHouseNumber?: string;
  vatNumber?: string;
  vatPeriods?: string;
  utr?: string;
  payeReference?: string;
  payePeriods?: string;
  yearEndDate?: string;
  incorporationDate?: string;

  // Directors & Shareholders
  directors?: Array<{
    id: string;
    name: string;
    role: string;
    appointedDate: string;
    email?: string;
    phone?: string;
  }>;
  shareholders?: Array<{
    id: string;
    name: string;
    percentage: number;
    shareClass?: string;
  }>;

  // Service Selection
  selectedServices?: string[];

  // Pricing Configuration
  billingStrategy?: 'fixed' | 'hourly' | 'retainer';
  monthlyRetainer?: number;
  defaultHourlyRate?: number;

  // Contact Info
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', description: 'Client details and manager' },
  { id: 'services', title: 'Service Selection', description: 'Choose services for this client' },
  { id: 'service-config', title: 'Service Configuration', description: 'Configure periods and dates' },
  { id: 'pricing', title: 'Pricing Configuration', description: 'Configure pricing' },
  { id: 'registration', title: 'Registration Details', description: 'Tax and company information' },
  { id: 'directors', title: 'Directors & Shareholders', description: 'Company officers' },
  { id: 'contact', title: 'Contact Information', description: 'Contact details and address' },
  { id: 'review', title: 'Review & Confirm', description: 'Review all information' },
];

export function ClientWizardModal({
  isOpen,
  onClose,
  onSave,
  client,
}: ClientWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    name: client?.name || '',
    type: client?.type || 'company',
    status: client?.status || 'prospect',
    accountManager: client?.accountManager || '',
    clientCode: client?.clientCode || '',
  });

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!(formData.name && formData.type && formData.status);
      default:
        return true; // Other steps are optional
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (validateCurrentStep()) {
      onSave(formData);
      onClose();
      setCurrentStep(0);
    }
  };

  const progressValue = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <ServiceSelectionStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <ServiceConfigurationStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <PricingConfigurationStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <RegistrationDetailsStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <DirectorsShareholdersStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <ContactInfoStep formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {client ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {client
              ? 'Update client information using the step-by-step wizard below.'
              : 'Create a new client using the step-by-step wizard below.'}
          </DialogDescription>

          {/* Progress Bar */}
          <div className="space-y-3 pt-4">
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-1 ${
                    index === currentStep
                      ? 'text-primary font-medium'
                      : index < currentStep
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                      ${index === currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-current'
                      }
                    `}>
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">
              {STEPS[currentStep].title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep].description}
            </p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSave}
                className="flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Save Client</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                className="flex items-center space-x-2"
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