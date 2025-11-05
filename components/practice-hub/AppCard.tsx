"use client";

import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardInteractive } from "@/components/ui/card-interactive";
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
    <CardInteractive
      moduleColor={color}
      onClick={!isComingSoon ? onClick : undefined}
      ariaLabel={`Navigate to ${title}`}
      className={cn(
        "group w-full",
        isComingSoon && "cursor-not-allowed opacity-60",
        className,
      )}
    >
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
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      {/* Status Badge */}
      {isComingSoon && (
        <Badge
          variant="secondary"
          className="absolute right-4 top-4 bg-secondary text-secondary-foreground border"
        >
          Coming Soon
        </Badge>
      )}

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
    </CardInteractive>
  );
}
