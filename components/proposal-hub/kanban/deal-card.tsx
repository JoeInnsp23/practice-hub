"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  Calendar,
  FileText,
  Mail,
  Phone,
  Star,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Deal } from "@/app/server/routers/pipeline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const detailUrl =
    deal.type === "lead"
      ? `/proposal-hub/leads/${deal.id}`
      : `/proposal-hub/proposals/${deal.id}`;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={detailUrl}>
        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                {deal.title}
              </h4>
              {deal.companyName && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="line-clamp-1">{deal.companyName}</span>
                </div>
              )}
            </div>
            <Badge variant={deal.type === "lead" ? "secondary" : "default"}>
              {deal.type === "lead" ? (
                <Users className="h-3 w-3 mr-1" />
              ) : (
                <FileText className="h-3 w-3 mr-1" />
              )}
              {deal.type === "lead" ? "Lead" : "Proposal"}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{deal.email}</span>
            </div>
            {deal.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{deal.phone}</span>
              </div>
            )}
          </div>

          {/* Value & Score */}
          <div className="flex items-center justify-between mb-3">
            {deal.value && (
              <div className="text-sm font-semibold text-primary">
                £{Number.parseFloat(deal.value).toLocaleString()}
                {deal.type === "proposal" && (
                  <span className="text-xs text-muted-foreground">/mo</span>
                )}
              </div>
            )}
            {deal.qualificationScore && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-medium">
                  {deal.qualificationScore}/10
                </span>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            {deal.assignedToName ? (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="line-clamp-1">{deal.assignedToName}</span>
              </div>
            ) : (
              <span className="text-muted-foreground/60">Unassigned</span>
            )}
            {deal.nextFollowUpAt && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(deal.nextFollowUpAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
