"use client";

import { FileText, MapPin, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WizardFormData } from "../client-wizard-modal";

interface ContactInfoStepProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors?: Record<string, string>;
}

export function ContactInfoStep({
  formData,
  updateFormData,
}: ContactInfoStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Primary Contact
          </CardTitle>
          <CardDescription>
            Main point of contact for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryContactName">Contact Name</Label>
              <Input
                id="primaryContactName"
                value={formData.primaryContactName || ""}
                onChange={(e) =>
                  updateFormData({ primaryContactName: e.target.value })
                }
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryContactPhone">Phone</Label>
              <Input
                id="primaryContactPhone"
                type="tel"
                value={formData.primaryContactPhone || ""}
                onChange={(e) =>
                  updateFormData({ primaryContactPhone: e.target.value })
                }
                placeholder="+44 20 1234 5678"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="primaryContactEmail">Email</Label>
              <Input
                id="primaryContactEmail"
                type="email"
                value={formData.primaryContactEmail || ""}
                onChange={(e) =>
                  updateFormData({ primaryContactEmail: e.target.value })
                }
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1 || ""}
                onChange={(e) =>
                  updateFormData({ addressLine1: e.target.value })
                }
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2 || ""}
                onChange={(e) =>
                  updateFormData({ addressLine2: e.target.value })
                }
                placeholder="Suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => updateFormData({ city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode || ""}
                  onChange={(e) =>
                    updateFormData({ postalCode: e.target.value })
                  }
                  placeholder="SW1A 1AA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || "United Kingdom"}
                onChange={(e) => updateFormData({ country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            placeholder="Any additional information about this client..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
