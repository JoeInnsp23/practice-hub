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
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progressValue} className="mb-4" />

          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                        ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
                        : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      h-0.5 w-8 mx-1
                      ${index < currentStep ? 'bg-primary' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{STEPS[currentStep].title}</h3>
            <p className="text-sm text-gray-600">{STEPS[currentStep].description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save Client
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!validateCurrentStep()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}