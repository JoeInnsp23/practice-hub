/**
 * Pipeline stages for Kanban board
 * Matches lead.status and proposal.status enums from schema
 */

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Handshake,
  PhoneCall,
  Trophy,
  XCircle,
} from "lucide-react";

export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiating"
  | "converted"
  | "lost";

export interface StageConfig {
  id: PipelineStage;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PIPELINE_STAGES: Record<PipelineStage, StageConfig> = {
  new: {
    id: "new",
    label: "New",
    description: "Newly captured leads",
    icon: Circle,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
  contacted: {
    id: "contacted",
    label: "Contacted",
    description: "Initial contact made",
    icon: PhoneCall,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  qualified: {
    id: "qualified",
    label: "Qualified",
    description: "Lead qualified and promising",
    icon: CheckCircle2,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  proposal_sent: {
    id: "proposal_sent",
    label: "Proposal Sent",
    description: "Proposal delivered to client",
    icon: FileText,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  negotiating: {
    id: "negotiating",
    label: "Negotiating",
    description: "In active negotiation",
    icon: Handshake,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  converted: {
    id: "converted",
    label: "Converted",
    description: "Successfully won",
    icon: Trophy,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
  },
  lost: {
    id: "lost",
    label: "Lost",
    description: "Lost to competition or declined",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-300 dark:border-red-700",
  },
};

/**
 * Pipeline stages in display order for Kanban board
 */
export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "converted",
  "lost",
];

/**
 * Active stages (not terminal states)
 */
export const ACTIVE_STAGES: PipelineStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
];

/**
 * Terminal stages (final states)
 */
export const TERMINAL_STAGES: PipelineStage[] = ["converted", "lost"];

/**
 * Check if a stage is active (not terminal)
 */
export function isActiveStage(stage: PipelineStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

/**
 * Check if a stage is terminal (final state)
 */
export function isTerminalStage(stage: PipelineStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

/**
 * Get next stage in pipeline (null if no logical next stage)
 */
export function getNextStage(
  currentStage: PipelineStage,
): PipelineStage | null {
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= PIPELINE_STAGE_ORDER.length - 1) {
    return null;
  }
  return PIPELINE_STAGE_ORDER[currentIndex + 1];
}

/**
 * Get previous stage in pipeline (null if no logical previous stage)
 */
export function getPreviousStage(
  currentStage: PipelineStage,
): PipelineStage | null {
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return PIPELINE_STAGE_ORDER[currentIndex - 1];
}
