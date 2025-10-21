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
import type { SalesStage } from "@/lib/constants/sales-stages";
import { SALES_STAGE_ORDER } from "@/lib/constants/sales-stages";
import { ProposalCard } from "./proposal-card";
import { SalesKanbanColumn } from "./sales-kanban-column";

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

interface SalesKanbanBoardProps {
  proposalsByStage: Record<SalesStage, Proposal[]>;
}

export function SalesKanbanBoard({
  proposalsByStage,
}: SalesKanbanBoardProps) {
  const utils = trpc.useUtils();
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
  );

  const updateSalesStage = trpc.proposals.updateSalesStage.useMutation({
    onSuccess: () => {
      toast.success("Proposal moved successfully");
      utils.proposals.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move proposal");
    },
  });

  const handleDragStart = (event: DragEndEvent) => {
    const proposalId = event.active.id as string;

    // Find the proposal being dragged
    for (const stage of SALES_STAGE_ORDER) {
      const proposal = proposalsByStage[stage].find((p) => p.id === proposalId);
      if (proposal) {
        setActiveProposal(proposal);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProposal(null);

    if (!over) return;

    const proposalId = active.id as string;
    const newStage = over.id as SalesStage;

    // Find the proposal being moved
    let proposal: Proposal | undefined;
    let currentStage: SalesStage | undefined;

    for (const stage of SALES_STAGE_ORDER) {
      proposal = proposalsByStage[stage].find((p) => p.id === proposalId);
      if (proposal) {
        currentStage = stage;
        break;
      }
    }

    if (!proposal || !currentStage) {
      console.error("Proposal not found");
      return;
    }

    // Don't do anything if dropped in same column
    if (currentStage === newStage) {
      return;
    }

    // Update the sales stage
    updateSalesStage.mutate({
      id: proposalId,
      salesStage: newStage,
    });
  };

  const handleDragCancel = () => {
    setActiveProposal(null);
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
        {SALES_STAGE_ORDER.map((stage) => {
          const proposals = proposalsByStage[stage];
          const totalValue = proposals.reduce((sum, proposal) => {
            const value = Number.parseFloat(proposal.monthlyTotal || "0");
            return sum + value;
          }, 0);

          return (
            <SalesKanbanColumn
              key={stage}
              stage={stage}
              proposals={proposals}
              totalValue={totalValue}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProposal ? (
          <div className="rotate-3 scale-105">
            <ProposalCard proposal={activeProposal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
