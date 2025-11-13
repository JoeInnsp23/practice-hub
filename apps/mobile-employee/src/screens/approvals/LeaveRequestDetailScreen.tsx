import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

type LeaveRequestDetailScreenRouteProp = RouteProp<
  ApprovalsStackParamList,
  "LeaveRequestDetail"
>;

type LeaveRequestDetailScreenNavigationProp = StackNavigationProp<
  ApprovalsStackParamList,
  "LeaveRequestDetail"
>;

type Props = {
  route: LeaveRequestDetailScreenRouteProp;
  navigation: LeaveRequestDetailScreenNavigationProp;
};

/**
 * Leave Request Detail Screen - Managers approve/reject leave requests
 * Matches web: app/employee-hub/approvals/leave/[id]/page.tsx
 */
export function LeaveRequestDetailScreen({ route, navigation }: Props) {
  const {
    requestId,
    userName,
    leaveType,
    startDate,
    endDate,
    daysCount,
    notes,
  } = route.params;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComments, setRejectComments] = useState("");

  const utils = trpc.useUtils();
  const approveMutation = trpc.leave.approve.useMutation({
    onSuccess: () => {
      utils.leave.getTeamLeave.invalidate();
      Alert.alert("Success", "Leave request approved", [
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

  const rejectMutation = trpc.leave.reject.useMutation({
    onSuccess: () => {
      utils.leave.getTeamLeave.invalidate();
      setShowRejectModal(false);
      setRejectComments("");
      Alert.alert("Success", "Leave request rejected", [
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
      "Approve Leave Request",
      `Approve ${userName}'s ${formatLeaveType(leaveType)} for ${daysCount} days?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: () => {
            approveMutation.mutate({ requestId });
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
      requestId,
      reviewerComments: rejectComments.trim(),
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Leave Request Review</Text>
          <Text style={styles.subtitle}>{userName}</Text>

          {/* Leave Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Leave Type:</Text>
              <Text style={styles.detailValue}>
                {formatLeaveType(leaveType)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date:</Text>
              <Text style={styles.detailValue}>{formatDate(startDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date:</Text>
              <Text style={styles.detailValue}>{formatDate(endDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {daysCount} {daysCount === 1 ? "day" : "days"}
              </Text>
            </View>

            {notes && (
              <>
                <View style={styles.divider} />
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{notes}</Text>
              </>
            )}
          </View>

          {/* Balance Impact Info */}
          {leaveType === "annual_leave" && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Approving this request will deduct {daysCount}{" "}
                {daysCount === 1 ? "day" : "days"} from the employee's annual
                leave balance.
              </Text>
            </View>
          )}

          {leaveType === "toil" && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Approving this request will deduct {daysCount * 7.5} hours (
                {daysCount} {daysCount === 1 ? "day" : "days"}) from the
                employee's TOIL balance.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
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
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
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
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#0369a1",
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  approveButton: {
    marginBottom: 0,
  },
  rejectButton: {
    marginBottom: 0,
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
