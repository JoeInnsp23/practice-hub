import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useState } from "react";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";
import { Button } from "../../components/ui/Button";

/**
 * Timesheet Submit Screen - submit current week for approval
 * Matches web: app/employee-hub/timesheets/submit/page.tsx
 */
export function TimesheetSubmitScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // Get current week dates (Monday to Sunday)
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday

    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getCurrentWeek();

  // Query time entries for current week
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.timesheets.list.useQuery({});

  const utils = trpc.useUtils();
  const submitWeek = trpc.timesheets.submit.useMutation({
    onSuccess: () => {
      utils.timesheets.list.invalidate();
      Alert.alert(
        "Success",
        "Timesheet submitted for approval",
        [
          {
            text: "OK",
          },
        ],
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
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
        <Button title="Try Again" onPress={() => refetch()} />
      </View>
    );
  }

  const timeEntries = data?.timeEntries ?? [];

  // Filter to current week only
  const weekEntries = timeEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return entryDate >= start && entryDate <= end;
  });

  // Calculate total hours for the week
  const totalHours = weekEntries.reduce(
    (sum, entry) => sum + Number(entry.hours),
    0,
  );

  const minimumHours = 37.5;
  const canSubmit = totalHours >= minimumHours;

  const handleSubmit = () => {
    Alert.alert(
      "Submit Timesheet",
      `Submit ${totalHours} hours for approval?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: () => {
            submitWeek.mutate({
              weekStartDate: startDate,
              weekEndDate: endDate,
            });
          },
        },
      ],
    );
  };

  if (weekEntries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No time entries this week</Text>
        <Text style={styles.helperText}>
          Log time entries before submitting your timesheet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={weekEntries}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
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
            <Text style={styles.entryDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.entryMeta}>Type: {item.workType}</Text>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Submit Timesheet</Text>
          <Text style={styles.headerSubtitle}>
            Week: {formatDate(startDate)} - {formatDate(endDate)}
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Hours:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  canSubmit ? styles.summarySuccess : styles.summaryWarning,
                ]}
              >
                {totalHours.toFixed(1)}h
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Minimum Required:</Text>
              <Text style={styles.summaryValue}>{minimumHours}h</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Entries:</Text>
              <Text style={styles.summaryValue}>{weekEntries.length}</Text>
            </View>
          </View>

          {!canSubmit && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                You need at least {minimumHours} hours to submit your timesheet.
                You currently have {totalHours.toFixed(1)} hours.
              </Text>
            </View>
          )}

          <Button
            title="Submit for Approval"
            variant="primary"
            onPress={handleSubmit}
            loading={submitWeek.isPending}
            disabled={!canSubmit || submitWeek.isPending}
            style={styles.submitButton}
          />
        </View>
      }
    />
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
  summarySuccess: {
    color: COLORS.primary,
  },
  summaryWarning: {
    color: "#f59e0b",
  },
  warningBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 16,
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
