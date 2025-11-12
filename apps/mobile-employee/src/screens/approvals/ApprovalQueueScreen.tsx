import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";

/**
 * Approval queue screen - for managers to approve timesheets & leave
 * Matches web: app/employee-hub/approvals/page.tsx
 */
export function ApprovalQueueScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Query pending timesheet approvals
  const {
    data: timesheetsData,
    isLoading: timesheetsLoading,
    error: timesheetsError,
    refetch: refetchTimesheets,
  } = trpc.timesheets.getPendingApprovals.useQuery();

  // Query pending leave approvals
  const {
    data: leaveData,
    isLoading: leaveLoading,
    error: leaveError,
    refetch: refetchLeave,
  } = trpc.leave.getTeamLeave.useQuery({ status: "pending" });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTimesheets(), refetchLeave()]);
    setRefreshing(false);
  };

  const isLoading = timesheetsLoading || leaveLoading;
  const hasError = timesheetsError || leaveError;

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </View>
    );
  }

  if (hasError) {
    const errorMessage =
      timesheetsError?.message || leaveError?.message || "Unknown error";

    // Check if it's a permission error
    if (errorMessage.includes("FORBIDDEN")) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Manager Access Required</Text>
          <Text style={styles.helperText}>
            You need manager or admin permissions to view approval queues
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading approvals</Text>
        <Text style={styles.errorDetail}>{errorMessage}</Text>
        <Button title="Try Again" onPress={onRefresh} />
      </View>
    );
  }

  const pendingTimesheets = timesheetsData || [];
  const pendingLeave = leaveData?.requests || [];

  const totalPending = pendingTimesheets.length + pendingLeave.length;

  if (totalPending === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No pending approvals</Text>
        <Text style={styles.helperText}>
          All timesheets and leave requests are up to date
        </Text>
      </View>
    );
  }

  // Prepare sections for SectionList
  const sections = [];

  if (pendingTimesheets.length > 0) {
    sections.push({
      title: `Timesheet Approvals (${pendingTimesheets.length})`,
      data: pendingTimesheets.map((item) => ({ ...item, type: "timesheet" })),
    });
  }

  if (pendingLeave.length > 0) {
    sections.push({
      title: `Leave Approvals (${pendingLeave.length})`,
      data: pendingLeave.map((item) => ({ ...item, type: "leave" })),
    });
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        if (item.type === "timesheet") {
          return (
            <TouchableOpacity
              style={styles.approvalCard}
              onPress={() => {
                // TODO: Navigate to timesheet detail for approval
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.userName}>
                  {item.userName || "Unknown User"}
                </Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.badgeText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.cardDetail}>
                Week ending: {formatDate(item.weekEndDate)}
              </Text>
              <Text style={styles.cardDetail}>
                Total hours: {item.totalHours}h
              </Text>
              <Text style={styles.cardSubtext}>
                Submitted {formatRelativeTime(item.submittedAt)}
              </Text>
            </TouchableOpacity>
          );
        }

        // Leave request
        return (
          <TouchableOpacity
            style={styles.approvalCard}
            onPress={() => {
              // TODO: Navigate to leave detail for approval
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>
                {formatUserName(item.userFirstName, item.userLastName) ||
                  item.userName ||
                  item.userEmail}
              </Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.badgeText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.cardDetail}>
              {formatLeaveType(item.leaveType)}
            </Text>
            <Text style={styles.cardDetail}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
            <Text style={styles.cardDetail}>{item.daysCount} days</Text>
            {item.notes && (
              <Text style={styles.notes} numberOfLines={2}>
                {item.notes}
              </Text>
            )}
            <Text style={styles.cardSubtext}>
              Requested {formatRelativeTime(item.requestedAt)}
            </Text>
          </TouchableOpacity>
        );
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Approval Queue</Text>
          <Text style={styles.headerSubtitle}>
            {totalPending} {totalPending === 1 ? "item" : "items"} pending
          </Text>
        </View>
      }
    />
  );
}

function formatUserName(
  firstName: string | null,
  lastName: string | null,
): string {
  if (!firstName && !lastName) return "";
  return `${firstName || ""} ${lastName || ""}`.trim();
}

function formatLeaveType(type: string): string {
  const types: Record<string, string> = {
    annual_leave: "Annual Leave",
    sick_leave: "Sick Leave",
    toil: "TOIL",
    unpaid: "Unpaid Leave",
    other: "Other",
  };
  return types[type] || type;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }
  return formatDate(dateString);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  approvalCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
    textTransform: "capitalize",
  },
  cardDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
