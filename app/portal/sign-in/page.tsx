"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientPortalSignIn } from "@/lib/client-portal-auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { User } from "lucide-react";

export default function ClientPortalSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await clientPortalSignIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      toast.success("Signed in successfully");

      // Redirect to original page or dashboard
      const from = searchParams.get("from") || "/portal";
      router.push(from);
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Sign in to access your documents and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => toast("Please contact your account manager to reset your password")}
                >
                  Forgot password?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Need access? Contact your account manager for an invitation.
        </p>
      </div>
    </div>
  );
}
