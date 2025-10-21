"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SalesStage } from "@/lib/constants/sales-stages";
import { SALES_STAGES } from "@/lib/constants/sales-stages";
import { ProposalCard } from "./proposal-card";

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

interface SalesKanbanColumnProps {
  stage: SalesStage;
  proposals: Proposal[];
  totalValue: number;
}

export function SalesKanbanColumn({
  stage,
  proposals,
  totalValue,
}: SalesKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const config = SALES_STAGES[stage];
  const Icon: LucideIcon = config.icon;

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div
        className={`glass-subtle p-4 rounded-t-lg border-b-2 ${config.borderColor}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <h3 className="font-semibold text-foreground">{config.label}</h3>
          </div>
          <Badge variant="secondary">{proposals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {config.description}
        </p>
        {totalValue > 0 && (
          <div className="mt-2 text-sm font-semibold text-primary">
            £{totalValue.toLocaleString()}/mo
          </div>
        )}
      </div>

      {/* Droppable Column Body */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[600px] p-4 space-y-3 rounded-b-lg
          transition-colors
          ${isOver ? `${config.bgColor} border-2 ${config.borderColor}` : "bg-muted/20"}
        `}
      >
        <SortableContext
          items={proposals.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {proposals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No {config.label.toLowerCase()} proposals
            </div>
          ) : (
            proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
