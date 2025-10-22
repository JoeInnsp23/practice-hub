"use client";

import { Building2, Calendar, FileText, Search } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { VATValidationIndicator } from "@/components/client-hub/vat-validation-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import type { WizardFormData } from "../client-wizard-modal";

interface RegistrationDetailsStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors?: Record<string, string>;
}

export function RegistrationDetailsStep({
  formData,
  updateFormData,
}: RegistrationDetailsStepProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Companies House lookup mutation
  const lookupMutation = trpc.clients.lookupCompaniesHouse.useQuery(
    { companyNumber: formData.companiesHouseNumber || "" },
    {
      enabled: false, // Manual trigger only
    },
  );

  const handleCompaniesHouseLookup = async () => {
    const companyNumber = formData.companiesHouseNumber?.trim();

    // Validation
    if (!companyNumber) {
      toast.error("Please enter a Companies House number");
      return;
    }

    if (!/^[0-9]{8}$/.test(companyNumber)) {
      toast.error("Companies House number must be 8 digits");
      return;
    }

    setIsLookingUp(true);

    try {
      const result = await lookupMutation.refetch();

      if (result.data) {
        const { company, officers, pscs } = result.data;

        // Populate form with company data
        updateFormData({
          name: company.companyName,
          companiesHouseNumber: company.companyNumber,
          incorporationDate: company.dateOfCreation,
          type: mapCompanyType(company.type),
          status: company.status === "active" ? "active" : "inactive",
        });

        // Map directors from officers
        const directors = officers
          .filter((officer) => officer.role.toLowerCase().includes("director"))
          .map((officer) => ({
            id: crypto.randomUUID(),
            name: officer.name,
            role: officer.role,
            appointedDate: officer.appointedOn,
            resignedDate: officer.resignedOn,
            nationality: undefined,
            occupation: undefined,
            email: undefined,
            phone: undefined,
            isPrimaryContact: false,
          }));

        // Map shareholders from PSCs
        const shareholders = pscs.map((psc) => ({
          id: crypto.randomUUID(),
          name: psc.name,
          percentage: 0, // Not available from Companies House API
          shareClass: undefined,
          nationality: undefined,
          notifiedDate: psc.notifiedOn,
        }));

        updateFormData({
          directors: directors.length > 0 ? directors : formData.directors,
          shareholders:
            shareholders.length > 0 ? shareholders : formData.shareholders,
        });

        toast.success("Company information loaded successfully");
      }
    } catch (error: unknown) {
      // Error handling with user-friendly messages (AC #22)
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = String(error.message);

        if (errorMessage.includes("not found")) {
          toast.error(
            "Company not found. Please check the company number and try again.",
          );
        } else if (errorMessage.includes("Too many requests")) {
          toast.error("Too many requests. Please try again in 5 minutes.");
        } else if (errorMessage.includes("Unable to connect")) {
          toast.error(
            "Unable to connect to Companies House. Please check your internet connection and try again.",
          );
        } else if (errorMessage.includes("configuration error")) {
          toast.error(
            "Companies House API configuration error. Contact support.",
          );
        } else {
          toast.error("Failed to lookup company. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  // Helper function to map Companies House company type to Practice Hub enum
  const mapCompanyType = (
    chType: string,
  ): WizardFormData["type"] | undefined => {
    const typeMap: Record<string, WizardFormData["type"]> = {
      ltd: "limited_company",
      plc: "limited_company",
      "private-limited-guarant-nsc-limited-exemption":
        "limited_company" as const,
      "private-limited-guarant-nsc": "limited_company" as const,
      llp: "llp",
      partnership: "partnership",
      "limited-partnership": "partnership",
      "scottish-partnership": "partnership",
      "charitable-incorporated-organisation": "charity",
      "industrial-and-provident-society": "charity",
    };

    return typeMap[chType.toLowerCase()] || "other";
  };

  // Feature flag check
  const companiesHouseEnabled =
    process.env.NEXT_PUBLIC_FEATURE_COMPANIES_HOUSE === "true";

  return (
    <div className="space-y-8">
      {/* Company Registration Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h4 className="text-base font-medium text-slate-900 dark:text-slate-100">
            Company Registration
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companiesHouseNumber">Companies House Number</Label>
            <div className="flex gap-2">
              <Input
                id="companiesHouseNumber"
                name="companiesHouseNumber"
                autoComplete="off"
                value={formData.companiesHouseNumber || ""}
                onChange={(e) =>
                  updateFormData({ companiesHouseNumber: e.target.value })
                }
                placeholder="12345678"
                className="font-mono flex-1"
              />
              {companiesHouseEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleCompaniesHouseLookup}
                  disabled={
                    isLookingUp || !formData.companiesHouseNumber?.trim()
                  }
                  className="shrink-0"
                >
                  {isLookingUp ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lookup
                    </>
                  )}
                </Button>
              )}
            </div>
            {companiesHouseEnabled && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter 8-digit company number and click Lookup to auto-fill
                details
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="incorporationDate">Incorporation Date</Label>
            <Input
              id="incorporationDate"
              name="incorporationDate"
              type="date"
              autoComplete="off"
              value={formData.incorporationDate || ""}
              onChange={(e) =>
                updateFormData({ incorporationDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearEndDate">Year End Date</Label>
            <Input
              id="yearEndDate"
              name="yearEndDate"
              type="date"
              autoComplete="off"
              value={formData.yearEndDate || ""}
              onChange={(e) => updateFormData({ yearEndDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tax Registration Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h4 className="text-base font-medium text-slate-900 dark:text-slate-100">
            Tax Registration
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="vatNumber">VAT Number</Label>
            <Input
              id="vatNumber"
              name="vatNumber"
              autoComplete="off"
              value={formData.vatNumber || ""}
              onChange={(e) => updateFormData({ vatNumber: e.target.value })}
              placeholder="GB 123 4567 89"
              className="font-mono"
            />
            {formData.vatNumber && formData.vatNumber.length >= 9 && (
              <VATValidationIndicator
                vatNumber={formData.vatNumber}
                onValidationComplete={(result) => {
                  if (result.isValid && result.businessName) {
                    // Optionally update company name if VAT validation returns business name
                    toast.success(`VAT validated: ${result.businessName}`);
                  }
                }}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatPeriods">VAT Return Periods</Label>
            <Select
              value={formData.vatPeriods || ""}
              onValueChange={(value) => updateFormData({ vatPeriods: value })}
            >
              <SelectTrigger id="vatPeriods" name="vatPeriods">
                <SelectValue placeholder="Select VAT period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="none">Not VAT Registered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utr">UTR (Unique Tax Reference)</Label>
            <Input
              id="utr"
              name="utr"
              autoComplete="off"
              value={formData.utr || ""}
              onChange={(e) => updateFormData({ utr: e.target.value })}
              placeholder="1234567890"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payeReference">PAYE Reference</Label>
            <Input
              id="payeReference"
              name="payeReference"
              autoComplete="off"
              value={formData.payeReference || ""}
              onChange={(e) =>
                updateFormData({ payeReference: e.target.value })
              }
              placeholder="123/A456"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payePeriods">PAYE Periods</Label>
            <Select
              value={formData.payePeriods || ""}
              onValueChange={(value) => updateFormData({ payePeriods: value })}
            >
              <SelectTrigger id="payePeriods" name="payePeriods">
                <SelectValue placeholder="Select PAYE period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="none">No PAYE Scheme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountOffice">HMRC Account Office</Label>
            <Input
              id="accountOffice"
              name="accountOffice"
              autoComplete="off"
              value={formData.accountOffice || ""}
              onChange={(e) =>
                updateFormData({ accountOffice: e.target.value })
              }
              placeholder="e.g., Corporation Tax Office"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-1 text-slate-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Registration Information
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              These details help track compliance deadlines and filing
              requirements. You can update them later as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
