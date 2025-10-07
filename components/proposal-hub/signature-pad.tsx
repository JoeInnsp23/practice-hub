"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onSave, disabled = false }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty());
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Your Signature</h3>
          <p className="text-sm text-muted-foreground">
            Please sign in the box below using your mouse or touchscreen
          </p>
        </div>

        <div
          className="border-2 border-dashed border-border rounded-lg bg-white dark:bg-slate-950 relative overflow-hidden"
          style={{ touchAction: "none" }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 600,
              height: 200,
              className: "w-full h-full cursor-crosshair",
              style: { touchAction: "none" },
            }}
            backgroundColor="transparent"
            penColor="currentColor"
            onEnd={handleEnd}
          />

          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">
                Sign here
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clear}
            disabled={disabled || isEmpty}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={disabled || isEmpty}
            className="ml-auto"
          >
            Confirm Signature
          </Button>
        </div>
      </div>
    </Card>
  );
}
