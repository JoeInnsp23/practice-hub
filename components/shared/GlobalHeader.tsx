"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LucideIcon, Home } from "lucide-react";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { ThemeToggle } from "./theme-toggle";

interface GlobalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  breadcrumbs?: {
    href: string;
    label: string;
    icon?: LucideIcon;
  }[];
  moduleColor?: string;
  moduleName?: string;
  headerColor?: string;
  showBackToHome?: boolean;
}

export function GlobalHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  breadcrumbs,
  moduleColor = "text-slate-900",
  moduleName,
  headerColor,
  showBackToHome = false,
}: GlobalHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 shadow-sm ${
        !headerColor ? "bg-white dark:bg-slate-900" : ""
      }`}
      style={headerColor ? { backgroundColor: headerColor } : undefined}
    >
      <div className="flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center">
          {showBackToHome ? (
            <div className="flex items-center">
              <Link
                href="/practice-hub"
                className="flex items-center hover:bg-white/10 transition-colors h-16"
                style={{ paddingLeft: "28px", paddingRight: "16px" }}
              >
                <Home className="w-5 h-5 text-white" />
              </Link>
              <div className="h-8 w-px bg-white/20 mr-4" />
              <h1 className="text-xl font-semibold text-white">
                {moduleName || title}
              </h1>
            </div>
          ) : (
            <div className="flex items-center space-x-3 px-4 sm:px-6 lg:px-8">
              {Icon && (
                <div
                  className="rounded-lg p-2.5 shadow-md"
                  style={{
                    background: iconColor
                      ? `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)`
                      : "linear-gradient(135deg, #2563eb, #2563ebdd)",
                  }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4 px-4 sm:px-6 lg:px-8">
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
