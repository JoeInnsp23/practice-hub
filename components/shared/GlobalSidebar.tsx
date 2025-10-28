"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  moduleName: _moduleName,
  baseHref,
  navigation,
  sections,
  moduleColor = "#3b82f6",
}: GlobalSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="glass-subtle w-64 min-h-[calc(100vh-4rem)] border-r">
      <div className="p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const href = item.href.startsWith("/")
              ? item.href
              : `${baseHref}/${item.href}`;
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
                    : "text-muted-foreground hover:text-card-foreground hover:bg-muted",
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
        {sections?.map((section, _index) => (
          <div key={section.title}>
            <div className="my-4 h-px bg-border" />
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const href = item.href.startsWith("/")
                  ? item.href
                  : `${baseHref}/${item.href}`;
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
                        : "text-muted-foreground hover:text-card-foreground hover:bg-muted",
                    )}
                    style={
                      isActive ? { backgroundColor: moduleColor } : undefined
                    }
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
