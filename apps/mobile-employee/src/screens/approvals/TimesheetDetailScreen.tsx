import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";
import type { ApprovalsStackParamList } from "../../navigation/types";

type TimesheetDetailScreenRouteProp = RouteProp<
  ApprovalsStackParamList,
  "TimesheetDetail"
>;

type TimesheetDetailScreenNavigationProp = StackNavigationProp<
  ApprovalsStackParamList,
  "TimesheetDetail"
>;

type Props = {
  route: TimesheetDetailScreenRouteProp;
  navigation: TimesheetDetailScreenNavigationProp;
};

/**
 * Timesheet Detail Screen - Managers approve/reject timesheet submissions
 * Matches web: app/employee-hub/approvals/timesheets/[id]/page.tsx
 */
export function TimesheetDetailScreen({ route, navigation }: Props) {
  const { submissionId, userName, weekStartDate, weekEndDate, totalHours } =
    route.params;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComments, setRejectComments] = useState("");

  // Query time entries for this submission
  const {
    data,
    isLoading,
    error,
  } = trpc.timesheets.list.useQuery({});

  const utils = trpc.useUtils();
  const approveMutation = trpc.timesheets.approve.useMutation({
    onSuccess: () => {
      utils.timesheets.getPendingApprovals.invalidate();
      Alert.alert("Success", "Timesheet approved", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const rejectMutation = trpc.timesheets.reject.useMutation({
    onSuccess: () => {
      utils.timesheets.getPendingApprovals.invalidate();
      setShowRejectModal(false);
      setRejectComments("");
      Alert.alert("Success", "Timesheet rejected", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleApprove = () => {
    Alert.alert(
      "Approve Timesheet",
      `Approve ${userName}'s timesheet for ${totalHours}h?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: () => {
            approveMutation.mutate({ submissionId });
          },
        },
      ],
    );
  };

  const handleReject = () => {
    if (rejectComments.trim().length === 0) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    rejectMutation.mutate({
      submissionId,
      comments: rejectComments.trim(),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading timesheet...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading timesheet</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  const timeEntries = data?.timeEntries ?? [];

  // Filter to entries for this submission (by date range)
  const submissionEntries = timeEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);
    return entryDate >= start && entryDate <= end;
  });

  const billableHours = submissionEntries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + Number(e.hours), 0);

  const nonBillableHours = submissionEntries
    .filter((e) => !e.billable)
    .reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={submissionEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryHours}>{item.hours}h</Text>
              {item.billable && (
                <View style={styles.billableBadge}>
                  <Text style={styles.billableText}>Billable</Text>
                </View>
              )}
            </View>
            <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            {item.description && (
              <Text style={styles.entryDescription} numberOfLines={3}>
                {item.description}
              </Text>
            )}
            <Text style={styles.entryMeta}>Type: {item.workType}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Timesheet Review</Text>
            <Text style={styles.headerSubtitle}>{userName}</Text>
            <Text style={styles.weekText}>
              {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Hours:</Text>
                <Text style={styles.summaryValue}>{totalHours}h</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Billable:</Text>
                <Text style={[styles.summaryValue, styles.billableColor]}>
                  {billableHours.toFixed(1)}h
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Non-Billable:</Text>
                <Text style={styles.summaryValue}>
                  {nonBillableHours.toFixed(1)}h
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Entries:</Text>
                <Text style={styles.summaryValue}>
                  {submissionEntries.length}
                </Text>
              </View>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Approve"
              variant="primary"
              onPress={handleApprove}
              loading={approveMutation.isPending}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              style={styles.approveButton}
            />
            <Button
              title="Reject"
              variant="outline"
              onPress={() => setShowRejectModal(true)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              style={styles.rejectButton}
            />
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Timesheet</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection
            </Text>

            <TextInput
              style={styles.modalInput}
              value={rejectComments}
              onChangeText={setRejectComments}
              placeholder="Enter reason..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectComments("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={handleReject}
                disabled={rejectMutation.isPending}
              >
                <Text style={styles.modalRejectText}>
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  weekText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  billableColor: {
    color: COLORS.primary,
  },
  entryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryHours: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  billableBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  billableText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
  },
  entryDate: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  entryMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 16,
    gap: 12,
  },
  approveButton: {
    marginBottom: 0,
  },
  rejectButton: {
    marginBottom: 0,
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
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 100,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalRejectButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalRejectText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
