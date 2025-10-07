"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

const organizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export default function OAuthSetupPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
  });

  // Check if user already has a tenant
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!session || isPending) return;

      try {
        const response = await fetch("/api/oauth-setup");
        const data = await response.json();

        if (data.hasTenant) {
          // User already has a tenant, redirect to practice hub
          router.push("/practice-hub");
        } else {
          // Prefill form with user's name from OAuth
          if (session.user.name) {
            const nameParts = session.user.name.split(" ");
            setValue("firstName", nameParts[0] || "");
            setValue("lastName", nameParts.slice(1).join(" ") || "");
          }
          setCheckingStatus(false);
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        toast.error("Failed to load setup page");
        setCheckingStatus(false);
      }
    };

    checkSetupStatus();
  }, [session, isPending, router, setValue]);

  const onSubmit = async (data: OrganizationForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/oauth-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to setup organization");
        return;
      }

      toast.success("Organization setup complete!");
      router.push("/practice-hub");
      router.refresh();
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-bold">
            Complete Your Setup
          </CardTitle>
          <CardDescription className="text-base">
            Please provide your organization details to complete setup
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                placeholder="My Practice"
                {...register("organizationName")}
                disabled={isLoading}
                autoFocus
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
