"use client";

import { WizardFormData } from "../client-wizard-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  FileText,
  DollarSign,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

interface ReviewStepProps {
  formData: WizardFormData;
  onEdit?: (stepIndex: number) => void;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const selectedServiceNames =
    formData.selectedServices?.map((service) =>
      service.serviceId.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
        <CheckCircle2 className="h-5 w-5" />
        <p className="font-medium">
          Ready to save! Please review the information below.
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client Code:</span>
              <p className="font-medium">
                {formData.clientCode || "Not provided"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{formData.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium capitalize">
                {formData.type.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={formData.status === "active" ? "default" : "secondary"}
              >
                {formData.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Services */}
      {selectedServiceNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Selected Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedServiceNames.map((service) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      {formData.billingStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Billing Strategy:</span>{" "}
                <span className="font-medium capitalize">
                  {formData.billingStrategy}
                </span>
              </p>
              {formData.billingStrategy === "ad_hoc_hourly" &&
                formData.defaultHourlyRate && (
                  <p>
                    <span className="text-muted-foreground">Hourly Rate:</span>{" "}
                    <span className="font-medium">
                      £{formData.defaultHourlyRate}/hr
                    </span>
                  </p>
                )}
              {formData.billingStrategy === "monthly_retainer" &&
                formData.monthlyRetainer && (
                  <p>
                    <span className="text-muted-foreground">
                      Monthly Retainer:
                    </span>{" "}
                    <span className="font-medium">
                      £{formData.monthlyRetainer}/mo
                    </span>
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Details */}
      {(formData.companiesHouseNumber ||
        formData.vatNumber ||
        formData.utr) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formData.companiesHouseNumber && (
                <div>
                  <span className="text-muted-foreground">
                    Companies House:
                  </span>
                  <p className="font-medium">{formData.companiesHouseNumber}</p>
                </div>
              )}
              {formData.vatNumber && (
                <div>
                  <span className="text-muted-foreground">VAT Number:</span>
                  <p className="font-medium">{formData.vatNumber}</p>
                </div>
              )}
              {formData.utr && (
                <div>
                  <span className="text-muted-foreground">UTR:</span>
                  <p className="font-medium">{formData.utr}</p>
                </div>
              )}
              {formData.payeReference && (
                <div>
                  <span className="text-muted-foreground">PAYE Reference:</span>
                  <p className="font-medium">{formData.payeReference}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directors & Shareholders */}
      {((formData.directors && formData.directors.length > 0) ||
        (formData.shareholders && formData.shareholders.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Directors & Shareholders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.directors && formData.directors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Directors ({formData.directors.length})
                </p>
                <div className="space-y-1">
                  {formData.directors.map((director) => (
                    <div key={director.id} className="text-sm">
                      {director.name} - {director.role}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.shareholders && formData.shareholders.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Shareholders ({formData.shareholders.length})
                </p>
                <div className="space-y-1">
                  {formData.shareholders.map((shareholder) => (
                    <div key={shareholder.id} className="text-sm">
                      {shareholder.name} - {shareholder.percentage}%
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {(formData.primaryContactName || formData.addressLine1) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.primaryContactName && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Primary Contact:</p>
                <p className="font-medium">{formData.primaryContactName}</p>
                {formData.primaryContactEmail && (
                  <p>{formData.primaryContactEmail}</p>
                )}
                {formData.primaryContactPhone && (
                  <p>{formData.primaryContactPhone}</p>
                )}
              </div>
            )}
            {formData.addressLine1 && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Address:</p>
                <p>{formData.addressLine1}</p>
                {formData.addressLine2 && <p>{formData.addressLine2}</p>}
                {formData.city && (
                  <p>
                    {formData.city}, {formData.postalCode}
                  </p>
                )}
                {formData.country && <p>{formData.country}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
