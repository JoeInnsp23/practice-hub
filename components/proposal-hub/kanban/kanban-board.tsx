"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import type { Deal } from "@/app/server/routers/pipeline";
import type { PipelineStage } from "@/lib/constants/pipeline-stages";
import { PIPELINE_STAGE_ORDER } from "@/lib/constants/pipeline-stages";
import { DealCard } from "./deal-card";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
  dealsByStage: Record<PipelineStage, Deal[]>;
}

export function KanbanBoard({ dealsByStage }: KanbanBoardProps) {
  const utils = trpc.useUtils();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
  );

  const updateStage = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Deal moved successfully");
      utils.pipeline.getDeals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move deal");
    },
  });

  const handleDragStart = (event: DragEndEvent) => {
    const dealId = event.active.id as string;

    // Find the deal being dragged
    for (const stage of PIPELINE_STAGE_ORDER) {
      const deal = dealsByStage[stage].find((d) => d.id === dealId);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as PipelineStage;

    // Find the deal being moved
    let deal: Deal | undefined;
    let currentStage: PipelineStage | undefined;

    for (const stage of PIPELINE_STAGE_ORDER) {
      deal = dealsByStage[stage].find((d) => d.id === dealId);
      if (deal) {
        currentStage = stage;
        break;
      }
    }

    if (!deal || !currentStage) {
      console.error("Deal not found");
      return;
    }

    // Don't do anything if dropped in same column
    if (currentStage === newStage) {
      return;
    }

    // Update the stage
    updateStage.mutate({
      dealId,
      dealType: deal.type,
      newStage,
    });
  };

  const handleDragCancel = () => {
    setActiveDeal(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGE_ORDER.map((stage) => {
          const deals = dealsByStage[stage];
          const totalValue = deals.reduce((sum, deal) => {
            const value = Number.parseFloat(deal.value || "0");
            return sum + value;
          }, 0);

          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={deals}
              totalValue={totalValue}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-3 scale-105">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
