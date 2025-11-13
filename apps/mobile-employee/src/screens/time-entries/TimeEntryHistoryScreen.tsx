import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { trpc } from "@practice-hub/api-client";
import { COLORS } from "../../lib/colors";

/**
 * Time Entry History - Full list of all time entries
 * Matches web: app/employee-hub/timesheets/history/page.tsx
 */
export function TimeEntryHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "billable" | "non-billable">(
    "all",
  );

  const { data, isLoading, error, refetch } = trpc.timesheets.list.useQuery({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading time entries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading entries</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  const timeEntries = data?.timeEntries ?? [];

  // Apply filter
  const filteredEntries =
    filter === "all"
      ? timeEntries
      : timeEntries.filter((entry) => {
          if (filter === "billable") return entry.billable;
          if (filter === "non-billable") return !entry.billable;
          return true;
        });

  if (timeEntries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No time entries yet</Text>
        <Text style={styles.helperText}>
          Start logging your time to see entries here
        </Text>
      </View>
    );
  }

  // Calculate totals
  const totalHours = filteredEntries.reduce(
    (sum, entry) => sum + Number(entry.hours),
    0,
  );
  const billableHours = timeEntries
    .filter((e) => e.billable)
    .reduce((sum, entry) => sum + Number(entry.hours), 0);
  const nonBillableHours = timeEntries
    .filter((e) => !e.billable)
    .reduce((sum, entry) => sum + Number(entry.hours), 0);

  return (
    <FlatList
      style={styles.container}
      data={filteredEntries}
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
          <View style={styles.cardHeader}>
            <Text style={styles.hoursValue}>{item.hours}h</Text>
            <View style={styles.badges}>
              {item.billable && (
                <View style={styles.billableBadge}>
                  <Text style={styles.billableText}>Billable</Text>
                </View>
              )}
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.dateText}>{formatDate(item.date)}</Text>

          {item.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Type: {item.workType}</Text>
          </View>
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Time Entry History</Text>
          <Text style={styles.headerSubtitle}>
            {filteredEntries.length} entries
          </Text>

          {/* Filter Buttons */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "all" && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "billable" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("billable")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "billable" && styles.filterButtonTextActive,
                ]}
              >
                Billable
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "non-billable" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("non-billable")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "non-billable" && styles.filterButtonTextActive,
                ]}
              >
                Non-Billable
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Hours:</Text>
              <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
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
          </View>
        </View>
      }
    />
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "approved":
      return styles.statusApproved;
    case "submitted":
      return styles.statusSubmitted;
    case "draft":
      return styles.statusDraft;
    case "rejected":
      return styles.statusRejected;
    default:
      return styles.statusDraft;
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  hoursValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
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
  statusSubmitted: {
    backgroundColor: "#dbeafe",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaText: {
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
