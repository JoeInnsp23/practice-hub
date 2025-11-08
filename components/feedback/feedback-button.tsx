"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HUB_COLORS, type HubName } from "@/lib/utils/hub-colors";
import { FeedbackModal } from "./feedback-modal";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Detect current hub from pathname
  const currentHub = pathname?.split("/")[1] as HubName | undefined;
  const hubColor =
    currentHub && HUB_COLORS[currentHub] ? HUB_COLORS[currentHub] : undefined;

  return (
    <>
      <div
        data-hub-root={hubColor ? true : undefined}
        style={
          hubColor
            ? ({ "--hub-color": hubColor } as React.CSSProperties)
            : undefined
        }
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 shadow-lg z-50"
          size="lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </div>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
