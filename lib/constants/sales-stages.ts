/**
 * Sales stages for Proposals Kanban board
 * Matches proposals.salesStage enum from schema
 */

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Clock,
  Mail,
  Trophy,
  XCircle,
} from "lucide-react";

export type SalesStage =
  | "enquiry"
  | "qualified"
  | "proposal_sent"
  | "follow_up"
  | "won"
  | "lost"
  | "dormant";

export interface SalesStageConfig {
  id: SalesStage;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SALES_STAGES: Record<SalesStage, SalesStageConfig> = {
  enquiry: {
    id: "enquiry",
    label: "Enquiry",
    description: "Initial enquiries and interest",
    icon: CircleDot,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
  qualified: {
    id: "qualified",
    label: "Qualified",
    description: "Qualified and ready for proposal",
    icon: CheckCircle2,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  proposal_sent: {
    id: "proposal_sent",
    label: "Proposal Sent",
    description: "Proposal sent to client",
    icon: Mail,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  follow_up: {
    id: "follow_up",
    label: "Follow Up",
    description: "Following up with client",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  won: {
    id: "won",
    label: "Won",
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
  dormant: {
    id: "dormant",
    label: "Dormant",
    description: "Inactive or expired",
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
};

/**
 * Sales stages in display order for Kanban board
 */
export const SALES_STAGE_ORDER: SalesStage[] = [
  "enquiry",
  "qualified",
  "proposal_sent",
  "follow_up",
  "won",
  "lost",
  "dormant",
];

/**
 * Active stages (not terminal states)
 */
export const ACTIVE_SALES_STAGES: SalesStage[] = [
  "enquiry",
  "qualified",
  "proposal_sent",
  "follow_up",
];

/**
 * Terminal stages (final states)
 */
export const TERMINAL_SALES_STAGES: SalesStage[] = ["won", "lost", "dormant"];

/**
 * Check if a stage is active (not terminal)
 */
export function isActiveSalesStage(stage: SalesStage): boolean {
  return ACTIVE_SALES_STAGES.includes(stage);
}

/**
 * Check if a stage is terminal (final state)
 */
export function isTerminalSalesStage(stage: SalesStage): boolean {
  return TERMINAL_SALES_STAGES.includes(stage);
}
