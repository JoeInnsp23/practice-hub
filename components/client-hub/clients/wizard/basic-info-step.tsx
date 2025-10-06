"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import type { WizardFormData } from "../client-wizard-modal";

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors?: Record<string, string>;
}

// Generate client code based on name and type
const generateClientCode = (name: string, type: string): string => {
  if (!name || !type) return "";

  const prefixMap: Record<string, string> = {
    individual: "IND",
    company: "CO",
    limited_company: "LTD",
    sole_trader: "ST",
    partnership: "PART",
    llp: "LLP",
    trust: "TR",
    charity: "CH",
    other: "OTH",
  };

  const prefix = prefixMap[type] || "CO";

  const namePart = name
    .substring(0, 4)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const timestamp = Date.now().toString().slice(-4);

  return `${prefix}-${namePart}${timestamp}`;
};

export function BasicInfoStep({
  formData,
  updateFormData,
}: BasicInfoStepProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [_showCompanySearch, _setShowCompanySearch] = useState(false);

  // Auto-generate client code when name or type changes
  useEffect(() => {
    if (formData.name && formData.type && !formData.clientCode) {
      const timer = setTimeout(() => {
        const newCode = generateClientCode(formData.name, formData.type);
        updateFormData({ clientCode: newCode });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.name, formData.type, formData.clientCode, updateFormData]);

  const handleRegenerateCode = () => {
    setIsGeneratingCode(true);
    setTimeout(() => {
      const newCode = generateClientCode(formData.name, formData.type);
      updateFormData({ clientCode: newCode });
      setIsGeneratingCode(false);
    }, 300);
  };

  return (
    <div className="space-y-8">
      {/* Company Search Section */}
      {formData.type === "limited_company" && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-base font-medium text-blue-900 dark:text-blue-100">
              Companies House Lookup (Optional)
            </h4>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="companySearch"
                name="companySearch"
                autoComplete="off"
                placeholder="Search by company name or registration number..."
                className="flex-1"
              />
              <Button
                variant="outline"
                className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Search Companies House to automatically populate company
              registration details
            </p>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 pb-4 border-b">
          Client Information
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Client Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="clientName"
              autoComplete="organization"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Enter client or company name"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientCode">
              Client Code
              {formData.clientCode && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400 inline-flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-generated
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id="clientCode"
                name="clientCode"
                autoComplete="off"
                value={formData.clientCode || ""}
                onChange={(e) => updateFormData({ clientCode: e.target.value })}
                placeholder="Auto-generated"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRegenerateCode}
                disabled={isGeneratingCode || !formData.name || !formData.type}
                title="Regenerate code"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isGeneratingCode ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="clientType">
              Client Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                updateFormData({ type: value as WizardFormData["type"] })
              }
            >
              <SelectTrigger
                id="clientType"
                name="clientType"
                className="text-base"
              >
                <SelectValue placeholder="Select client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="limited_company">Limited Company</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="sole_trader">Sole Trader</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="llp">
                  Limited Liability Partnership (LLP)
                </SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="charity">Charity</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientStatus">
              Client Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                updateFormData({ status: value as WizardFormData["status"] })
              }
            >
              <SelectTrigger
                id="clientStatus"
                name="clientStatus"
                className="text-base"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="accountManager">
              Account Manager <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.clientManagerId || ""}
              onValueChange={(value) =>
                updateFormData({
                  clientManagerId: value,
                  accountManager: value,
                })
              }
            >
              <SelectTrigger
                id="accountManager"
                name="accountManager"
                className="text-base"
              >
                <SelectValue placeholder="Select an account manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="john_smith">John Smith</SelectItem>
                <SelectItem value="jane_wilson">Jane Wilson</SelectItem>
                <SelectItem value="bob_johnson">Bob Johnson</SelectItem>
                <SelectItem value="alice_brown">Alice Brown</SelectItem>
              </SelectContent>
            </Select>
            {!formData.clientManagerId && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                Please select an account manager to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
