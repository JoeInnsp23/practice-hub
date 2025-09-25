"use client";

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  status?: "active" | "coming-soon";
  onClick?: () => void;
  className?: string;
}

export function AppCard({
  title,
  description,
  icon: Icon,
  color,
  status = "active",
  onClick,
  className,
}: AppCardProps) {
  const isComingSoon = status === "coming-soon";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        "hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-2xl dark:hover:shadow-slate-900/50",
        isComingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
      onClick={!isComingSoon ? onClick : undefined}
    >
      {/* Card Content */}
      <div className="relative p-6">
        {/* Icon Container */}
        <div
          className="mb-4 inline-flex rounded-xl p-3 shadow-md transition-all duration-300 group-hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          }}
        >
          <Icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {description}
        </p>

        {/* Status Badge */}
        {isComingSoon && (
          <Badge
            variant="secondary"
            className="absolute right-4 top-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
          >
            Coming Soon
          </Badge>
        )}
      </div>

      {/* Glass Hover Tint Overlay */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}25)`,
        }}
      />

      {/* Bottom Highlight Line */}
      <div
        className="absolute bottom-0 left-0 h-1 w-full transform scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}66)`,
        }}
      />
    </Card>
  );
}
