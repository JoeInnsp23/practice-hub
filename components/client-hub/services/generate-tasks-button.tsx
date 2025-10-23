"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GenerationPreviewModal } from "./generation-preview-modal";

interface GenerateTasksButtonProps {
  serviceId: string;
  clientId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Button to trigger auto-generation of tasks from templates
 * Opens preview modal before generation
 */
export function GenerateTasksButton({
  serviceId,
  clientId,
  variant = "outline",
  size = "sm",
  className,
}: GenerateTasksButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Tasks
      </Button>

      {showModal && (
        <GenerationPreviewModal
          serviceId={serviceId}
          clientId={clientId}
          open={showModal}
          onOpenChange={setShowModal}
        />
      )}
    </>
  );
}
