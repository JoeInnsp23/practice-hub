"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { Building2, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
import { FloatingLabelInput } from "@/components/ui/input-floating";
import { signIn } from "@/lib/auth-client";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import { ThemeToggle } from "@/components/landing/theme-toggle";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/practice-hub";

  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: from,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        return;
      }

      setIsSuccess(true);
      toast.success("Welcome back!");
      // Small delay to show success state before redirect
      setTimeout(() => {
        router.push(from);
        router.refresh();
      }, 500);
    } catch (error) {
      // Error already handled by result.error above
      // Only log if it's an unexpected error type
      if (error instanceof Error && !error.message.includes("Invalid")) {
        Sentry.captureException(error, {
          tags: { operation: "sign_in", component: "SignInPage" },
        });
      }
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsMicrosoftLoading(true);
    try {
      await signIn.social({
        provider: "microsoft",
        callbackURL: "/oauth-setup", // Will check if tenant setup needed
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: "microsoft_sign_in",
          component: "SignInPage",
        },
      });
      toast.error("Failed to sign in with Microsoft");
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)] flex max-w-screen overflow-x-hidden">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Left side - Branding/Hero section */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-teal-800/5 to-transparent" />
        <div className="relative z-10">
          <div
            className="mb-12 animate-fade-in"
            style={{ animationDelay: "0s", opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Practice Hub
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              Welcome back
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Sign in to access your practice management platform and streamline
              your workflow.
            </p>
          </div>

          <div
            className="space-y-8 mt-20 animate-fade-in"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Secure & Private
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your data is encrypted and protected with enterprise-grade
                  security.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Streamlined Workflow
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage clients, proposals, and tasks all in one integrated
                  platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-10 min-w-0">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div
            className="lg:hidden mb-8 text-center animate-fade-in"
            style={{ animationDelay: "0s", opacity: 0 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Practice Hub
              </h1>
            </div>
          </div>

          <Card className="glass-card w-full animate-lift-in shadow-xl rounded-3xl" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
              <CardTitle className="text-2xl font-bold">
                Sign in to your account
              </CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access Practice Hub
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8 md:px-10">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 animate-fade-in border-2"
                style={{ animationDelay: "0.2s", opacity: 0 }}
                onClick={handleMicrosoftSignIn}
                disabled={isLoading || isMicrosoftLoading}
                isLoading={isMicrosoftLoading}
                loadingText="Connecting to Microsoft..."
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Microsoft logo"
                >
                  <title>Microsoft logo</title>
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
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>
            </CardContent>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 px-8 pt-2 md:px-10">
                <div
                  className="animate-fade-in"
                  style={{ animationDelay: "0.3s", opacity: 0 }}
                >
                  <FloatingLabelInput
                    id="email"
                    type="email"
                    label="Email address"
                    {...register("email")}
                    disabled={isLoading || isSuccess}
                    autoComplete="email"
                    autoFocus
                    error={errors.email?.message}
                    success={isSuccess}
                    moduleColor={HUB_COLORS["practice-hub"]}
                  />
                </div>

                <div
                  className="animate-fade-in"
                  style={{ animationDelay: "0.4s", opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline font-medium ml-auto"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FloatingLabelInput
                    id="password"
                    type="password"
                    label="Password"
                    {...register("password")}
                    disabled={isLoading || isSuccess}
                    autoComplete="current-password"
                    error={errors.password?.message}
                    success={isSuccess}
                    moduleColor={HUB_COLORS["practice-hub"]}
                    showPasswordToggle
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium animate-fade-in"
                  style={{ animationDelay: "0.5s", opacity: 0 }}
                  disabled={isLoading || isSuccess}
                  isLoading={isLoading}
                  loadingText="Signing in..."
                >
                  {isSuccess ? "Success!" : "Sign in"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <SignInFormContent />
    </Suspense>
  );
}
