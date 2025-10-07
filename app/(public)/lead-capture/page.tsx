"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1: Company Details
  companyName: string;
  businessType: string;
  industry: string;
  turnover: string;
  employees: string;

  // Step 2: Contact Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;

  // Step 3: Services
  services: string[];
  addOns: string[];
  notes: string;
}

const CORE_SERVICES = [
  "Accounts",
  "VAT Returns",
  "Bookkeeping",
  "Payroll",
  "Self-Assessment",
  "Machine Games Duty",
  "Management Accounts",
];

const ADD_ON_SERVICES = [
  "Modulr - Monthly",
  "Modulr - Weekly",
  "Modulr - Bi Weekly",
  "+1 Director SATR",
  "+1 Rental Property",
];

const INDUSTRIES = [
  { value: "hospitality", label: "Hospitality (Pubs, Hotels, Restaurants)" },
  { value: "retail", label: "Retail" },
  { value: "professional_services", label: "Professional Services" },
  { value: "construction", label: "Construction" },
  { value: "technology", label: "Technology" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "healthcare", label: "Healthcare" },
  { value: "other", label: "Other" },
];

export default function LeadCapturePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    businessType: "",
    industry: "",
    turnover: "",
    employees: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    services: [],
    addOns: [],
    notes: "",
  });

  const { mutate: createLead, isPending: isSubmitting } =
    trpc.leads.createPublic.useMutation({
      onSuccess: () => {
        router.push("/lead-capture/thank-you");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to submit. Please try again.");
      },
    });

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string, isAddOn: boolean = false) => {
    const field = isAddOn ? "addOns" : "services";
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(service)
        ? prev[field].filter((s) => s !== service)
        : [...prev[field], service],
    }));
  };

  const validateStep = (step: Step): boolean => {
    if (step === 1) {
      if (!formData.companyName.trim()) {
        toast.error("Company name is required");
        return false;
      }
      if (!formData.businessType) {
        toast.error("Please select a business type");
        return false;
      }
      if (!formData.industry) {
        toast.error("Please select an industry");
        return false;
      }
      if (!formData.turnover.trim()) {
        toast.error("Please enter estimated turnover");
        return false;
      }
      if (!formData.employees.trim()) {
        toast.error("Please enter number of employees");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.firstName.trim()) {
        toast.error("First name is required");
        return false;
      }
      if (!formData.lastName.trim()) {
        toast.error("Last name is required");
        return false;
      }
      if (!formData.email.trim()) {
        toast.error("Email is required");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.services.length === 0) {
        toast.error("Please select at least one service");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    createLead({
      companyName: formData.companyName,
      businessType: formData.businessType,
      industry: formData.industry,
      estimatedTurnover: parseFloat(formData.turnover) || 0,
      estimatedEmployees: parseInt(formData.employees, 10) || 0,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      position: formData.position || undefined,
      interestedServices: [...formData.services, ...formData.addOns],
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Get Your Quote</h1>
          <p className="text-muted-foreground">
            Tell us about your business and we'll prepare a custom proposal
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step <= currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      step < currentStep
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm text-muted-foreground">
            Step {currentStep} of 3
          </div>
        </div>

        {/* Form Steps */}
        <Card className="glass-card p-8">
          {/* Step 1: Company Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold">Company Details</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us about your business
                </p>
              </div>

              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Acme Ltd"
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => updateField("businessType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltd">Ltd Company</SelectItem>
                    <SelectItem value="sole_trader">Sole Trader</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => updateField("industry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="turnover">
                  Estimated Annual Turnover (£) *
                </Label>
                <Input
                  id="turnover"
                  type="number"
                  value={formData.turnover}
                  onChange={(e) => updateField("turnover", e.target.value)}
                  placeholder="250000"
                />
              </div>

              <div>
                <Label htmlFor="employees">Number of Employees *</Label>
                <Input
                  id="employees"
                  type="number"
                  value={formData.employees}
                  onChange={(e) => updateField("employees", e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold">Contact Information</h2>
                <p className="text-sm text-muted-foreground">
                  How can we reach you?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="John"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@acmeltd.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="01234 567890"
                />
              </div>

              <div>
                <Label htmlFor="position">Your Position/Role</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => updateField("position", e.target.value)}
                  placeholder="Managing Director"
                />
              </div>
            </div>
          )}

          {/* Step 3: Services Required */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold">Services Required</h2>
                <p className="text-sm text-muted-foreground">
                  Select the services you need
                </p>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Core Services *
                </Label>
                <div className="space-y-3">
                  {CORE_SERVICES.map((service) => (
                    <div key={service} className="flex items-center gap-3">
                      <Checkbox
                        id={service}
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <label
                        htmlFor={service}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Add-On Services
                </Label>
                <div className="space-y-3">
                  {ADD_ON_SERVICES.map((service) => (
                    <div key={service} className="flex items-center gap-3">
                      <Checkbox
                        id={service}
                        checked={formData.addOns.includes(service)}
                        onCheckedChange={() => toggleService(service, true)}
                      />
                      <label
                        htmlFor={service}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Tell us anything else we should know..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
