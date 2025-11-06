"use client";

import { HelpCircle, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NeedHelpCard() {
  return (
    <Card className="glass-card shadow-medium p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            We're here to support you
          </p>
        </div>
      </div>

      {/* Support options */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium">Email Support</p>
            <a
              href="mailto:support@practicehub.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@practicehub.com
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium">Phone Support</p>
            <a
              href="tel:+441234567890"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              +44 (0) 123 456 7890
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium">Live Chat</p>
            <p className="text-muted-foreground text-xs">
              Available Mon-Fri, 9am-5pm GMT
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button asChild className="w-full" variant="outline">
        <Link href="/admin-hub/feedback">Contact Support</Link>
      </Button>
    </Card>
  );
}
