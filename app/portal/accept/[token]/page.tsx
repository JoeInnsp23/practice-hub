"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify invitation token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `/api/portal/verify-invitation?token=${token}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired invitation");
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
        setLoading(false);
      } catch (_err) {
        setError("Failed to verify invitation");
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: PasswordForm) => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/portal/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to accept invitation");
      }

      toast.success("Account created successfully!");

      // Redirect to sign-in page
      setTimeout(() => {
        router.push("/portal/sign-in?from=invitation");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Please contact your account manager for assistance or request a
              new invitation.
            </p>
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              Welcome to the Client Portal!
            </CardTitle>
            <CardDescription className="text-center">
              Complete your registration to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invitation Details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">
                  {invitation.firstName} {invitation.lastName}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{invitation.email}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Role:</span>{" "}
                <span className="font-medium capitalize">
                  {invitation.role}
                </span>
              </p>
            </div>

            {/* Password Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a secure password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Continue"
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
