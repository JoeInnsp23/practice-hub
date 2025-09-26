"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardFormData } from "../client-wizard-modal";
import { Building2, Search, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface BasicInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
}

// Generate client code based on name and type
const generateClientCode = (name: string, type: string): string => {
  if (!name || !type) return "";

  const prefix = type === "individual" ? "IND" :
                 type === "company" ? "CO" :
                 type === "partnership" ? "PART" :
                 type === "trust" ? "TR" :
                 type === "charity" ? "CH" : "SC";

  const namePart = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const randomNum = Math.floor(Math.random() * 900) + 100;

  return `${prefix}${namePart}${randomNum}`;
};

export function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);

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
    <div className="space-y-6">
      {/* Company Search Card */}
      {formData.type === "company" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search Companies House..."
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Search Companies House to auto-populate company details
            </p>
          </CardContent>
        </Card>
      )}

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientCode">
                Client Code
                {formData.clientCode && (
                  <span className="ml-2 text-xs text-green-600 inline-flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Auto-generated
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="clientCode"
                  value={formData.clientCode || ''}
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
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Enter client name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Client Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateFormData({ type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Limited Company</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="charity">Charity</SelectItem>
                  <SelectItem value="sole_trader">Sole Trader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value })}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="accountManager">Account Manager</Label>
            <Select value={formData.accountManager || ''} onValueChange={(value) => updateFormData({ accountManager: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select account manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="john_smith">John Smith</SelectItem>
                <SelectItem value="jane_wilson">Jane Wilson</SelectItem>
                <SelectItem value="bob_johnson">Bob Johnson</SelectItem>
                <SelectItem value="alice_brown">Alice Brown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}