"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    organizationName: z.string().min(1, "Organization name is required"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service to continue",
    }),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: "You must accept the Privacy Policy to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const acceptTerms = watch("acceptTerms");
  const acceptPrivacy = watch("acceptPrivacy");

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    try {
      // First, create the user account
      const signUpResult = await signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        callbackURL: "/practice-hub",
      });

      if (signUpResult.error) {
        toast.error(signUpResult.error.message || "Failed to create account");
        return;
      }

      // Call our API to complete tenant setup
      const setupResponse = await fetch("/api/setup-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          organizationName: data.organizationName,
        }),
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        toast.error(errorData.error || "Failed to setup organization");
        return;
      }

      toast.success("Account created successfully!");
      router.push("/practice-hub");
      router.refresh();
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignUp = async () => {
    try {
      await signIn.social({
        provider: "microsoft",
        callbackURL: "/oauth-setup", // Will check if tenant setup needed
      });
    } catch (error) {
      console.error("Microsoft sign up error:", error);
      toast.error("Failed to sign up with Microsoft");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-base">
            Get started with Practice Hub by creating your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleMicrosoftSignUp}
            disabled={isLoading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 23 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 0H0V11H11V0Z" fill="#F25022" />
              <path d="M23 0H12V11H23V0Z" fill="#7FBA00" />
              <path d="M11 12H0V23H11V12Z" fill="#00A4EF" />
              <path d="M23 12H12V23H23V12Z" fill="#FFB900" />
            </svg>
            Continue with Microsoft
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
              </span>
            </div>
          </div>
        </CardContent>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pb-6 pt-2">
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
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Legal Acceptance Checkboxes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setValue("acceptTerms", checked === true)
                  }
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I accept the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </Link>
                  </Label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-destructive">
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptPrivacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) =>
                    setValue("acceptPrivacy", checked === true)
                  }
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="acceptPrivacy"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I accept the{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                  {errors.acceptPrivacy && (
                    <p className="text-sm text-destructive">
                      {errors.acceptPrivacy.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-base text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
