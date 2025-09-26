"use client";

import Link from "next/link";
import { ChevronLeft, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { DateTimeDisplay } from "@/components/shared/DateTimeDisplay";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border shadow-sm bg-white dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between">
        {/* Left Section - matches GlobalHeader structure */}
        <div className="flex items-center">
          <div className="flex items-center space-x-3 px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-lg p-2.5 shadow-md"
              style={{
                background: "linear-gradient(135deg, #f97316, #f97316dd)",
              }}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">
                Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground">
                System Administration
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - matches GlobalHeader structure */}
        <div className="flex items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/practice-hub">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">Users</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/feedback">Feedback</Link>
            </Button>
          </nav>
          <DateTimeDisplay />
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
