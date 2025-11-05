"use client";

import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";

interface VATValidationIndicatorProps {
  vatNumber: string;
  clientId?: string;
  onValidationComplete?: (result: {
    isValid: boolean;
    businessName?: string;
  }) => void;
  className?: string;
}

export function VATValidationIndicator({
  vatNumber,
  clientId,
  onValidationComplete,
  className,
}: VATValidationIndicatorProps) {
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "loading" | "valid" | "invalid" | "error"
  >("idle");
  const [businessName, setBusinessName] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const validateVATMutation = trpc.clients.validateVAT.useMutation({
    onSuccess: (result) => {
      if (result.isValid) {
        setValidationStatus("valid");
        setBusinessName(result.businessName);
        toast.success(
          `VAT number validated${result.businessName ? `: ${result.businessName}` : ""}`,
        );
        onValidationComplete?.(result);
      } else {
        setValidationStatus("invalid");
        setErrorMessage(result.error || "VAT number is invalid");
        toast.error(result.error || "VAT number is invalid");
        onValidationComplete?.({ isValid: false });
      }
    },
    onError: (error) => {
      setValidationStatus("error");
      setErrorMessage(error.message);
      toast.error(error.message);
    },
  });

  const handleValidate = () => {
    if (!vatNumber || vatNumber.length < 9) {
      toast.error("Please enter a valid VAT number");
      return;
    }

    setValidationStatus("loading");
    setErrorMessage(undefined);
    validateVATMutation.mutate({
      vatNumber,
      clientId,
    });
  };

  // Don't show anything if VAT number is empty
  if (!vatNumber) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {validationStatus === "idle" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleValidate}
          disabled={validateVATMutation.isPending}
        >
          Validate VAT
        </Button>
      )}

      {validationStatus === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Validating...</span>
        </div>
      )}

      {validationStatus === "valid" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-medium">Valid VAT number</span>
            {businessName && (
              <span className="text-xs text-muted-foreground">
                {businessName}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={validateVATMutation.isPending}
          >
            Re-validate
          </Button>
        </div>
      )}

      {validationStatus === "invalid" && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-medium">Invalid VAT number</span>
            {errorMessage && (
              <span className="text-xs text-muted-foreground">
                {errorMessage}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={validateVATMutation.isPending}
          >
            Retry
          </Button>
        </div>
      )}

      {validationStatus === "error" && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-medium">Validation error</span>
            {errorMessage && (
              <span className="text-xs text-muted-foreground">
                {errorMessage}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={validateVATMutation.isPending}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
