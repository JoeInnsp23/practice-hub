"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WizardFormData } from "../client-wizard-modal";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  Calculator,
  Briefcase,
  Building2,
  Users,
} from "lucide-react";

interface ServiceSelectionStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors?: Record<string, string>;
}

const AVAILABLE_SERVICES = [
  {
    id: "bookkeeping",
    name: "Bookkeeping",
    description: "Monthly bookkeeping and bank reconciliation",
    category: "Accounting",
    icon: Calculator,
    popular: true,
  },
  {
    id: "vat_returns",
    name: "VAT Returns",
    description: "Quarterly VAT return preparation and submission",
    category: "Tax Services",
    icon: FileText,
    popular: true,
  },
  {
    id: "annual_accounts",
    name: "Annual Accounts",
    description: "Preparation of statutory accounts",
    category: "Accounting",
    icon: Building2,
    popular: true,
  },
  {
    id: "corporation_tax",
    name: "Corporation Tax",
    description: "CT600 preparation and submission",
    category: "Tax Services",
    icon: DollarSign,
  },
  {
    id: "self_assessment",
    name: "Self Assessment",
    description: "Personal tax return preparation",
    category: "Tax Services",
    icon: Users,
  },
  {
    id: "payroll",
    name: "Payroll Processing",
    description: "Monthly payroll and RTI submissions",
    category: "Payroll",
    icon: Briefcase,
  },
  {
    id: "company_secretarial",
    name: "Company Secretarial",
    description: "Confirmation statements and statutory filings",
    category: "Company Admin",
    icon: Building2,
  },
  {
    id: "management_accounts",
    name: "Management Accounts",
    description: "Monthly management reporting",
    category: "Accounting",
    icon: FileText,
  },
];

export function ServiceSelectionStep({
  formData,
  updateFormData,
}: ServiceSelectionStepProps) {
  const selectedServices = formData.selectedServices?.map(s =>
    typeof s === 'string' ? s : s.serviceId
  ) || [];

  const toggleService = (serviceId: string) => {
    const currentIds = selectedServices;
    const isSelected = currentIds.includes(serviceId);

    let updatedServices;
    if (isSelected) {
      // Remove the service
      updatedServices = formData.selectedServices?.filter(s =>
        (typeof s === 'string' ? s : s.serviceId) !== serviceId
      ) || [];
    } else {
      // Add the service with default configuration
      const newService = {
        serviceId,
        status: 'active',
        frequency: 'monthly',
      };
      updatedServices = [...(formData.selectedServices || []), newService];
    }
    updateFormData({ selectedServices: updatedServices });
  };

  const categories = Array.from(
    new Set(AVAILABLE_SERVICES.map((s) => s.category)),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Select the services this client will need. You can configure specific
          details in the next step.
        </p>
      </div>

      {categories.map((category) => {
        const categoryServices = AVAILABLE_SERVICES.filter(
          (s) => s.category === category,
        );

        return (
          <div key={category} className="space-y-4">
            <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 pb-2 border-b">
              {category}
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {categoryServices.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);

                  return (
                    <div
                      key={service.id}
                      className={`
                        flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-600 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                        }
                      `}
                      onClick={() => toggleService(service.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleService(service.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="cursor-pointer">
                            {service.name}
                          </Label>
                          {service.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        );
      })}

      {selectedServices.length > 0 && (
        <div className="bg-primary/5 dark:bg-primary/10/20 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedServices.length} service
            {selectedServices.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  );
}
