"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface GlobalSidebarProps {
  moduleName: string;
  baseHref: string;
  navigation: NavigationItem[];
  sections?: NavigationSection[];
  moduleColor?: string;
}

export function GlobalSidebar({
  moduleName,
  baseHref,
  navigation,
  sections,
  moduleColor = "#3b82f6",
}: GlobalSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white dark:bg-slate-800 shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-slate-700">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          {moduleName}
        </h2>

        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const href = item.href.startsWith("/") ? item.href : `${baseHref}/${item.href}`;
            const isActive = pathname === href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                )}
                style={isActive ? { backgroundColor: moduleColor } : undefined}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Additional Sections */}
        {sections?.map((section, index) => (
          <div key={section.title}>
            <div className="my-4 h-px bg-gray-200 dark:bg-slate-600" />
            <p className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const href = item.href.startsWith("/") ? item.href : `${baseHref}/${item.href}`;
                const isActive = pathname === href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    )}
                    style={isActive ? { backgroundColor: moduleColor } : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}