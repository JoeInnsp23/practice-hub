"use client";

import { CheckCircle2, Mail, Phone, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <Card className="glass-card p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            We've received your information and will be in touch soon.
          </p>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </Card>

        {/* What Happens Next */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">We Review Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will review your requirements and prepare a custom
                  proposal tailored to your business needs.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">You'll Receive Your Proposal</h3>
                <p className="text-sm text-muted-foreground">
                  Within 24-48 hours, we'll send you a detailed proposal
                  including pricing and service breakdown.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Schedule a Discovery Call</h3>
                <p className="text-sm text-muted-foreground">
                  We'll reach out to schedule a call to discuss your proposal,
                  answer any questions, and refine the details.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">4</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Once you approve the proposal, we'll begin onboarding and
                  setting up your accounting services.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Expected Timeline */}
        <Card className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Expected Timeline</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Within 2 hours:</strong> You'll receive a confirmation
                email
                <br />
                <strong>Within 24-48 hours:</strong> You'll receive your custom
                proposal
                <br />
                <strong>Within 3-5 days:</strong> We'll schedule your discovery
                call
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Need Immediate Help?</h2>

          <p className="text-sm text-muted-foreground mb-4">
            If you have any urgent questions or need to speak with someone right
            away, please don't hesitate to contact us.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="mailto:hello@innspiredaccountancy.com">
                <Mail className="h-4 w-4" />
                Email Us
              </a>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <a href="tel:+441234567890">
                <Phone className="h-4 w-4" />
                Call Us
              </a>
            </Button>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="link" asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
