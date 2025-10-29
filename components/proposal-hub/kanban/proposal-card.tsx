"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Building2, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Proposal {
  id: string;
  proposalNumber: string;
  title: string;
  clientName: string | null;
  monthlyTotal: string;
  salesStage: string;
  status: string;
  validUntil: Date | null;
  createdAt: Date;
}

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: proposal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const detailUrl = `/proposal-hub/proposals/${proposal.id}`;

  // Calculate days since created
  const getDaysOld = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysOld = getDaysOld(proposal.createdAt);

  // Status badge variants
  const statusVariants: Record<
    string,
    {
      variant: "default" | "secondary" | "outline" | "destructive";
      color: string;
    }
  > = {
    draft: { variant: "secondary", color: "text-slate-600" },
    sent: { variant: "default", color: "text-blue-600" },
    viewed: { variant: "default", color: "text-indigo-600" },
    signed: { variant: "default", color: "text-green-600" },
    rejected: { variant: "destructive", color: "text-red-600" },
    expired: { variant: "outline", color: "text-orange-600" },
  };

  const statusConfig = statusVariants[proposal.status] || statusVariants.draft;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={detailUrl}>
        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                {proposal.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.proposalNumber}
              </p>
            </div>
            <Badge
              variant={statusConfig.variant}
              className={`${statusConfig.color} ml-2 flex-shrink-0`}
            >
              <FileText className="h-3 w-3 mr-1" />
              {proposal.status.charAt(0).toUpperCase() +
                proposal.status.slice(1)}
            </Badge>
          </div>

          {/* Client Info */}
          <div className="space-y-1 mb-3">
            {proposal.clientName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{proposal.clientName}</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-3">
            <div className="text-sm font-semibold text-primary">
              £{Number.parseFloat(proposal.monthlyTotal).toLocaleString()}
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-2">
              {proposal.validUntil && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Valid until {format(new Date(proposal.validUntil), "MMM d")}
                  </span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground/70">
              {daysOld} {daysOld === 1 ? "day" : "days"} old
            </span>
          </div>
        </Card>
      </Link>
    </div>
  );
}
