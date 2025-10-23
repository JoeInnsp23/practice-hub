/**
 * Sales Stage Automation
 * Automatically determines the appropriate sales stage based on proposal status changes
 */

type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "rejected"
  | "expired";
type SalesStage =
  | "enquiry"
  | "qualified"
  | "proposal_sent"
  | "follow_up"
  | "won"
  | "lost"
  | "dormant";

/**
 * Determines if sales stage should be auto-updated based on status change
 * @param newStatus - The new proposal status
 * @param currentStage - The current sales stage
 * @returns The appropriate sales stage or null if no auto-update needed
 */
export function getAutoSalesStage(
  newStatus: ProposalStatus,
  currentStage: SalesStage,
): SalesStage | null {
  // Terminal statuses always trigger auto-update
  if (newStatus === "signed") {
    return "won";
  }

  if (newStatus === "rejected") {
    return "lost";
  }

  if (newStatus === "expired") {
    return "dormant";
  }

  // Sent status: only auto-update if currently in early stages
  if (newStatus === "sent") {
    if (currentStage === "enquiry" || currentStage === "qualified") {
      return "proposal_sent";
    }
  }

  // Viewed status: only auto-update if currently in proposal_sent
  if (newStatus === "viewed") {
    if (currentStage === "proposal_sent") {
      return "follow_up";
    }
  }

  // No auto-update needed
  return null;
}

/**
 * Checks if a sales stage change was triggered by automation
 * @param oldStatus - The previous proposal status
 * @param newStatus - The new proposal status
 * @param oldStage - The previous sales stage
 * @param newStage - The new sales stage
 * @returns true if the stage change was automated
 */
export function wasStageChangeAutomated(
  oldStatus: ProposalStatus,
  newStatus: ProposalStatus,
  oldStage: SalesStage,
  newStage: SalesStage,
): boolean {
  const autoStage = getAutoSalesStage(newStatus, oldStage);
  return autoStage === newStage && oldStage !== newStage;
}

/**
 * Gets a human-readable description of the automation rule
 * @param status - The proposal status
 * @param stage - The sales stage
 * @returns Description of the automation rule
 */
export function getAutomationReason(
  status: ProposalStatus,
  stage: SalesStage,
): string {
  if (status === "signed" && stage === "won") {
    return "Auto-updated to Won when proposal was signed";
  }

  if (status === "rejected" && stage === "lost") {
    return "Auto-updated to Lost when proposal was rejected";
  }

  if (status === "expired" && stage === "dormant") {
    return "Auto-updated to Dormant when proposal expired";
  }

  if (status === "sent" && stage === "proposal_sent") {
    return "Auto-updated to Proposal Sent when proposal was sent";
  }

  if (status === "viewed" && stage === "follow_up") {
    return "Auto-updated to Follow Up when proposal was viewed";
  }

  return "Sales stage updated";
}

/**
 * Calculates time spent in a sales stage (in days)
 * @param stageStartDate - When the stage began
 * @param stageEndDate - When the stage ended (defaults to now)
 * @returns Number of days in the stage
 */
export function calculateTimeInStage(
  stageStartDate: Date,
  stageEndDate?: Date,
): number {
  const end = stageEndDate || new Date();
  const diff = end.getTime() - stageStartDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
