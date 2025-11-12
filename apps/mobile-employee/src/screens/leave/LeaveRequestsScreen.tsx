import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import type { StackNavigationProp } from "@react-navigation/stack";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";
import type { LeaveStackParamList } from "../../navigation/types";

type LeaveRequestsScreenNavigationProp = StackNavigationProp<
  LeaveStackParamList,
  "LeaveRequests"
>;

type Props = {
  navigation: LeaveRequestsScreenNavigationProp;
};

/**
 * Leave requests screen - view and manage leave requests
 * Matches web: app/employee-hub/leave/page.tsx
 */
export function LeaveRequestsScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = trpc.leave.getHistory.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading leave requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading leave requests</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
        <Button title="Try Again" onPress={() => refetch()} />
      </View>
    );
  }

  const requests = data?.requests || [];

  if (requests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No leave requests yet</Text>
        <Text style={styles.helperText}>
          Request leave to see your requests here
        </Text>
        <Button
          title="Request Leave"
          variant="primary"
          onPress={() => navigation.navigate("LeaveRequestForm")}
          style={styles.actionButton}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={requests}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.requestCard}
          onPress={() => {
            // TODO: Navigate to request detail
          }}
        >
          <View style={styles.requestHeader}>
            <Text style={styles.requestType}>
              {formatLeaveType(item.leaveType)}
            </Text>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.requestDates}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
          <Text style={styles.requestDays}>{item.daysCount} days</Text>
          {item.notes && (
            <Text style={styles.requestNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
        </TouchableOpacity>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Leave Requests</Text>
          <Text style={styles.headerSubtitle}>{requests.length} requests</Text>
          <Button
            title="Request Leave"
            variant="primary"
            onPress={() => navigation.navigate("LeaveRequestForm")}
            style={styles.headerButton}
          />
        </View>
      }
    />
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
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "approved":
      return styles.statusApproved;
    case "pending":
      return styles.statusPending;
    case "rejected":
      return styles.statusRejected;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusPending;
  }
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
    marginBottom: 16,
  },
  headerButton: {
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusApproved: {
    backgroundColor: "#d1fae5",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
  },
  statusCancelled: {
    backgroundColor: "#e5e7eb",
  },
  requestDates: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  requestDays: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  requestNotes: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
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
    marginBottom: 24,
  },
  actionButton: {
    minWidth: 200,
  },
});
