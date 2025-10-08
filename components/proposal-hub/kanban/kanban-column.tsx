"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { LucideIcon } from "lucide-react";
import type { Deal } from "@/app/server/routers/pipeline";
import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/lib/constants/pipeline-stages";
import { PIPELINE_STAGES } from "@/lib/constants/pipeline-stages";
import { DealCard } from "./deal-card";

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
}

export function KanbanColumn({ stage, deals, totalValue }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const config = PIPELINE_STAGES[stage];
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
          <Badge variant="secondary">{deals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {config.description}
        </p>
        {totalValue > 0 && (
          <div className="mt-2 text-sm font-semibold text-primary">
            £{totalValue.toLocaleString()}
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
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No {config.label.toLowerCase()} deals
            </div>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
