"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/practice-hub",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/practice-hub/clients",
    icon: Users,
  },
  {
    name: "Tasks",
    href: "/practice-hub/tasks",
    icon: CheckSquare,
  },
  {
    name: "Documents",
    href: "/practice-hub/documents",
    icon: FolderOpen,
  },
];

const timeManagement = [
  {
    name: "Time Entry",
    href: "/practice-hub/time-entry",
    icon: Clock,
  },
  {
    name: "Time Tracking",
    href: "/practice-hub/time-tracking",
    icon: Calendar,
  },
  {
    name: "Timesheet",
    href: "/practice-hub/timesheet",
    icon: FileText,
  },
];

const financial = [
  {
    name: "Invoices",
    href: "/practice-hub/invoices",
    icon: DollarSign,
  },
  {
    name: "Reports",
    href: "/practice-hub/reports",
    icon: BarChart3,
  },
];

const system = [
  {
    name: "Settings",
    href: "/practice-hub/settings",
    icon: Settings,
  },
];

export function PracticeHubSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {isOpen && (
            <Link href="/practice-hub" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Practice Hub</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-8 w-8", !isOpen && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !isOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {isOpen && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Time Management Section */}
            {isOpen && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Time Management
                  </p>
                  {timeManagement.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* Financial Section */}
            {isOpen && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Financial
                  </p>
                  {financial.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* System Section */}
            {isOpen && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    System
                  </p>
                  {system.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}